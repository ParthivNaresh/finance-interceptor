from __future__ import annotations

import time
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING, Any
from uuid import UUID

from models.enums import ComputationStatus, PeriodType
from services.analytics.income_detector import (
    CONFIDENCE_THRESHOLD_AUTO_INCLUDE,
    DetectedIncomeSource,
    IncomeDetector,
)
from services.analytics.period_calculator import (
    get_current_period_start,
    get_period_bounds,
    get_periods_in_range,
    get_previous_period_start,
)
from services.analytics.transfer_detector import TransferDetector

if TYPE_CHECKING:
    from repositories.cash_flow_metrics import CashFlowMetricsRepository
    from repositories.income_source import IncomeSourceRepository
    from repositories.recurring_stream import RecurringStreamRepository
    from repositories.transaction import TransactionRepository


COMPUTATION_TYPE_CASH_FLOW = "cash_flow"


@dataclass
class CashFlowMetrics:
    user_id: UUID
    period_start: date
    total_income: Decimal
    total_expenses: Decimal
    net_cash_flow: Decimal
    savings_rate: Decimal | None
    recurring_expenses: Decimal
    discretionary_expenses: Decimal
    income_sources_count: int
    expense_categories_count: int
    largest_expense_category: str | None
    largest_expense_amount: Decimal | None


@dataclass
class CashFlowComputationResult:
    status: ComputationStatus
    periods_computed: int
    income_sources_detected: int
    transactions_processed: int
    computation_time_ms: int
    error_message: str | None = None


