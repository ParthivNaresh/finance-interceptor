from __future__ import annotations

import time
from dataclasses import dataclass
from datetime import date
from typing import TYPE_CHECKING, Any
from uuid import UUID

from models.enums import ComputationStatus, PeriodType
from services.analytics.period_calculator import (
    get_current_period_start,
    get_period_bounds,
    get_periods_in_range,
    get_previous_period_start,
    is_period_finalized,
)
from services.analytics.spending_aggregator import AggregationResult

if TYPE_CHECKING:
    from repositories.analytics_log import AnalyticsComputationLogRepository
    from repositories.category_spending import CategorySpendingRepository
    from repositories.merchant_spending import MerchantSpendingRepository
    from repositories.spending_period import SpendingPeriodRepository
    from repositories.transaction import TransactionRepository
    from services.analytics.spending_aggregator import SpendingAggregator


COMPUTATION_TYPE_SPENDING = "spending_aggregations"


@dataclass
class ComputationResult:
    status: ComputationStatus
    periods_computed: int
    categories_computed: int
    merchants_computed: int
    transactions_processed: int
    computation_time_ms: int
    error_message: str | None = None


class SpendingComputationError(Exception):
    def __init__(self, message: str = "Spending computation failed") -> None:
        self.message = message
        super().__init__(self.message)


class SpendingComputationManager:
    def __init__(
        self,
        transaction_repo: TransactionRepository,
        spending_period_repo: SpendingPeriodRepository,
        category_spending_repo: CategorySpendingRepository,
        merchant_spending_repo: MerchantSpendingRepository,
        computation_log_repo: AnalyticsComputationLogRepository,
        spending_aggregator: SpendingAggregator,
    ) -> None:
        self._transaction_repo = transaction_repo
        self._spending_period_repo = spending_period_repo
        self._category_spending_repo = category_spending_repo
        self._merchant_spending_repo = merchant_spending_repo
        self._computation_log_repo = computation_log_repo
        self._spending_aggregator = spending_aggregator

    def compute_for_user(
        self,
        user_id: UUID,
        force_full_recompute: bool = False,
    ) -> ComputationResult:
        start_time = time.monotonic()

        try:
            self._computation_log_repo.mark_in_progress(user_id, COMPUTATION_TYPE_SPENDING)

            if force_full_recompute:
                result = self._full_recompute(user_id)
            else:
                result = self._incremental_compute(user_id)

            duration_ms = int((time.monotonic() - start_time) * 1000)

            self._computation_log_repo.mark_complete(
                user_id=user_id,
                computation_type=COMPUTATION_TYPE_SPENDING,
                rows_affected=result.periods_computed
                + result.categories_computed
                + result.merchants_computed,
                duration_ms=duration_ms,
            )

            return ComputationResult(
                status=ComputationStatus.SUCCESS,
                periods_computed=result.periods_computed,
                categories_computed=result.categories_computed,
                merchants_computed=result.merchants_computed,
                transactions_processed=result.transactions_processed,
                computation_time_ms=duration_ms,
            )

        except Exception:
            duration_ms = int((time.monotonic() - start_time) * 1000)

            self._computation_log_repo.mark_failed(
                user_id=user_id,
                computation_type=COMPUTATION_TYPE_SPENDING,
                error_message="Spending computation failed",
                duration_ms=duration_ms,
            )

            return ComputationResult(
                status=ComputationStatus.FAILED,
                periods_computed=0,
                categories_computed=0,
                merchants_computed=0,
                transactions_processed=0,
                computation_time_ms=duration_ms,
                error_message="Spending computation failed",
            )

    def compute_current_month(self, user_id: UUID) -> ComputationResult:
        start_time = time.monotonic()

        try:
            current_period_start = get_current_period_start(PeriodType.MONTHLY)
            result = self._compute_period(user_id, PeriodType.MONTHLY, current_period_start)

            duration_ms = int((time.monotonic() - start_time) * 1000)

            return ComputationResult(
                status=ComputationStatus.SUCCESS,
                periods_computed=1 if result else 0,
                categories_computed=len(result.category_spending) if result else 0,
                merchants_computed=len(result.merchant_spending) if result else 0,
                transactions_processed=result.transactions_processed if result else 0,
                computation_time_ms=duration_ms,
            )

        except Exception:
            duration_ms = int((time.monotonic() - start_time) * 1000)
            return ComputationResult(
                status=ComputationStatus.FAILED,
                periods_computed=0,
                categories_computed=0,
                merchants_computed=0,
                transactions_processed=0,
                computation_time_ms=duration_ms,
                error_message="Spending computation failed",
            )

    def compute_historical(
        self,
        user_id: UUID,
        start_date: date,
        end_date: date,
        period_type: PeriodType = PeriodType.MONTHLY,
    ) -> ComputationResult:
        start_time = time.monotonic()

        try:
            periods = get_periods_in_range(start_date, end_date, period_type)
            total_periods = 0
            total_categories = 0
            total_merchants = 0
            total_transactions = 0

            for period_start in periods:
                result = self._compute_period(user_id, period_type, period_start)
                if result:
                    total_periods += 1
                    total_categories += len(result.category_spending)
                    total_merchants += len(result.merchant_spending)
                    total_transactions += result.transactions_processed

            duration_ms = int((time.monotonic() - start_time) * 1000)

            return ComputationResult(
                status=ComputationStatus.SUCCESS,
                periods_computed=total_periods,
                categories_computed=total_categories,
                merchants_computed=total_merchants,
                transactions_processed=total_transactions,
                computation_time_ms=duration_ms,
            )

        except Exception:
            duration_ms = int((time.monotonic() - start_time) * 1000)
            return ComputationResult(
                status=ComputationStatus.FAILED,
                periods_computed=0,
                categories_computed=0,
                merchants_computed=0,
                transactions_processed=0,
                computation_time_ms=duration_ms,
                error_message="Spending computation failed",
            )

    def finalize_past_periods(
        self,
        user_id: UUID,
        period_type: PeriodType = PeriodType.MONTHLY,
    ) -> int:
        current_period_start = get_current_period_start(period_type)
        return self._spending_period_repo.mark_finalized_before(
            user_id, period_type, current_period_start
        )

    def _full_recompute(self, user_id: UUID) -> _ComputationTotals:
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

        min_date = min(dates)
        max_date = max(dates)

        periods = get_periods_in_range(min_date, max_date, PeriodType.MONTHLY)

        totals = _ComputationTotals()

        for period_start in periods:
            result = self._compute_period(user_id, PeriodType.MONTHLY, period_start)
            if result:
                totals.periods_computed += 1
                totals.categories_computed += len(result.category_spending)
                totals.merchants_computed += len(result.merchant_spending)
                totals.transactions_processed += result.transactions_processed

        return totals

    def _incremental_compute(self, user_id: UUID) -> _ComputationTotals:
        current_period_start = get_current_period_start(PeriodType.MONTHLY)
        previous_period_start = get_previous_period_start(current_period_start, PeriodType.MONTHLY)

        totals = _ComputationTotals()

        for period_start in [previous_period_start, current_period_start]:
            if self._should_recompute_period(user_id, period_start, PeriodType.MONTHLY):
                result = self._compute_period(user_id, PeriodType.MONTHLY, period_start)
                if result:
                    totals.periods_computed += 1
                    totals.categories_computed += len(result.category_spending)
                    totals.merchants_computed += len(result.merchant_spending)
                    totals.transactions_processed += result.transactions_processed

        return totals

    def _compute_period(
        self,
        user_id: UUID,
        period_type: PeriodType,
        period_start: date,
    ) -> AggregationResult | None:
        period_start_bound, period_end = get_period_bounds(period_start, period_type)

        self._category_spending_repo.delete_for_period(user_id, period_type, period_start_bound)
        self._merchant_spending_repo.delete_for_period(user_id, period_type, period_start_bound)

        transactions = self._get_transactions_for_period(user_id, period_start_bound, period_end)

        if not transactions:
            self._spending_period_repo.delete_for_period(user_id, period_type, period_start_bound)
            return None

        result = self._spending_aggregator.aggregate_period(
            user_id=user_id,
            transactions=transactions,
            period_type=period_type,
            period_start=period_start_bound,
        )

        if is_period_finalized(period_start_bound, period_type):
            result.spending_period.is_finalized = True

        self._spending_period_repo.upsert(result.spending_period)

        if result.category_spending:
            self._category_spending_repo.upsert_many(result.category_spending)

        if result.merchant_spending:
            self._merchant_spending_repo.upsert_many(result.merchant_spending)

        return result

    def _get_transactions_for_period(
        self,
        user_id: UUID,
        period_start: date,
        period_end: date,
    ) -> list[dict[str, Any]]:
        transactions, _ = self._transaction_repo.get_by_user_id(
            user_id=user_id,
            start_date=period_start,
            end_date=period_end,
            pending=False,
            limit=10000,
            offset=0,
        )
        return transactions

    def _should_recompute_period(
        self,
        user_id: UUID,
        period_start: date,
        period_type: PeriodType,
    ) -> bool:
        existing = self._spending_period_repo.get_by_user_and_period(
            user_id, period_type, period_start
        )

        if not existing:
            return True

        return not existing.get("is_finalized", False)

    @staticmethod
    def _parse_date(value: str | date | None) -> date | None:
        if value is None:
            return None
        if isinstance(value, date):
            return value
        return date.fromisoformat(value)


@dataclass
class _ComputationTotals:
    periods_computed: int = 0
    categories_computed: int = 0
    merchants_computed: int = 0
    transactions_processed: int = 0


class SpendingComputationManagerContainer:
    _instance: SpendingComputationManager | None = None

    @classmethod
    def get(cls) -> SpendingComputationManager:
        if cls._instance is None:
            from repositories.analytics_log import get_analytics_computation_log_repository
            from repositories.category_spending import get_category_spending_repository
            from repositories.merchant_spending import get_merchant_spending_repository
            from repositories.spending_period import get_spending_period_repository
            from repositories.transaction import get_transaction_repository
            from services.analytics.spending_aggregator import get_spending_aggregator

            cls._instance = SpendingComputationManager(
                transaction_repo=get_transaction_repository(),
                spending_period_repo=get_spending_period_repository(),
                category_spending_repo=get_category_spending_repository(),
                merchant_spending_repo=get_merchant_spending_repository(),
                computation_log_repo=get_analytics_computation_log_repository(),
                spending_aggregator=get_spending_aggregator(),
            )
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_spending_computation_manager() -> SpendingComputationManager:
    return SpendingComputationManagerContainer.get()