class CashFlowAggregator:
    def __init__(
        self,
        transaction_repo: TransactionRepository,
        recurring_stream_repo: RecurringStreamRepository,
        cash_flow_repo: CashFlowMetricsRepository,
        income_source_repo: IncomeSourceRepository,
        income_detector: IncomeDetector,
        transfer_detector: TransferDetector,
    ) -> None:
        self._transaction_repo = transaction_repo
        self._recurring_stream_repo = recurring_stream_repo
        self._cash_flow_repo = cash_flow_repo
        self._income_source_repo = income_source_repo
        self._income_detector = income_detector
        self._transfer_detector = transfer_detector

    def compute_for_user(
        self,
        user_id: UUID,
        force_full_recompute: bool = False,
    ) -> CashFlowComputationResult:
        start_time = time.monotonic()

        try:
            income_result = self._income_detector.detect_income_sources(user_id)
            self._persist_income_sources(user_id, income_result.sources)

            if force_full_recompute:
                result = self._full_recompute(user_id, income_result.sources)
            else:
                result = self._incremental_compute(user_id, income_result.sources)

            duration_ms = int((time.monotonic() - start_time) * 1000)

            return CashFlowComputationResult(
                status=ComputationStatus.SUCCESS,
                periods_computed=result.periods_computed,
                income_sources_detected=income_result.total_sources,
                transactions_processed=result.transactions_processed,
                computation_time_ms=duration_ms,
            )

        except Exception:
            duration_ms = int((time.monotonic() - start_time) * 1000)
            return CashFlowComputationResult(
                status=ComputationStatus.FAILED,
                periods_computed=0,
                income_sources_detected=0,
                transactions_processed=0,
                computation_time_ms=duration_ms,
                error_message="Cash flow computation failed",
            )

    def compute_current_month(self, user_id: UUID) -> CashFlowComputationResult:
        start_time = time.monotonic()

        try:
            income_result = self._income_detector.detect_income_sources(user_id)
            self._persist_income_sources(user_id, income_result.sources)

            current_period_start = get_current_period_start(PeriodType.MONTHLY)
            metrics = self._compute_period(user_id, current_period_start, income_result.sources)

            if metrics:
                self._cash_flow_repo.upsert(metrics)

            duration_ms = int((time.monotonic() - start_time) * 1000)

            return CashFlowComputationResult(
                status=ComputationStatus.SUCCESS,
                periods_computed=1 if metrics else 0,
                income_sources_detected=income_result.total_sources,
                transactions_processed=0,
                computation_time_ms=duration_ms,
            )

        except Exception:
            duration_ms = int((time.monotonic() - start_time) * 1000)
            return CashFlowComputationResult(
                status=ComputationStatus.FAILED,
                periods_computed=0,
                income_sources_detected=0,
                transactions_processed=0,
                computation_time_ms=duration_ms,
                error_message="Cash flow computation failed",
            )

    def _full_recompute(
        self,
        user_id: UUID,
        income_sources: list[DetectedIncomeSource],
    ) -> _ComputationTotals:
        transactions, _ = self._transaction_repo.get_by_user_id(
            user_id=user_id,
            limit=100000,
            offset=0,
        )

        if not transactions:
            return _ComputationTotals()

        dates = [self._parse_date(txn.get("date")) for txn in transactions if txn.get("date")]
        if not dates:
            return _ComputationTotals()

        min_date = min(d for d in dates if d is not None)
        max_date = max(d for d in dates if d is not None)

        if min_date is None or max_date is None:
            return _ComputationTotals()

        periods = get_periods_in_range(min_date, max_date, PeriodType.MONTHLY)

        totals = _ComputationTotals()
        totals.transactions_processed = len(transactions)

        for period_start in periods:
            metrics = self._compute_period(user_id, period_start, income_sources)
            if metrics:
                self._cash_flow_repo.upsert(metrics)
                totals.periods_computed += 1

        return totals

    def _incremental_compute(
        self,
        user_id: UUID,
        income_sources: list[DetectedIncomeSource],
    ) -> _ComputationTotals:
        current_period_start = get_current_period_start(PeriodType.MONTHLY)
        previous_period_start = get_previous_period_start(current_period_start, PeriodType.MONTHLY)

        totals = _ComputationTotals()

        for period_start in [previous_period_start, current_period_start]:
            metrics = self._compute_period(user_id, period_start, income_sources)
            if metrics:
                self._cash_flow_repo.upsert(metrics)
                totals.periods_computed += 1

        return totals

    def _compute_period(
        self,
        user_id: UUID,
        period_start: date,
        income_sources: list[DetectedIncomeSource],
    ) -> CashFlowMetrics | None:
        period_start_bound, period_end = get_period_bounds(period_start, PeriodType.MONTHLY)

        transactions, _ = self._transaction_repo.get_by_user_id(
            user_id=user_id,
            start_date=period_start_bound,
            end_date=period_end,
            pending=False,
            limit=10000,
            offset=0,
        )

        if not transactions:
            return None

        total_income = Decimal("0")
        total_expenses = Decimal("0")
        category_totals: dict[str, Decimal] = {}

        high_confidence_sources = {
            s.source_name.upper()
            for s in income_sources
            if s.confidence_score >= CONFIDENCE_THRESHOLD_AUTO_INCLUDE
        }

        for txn in transactions:
            amount = Decimal(str(txn.get("amount", 0)))

            if self._transfer_detector.is_internal_transfer(txn):
                continue

            if amount < 0:
                source_name = (txn.get("merchant_name") or txn.get("name") or "").upper()
                if source_name in high_confidence_sources or self._is_likely_income(txn):
                    total_income += abs(amount)
            else:
                total_expenses += amount
                category = txn.get("personal_finance_category_primary") or "UNCATEGORIZED"
                category_totals[category] = category_totals.get(category, Decimal("0")) + amount

        recurring_expenses = self._calculate_recurring_expenses(
            user_id, period_start_bound, period_end
        )
        discretionary_expenses = max(Decimal("0"), total_expenses - recurring_expenses)

        savings_rate = self._calculate_savings_rate(total_income, total_expenses)

        largest_category: str | None = None
        largest_amount: Decimal | None = None
        if category_totals:
            largest_category = max(category_totals, key=lambda k: category_totals[k])
            largest_amount = category_totals[largest_category]

        income_sources_in_period = sum(
            1
            for s in income_sources
            if s.confidence_score >= CONFIDENCE_THRESHOLD_AUTO_INCLUDE
            and s.first_date <= period_end
            and s.last_date >= period_start_bound
        )

        return CashFlowMetrics(
            user_id=user_id,
            period_start=period_start_bound,
            total_income=total_income,
            total_expenses=total_expenses,
            net_cash_flow=total_income - total_expenses,
            savings_rate=savings_rate,
            recurring_expenses=recurring_expenses,
            discretionary_expenses=discretionary_expenses,
            income_sources_count=income_sources_in_period,
            expense_categories_count=len(category_totals),
            largest_expense_category=largest_category,
            largest_expense_amount=largest_amount,
        )

    def _calculate_recurring_expenses(
        self,
        user_id: UUID,
        period_start: date,  # noqa: ARG002
        period_end: date,  # noqa: ARG002
    ) -> Decimal:
        streams = self._recurring_stream_repo.get_active_by_user_id(user_id)

        total = Decimal("0")
        for stream in streams:
            if stream.get("stream_type") != "outflow":
                continue

            last_amount = stream.get("last_amount")
            if last_amount:
                total += Decimal(str(last_amount))

        return total

    def _calculate_savings_rate(
        self,
        total_income: Decimal,
        total_expenses: Decimal,
    ) -> Decimal | None:
        if total_income <= 0:
            return None

        savings = total_income - total_expenses
        rate = savings / total_income

        return min(Decimal("1.0000"), max(Decimal("-1.0000"), rate.quantize(Decimal("0.0001"))))

    def _is_likely_income(self, txn: dict[str, Any]) -> bool:
        category = txn.get("personal_finance_category_primary", "")
        if category and category.upper() in ("INCOME", "INCOME_WAGES", "INCOME_OTHER"):
            return True

        name = (txn.get("name") or "").lower()
        income_keywords = ("payroll", "direct dep", "salary", "wages", "paycheck")
        return any(kw in name for kw in income_keywords)

    def _persist_income_sources(
        self,
        user_id: UUID,
        sources: list[DetectedIncomeSource],
    ) -> None:
        for source in sources:
            self._income_source_repo.upsert_from_detection(user_id, source)

    @staticmethod
    def _parse_date(value: Any) -> date | None:
        if value is None:
            return None
        if isinstance(value, date):
            return value
        if isinstance(value, str):
            try:
                return date.fromisoformat(value[:10])
            except ValueError:
                return None
        return None


@dataclass
class _ComputationTotals:
    periods_computed: int = 0
    transactions_processed: int = 0


class CashFlowAggregatorContainer:
    _instance: CashFlowAggregator | None = None

    @classmethod
    def get(cls) -> CashFlowAggregator:
        if cls._instance is None:
            from repositories.cash_flow_metrics import get_cash_flow_metrics_repository
            from repositories.income_source import get_income_source_repository
            from repositories.recurring_stream import get_recurring_stream_repository
            from repositories.transaction import get_transaction_repository
            from services.analytics.income_detector import get_income_detector
            from services.analytics.transfer_detector import get_transfer_detector

            cls._instance = CashFlowAggregator(
                transaction_repo=get_transaction_repository(),
                recurring_stream_repo=get_recurring_stream_repository(),
                cash_flow_repo=get_cash_flow_metrics_repository(),
                income_source_repo=get_income_source_repository(),
                income_detector=get_income_detector(),
                transfer_detector=get_transfer_detector(),
            )
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_cash_flow_aggregator() -> CashFlowAggregator:
    return CashFlowAggregatorContainer.get()
