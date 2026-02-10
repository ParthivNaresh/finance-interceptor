from __future__ import annotations

import time
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID

from models.analytics import LifestyleBaselineCreate
from models.enums import BaselineType, ComputationStatus, PeriodType, SpendingCategory
from services.analytics.period_calculator import get_period_bounds

if TYPE_CHECKING:
    from repositories.category_spending import CategorySpendingRepository
    from repositories.lifestyle_baseline import LifestyleBaselineRepository
    from repositories.spending_period import SpendingPeriodRepository


MINIMUM_BASELINE_MONTHS = 2
DEFAULT_BASELINE_MONTHS = 3
MINIMUM_TRANSACTIONS_PER_CATEGORY = 2


@dataclass
class BaselineComputationResult:
    status: ComputationStatus
    baselines_computed: int
    categories_analyzed: int
    baseline_period_start: date | None
    baseline_period_end: date | None
    computation_time_ms: int
    error_message: str | None = None


@dataclass
class CategoryBaselineData:
    category_primary: str
    total_amount: Decimal
    total_transactions: int
    months_with_data: int
    first_period: date
    last_period: date


class BaselineCalculator:
    def __init__(
        self,
        category_spending_repo: CategorySpendingRepository,
        spending_period_repo: SpendingPeriodRepository,
        baseline_repo: LifestyleBaselineRepository,
    ) -> None:
        self._category_spending_repo = category_spending_repo
        self._spending_period_repo = spending_period_repo
        self._baseline_repo = baseline_repo

    def compute_baselines_for_user(
        self,
        user_id: UUID,
        force_recompute: bool = False,
    ) -> BaselineComputationResult:
        start_time = time.monotonic()

        try:
            if not force_recompute and self._baseline_repo.has_baselines(user_id):
                locked_baselines = self._baseline_repo.get_by_user_id(user_id, locked_only=True)
                if locked_baselines:
                    duration_ms = int((time.monotonic() - start_time) * 1000)
                    return BaselineComputationResult(
                        status=ComputationStatus.SUCCESS,
                        baselines_computed=0,
                        categories_analyzed=0,
                        baseline_period_start=None,
                        baseline_period_end=None,
                        computation_time_ms=duration_ms,
                        error_message="Baselines already locked. Use force_recompute to override.",
                    )

            baseline_period = self._determine_baseline_period(user_id)
            if baseline_period is None:
                duration_ms = int((time.monotonic() - start_time) * 1000)
                return BaselineComputationResult(
                    status=ComputationStatus.SUCCESS,
                    baselines_computed=0,
                    categories_analyzed=0,
                    baseline_period_start=None,
                    baseline_period_end=None,
                    computation_time_ms=duration_ms,
                    error_message=f"Insufficient data. Need {MINIMUM_BASELINE_MONTHS}+ months.",
                )

            period_start, period_end, months_count = baseline_period

            category_data = self._aggregate_category_spending(
                user_id=user_id,
                period_start=period_start,
                period_end=period_end,
            )

            discretionary_data = self._filter_discretionary_categories(category_data)

            if not discretionary_data:
                duration_ms = int((time.monotonic() - start_time) * 1000)
                return BaselineComputationResult(
                    status=ComputationStatus.SUCCESS,
                    baselines_computed=0,
                    categories_analyzed=len(category_data),
                    baseline_period_start=period_start,
                    baseline_period_end=period_end,
                    computation_time_ms=duration_ms,
                    error_message="No discretionary spending found in baseline period.",
                )

            baselines = self._create_baseline_records(
                user_id=user_id,
                category_data=discretionary_data,
                period_start=period_start,
                period_end=period_end,
                months_count=months_count,
            )

            if force_recompute:
                self._baseline_repo.delete_for_user(user_id)

            self._baseline_repo.upsert_many(baselines)

            duration_ms = int((time.monotonic() - start_time) * 1000)

            return BaselineComputationResult(
                status=ComputationStatus.SUCCESS,
                baselines_computed=len(baselines),
                categories_analyzed=len(category_data),
                baseline_period_start=period_start,
                baseline_period_end=period_end,
                computation_time_ms=duration_ms,
            )

        except Exception:
            duration_ms = int((time.monotonic() - start_time) * 1000)
            return BaselineComputationResult(
                status=ComputationStatus.FAILED,
                baselines_computed=0,
                categories_analyzed=0,
                baseline_period_start=None,
                baseline_period_end=None,
                computation_time_ms=duration_ms,
                error_message="Baseline computation failed",
            )

    def _determine_baseline_period(
        self,
        user_id: UUID,
    ) -> tuple[date, date, int] | None:
        periods = self._spending_period_repo.get_periods_for_user(
            user_id=user_id,
            period_type=PeriodType.MONTHLY,
            limit=24,
        )

        if len(periods) < MINIMUM_BASELINE_MONTHS:
            return None

        sorted_periods = sorted(periods, key=lambda p: p["period_start"])

        baseline_months = min(DEFAULT_BASELINE_MONTHS, len(sorted_periods))

        baseline_periods = sorted_periods[:baseline_months]

        first_period_start = date.fromisoformat(str(baseline_periods[0]["period_start"]))
        last_period_start = date.fromisoformat(str(baseline_periods[-1]["period_start"]))

        _, last_period_end = get_period_bounds(last_period_start, PeriodType.MONTHLY)

        return first_period_start, last_period_end, baseline_months

    def _aggregate_category_spending(
        self,
        user_id: UUID,
        period_start: date,
        period_end: date,
    ) -> list[CategoryBaselineData]:
        all_categories = self._category_spending_repo.get_all_categories_for_user(
            user_id=user_id,
            period_type=PeriodType.MONTHLY,
        )

        category_data: list[CategoryBaselineData] = []

        for category in all_categories:
            history = self._category_spending_repo.get_category_history(
                user_id=user_id,
                category_primary=category,
                period_type=PeriodType.MONTHLY,
                months=24,
            )

            relevant_records = [
                r
                for r in history
                if period_start <= date.fromisoformat(str(r["period_start"])) <= period_end
            ]

            if not relevant_records:
                continue

            total_amount = sum(
                (Decimal(str(r["total_amount"])) for r in relevant_records),
                Decimal("0"),
            )
            total_transactions = sum(int(r["transaction_count"]) for r in relevant_records)
            months_with_data = len(relevant_records)

            period_dates = [date.fromisoformat(str(r["period_start"])) for r in relevant_records]
            first_period = min(period_dates)
            last_period = max(period_dates)

            category_data.append(
                CategoryBaselineData(
                    category_primary=category,
                    total_amount=total_amount,
                    total_transactions=total_transactions,
                    months_with_data=months_with_data,
                    first_period=first_period,
                    last_period=last_period,
                )
            )

        return category_data

    def _filter_discretionary_categories(
        self,
        category_data: list[CategoryBaselineData],
    ) -> list[CategoryBaselineData]:
        return [
            data
            for data in category_data
            if SpendingCategory.is_discretionary(data.category_primary)
            and data.total_transactions >= MINIMUM_TRANSACTIONS_PER_CATEGORY
        ]

    def _create_baseline_records(
        self,
        user_id: UUID,
        category_data: list[CategoryBaselineData],
        period_start: date,
        period_end: date,
        months_count: int,
    ) -> list[LifestyleBaselineCreate]:
        baselines: list[LifestyleBaselineCreate] = []

        for data in category_data:
            monthly_average = data.total_amount / data.months_with_data

            baselines.append(
                LifestyleBaselineCreate(
                    user_id=user_id,
                    category_primary=data.category_primary,
                    baseline_type=BaselineType.ROLLING_3MO,
                    baseline_monthly_amount=monthly_average.quantize(Decimal("0.01")),
                    baseline_transaction_count=data.total_transactions,
                    baseline_period_start=period_start,
                    baseline_period_end=period_end,
                    baseline_months_count=months_count,
                    seasonal_adjustment_factor=None,
                    is_locked=False,
                )
            )

        return baselines

    def lock_baselines(self, user_id: UUID) -> int:
        return self._baseline_repo.lock_baselines(user_id)

    def unlock_baselines(self, user_id: UUID) -> int:
        return self._baseline_repo.unlock_baselines(user_id)

    def reset_baselines(self, user_id: UUID) -> BaselineComputationResult:
        self._baseline_repo.delete_for_user(user_id)
        return self.compute_baselines_for_user(user_id, force_recompute=True)

    def get_baseline_status(self, user_id: UUID) -> BaselineStatus:
        baselines = self._baseline_repo.get_by_user_id(user_id)

        if not baselines:
            return BaselineStatus(
                has_baselines=False,
                is_locked=False,
                categories_count=0,
                baseline_period_start=None,
                baseline_period_end=None,
                months_count=0,
            )

        first_baseline = baselines[0]
        is_locked = any(b.get("is_locked", False) for b in baselines)

        return BaselineStatus(
            has_baselines=True,
            is_locked=is_locked,
            categories_count=len(baselines),
            baseline_period_start=date.fromisoformat(str(first_baseline["baseline_period_start"])),
            baseline_period_end=date.fromisoformat(str(first_baseline["baseline_period_end"])),
            months_count=int(first_baseline["baseline_months_count"]),
        )

    def should_compute_baselines(self, user_id: UUID) -> bool:
        if self._baseline_repo.has_baselines(user_id):
            return False

        periods = self._spending_period_repo.get_periods_for_user(
            user_id=user_id,
            period_type=PeriodType.MONTHLY,
            limit=MINIMUM_BASELINE_MONTHS,
        )

        return len(periods) >= MINIMUM_BASELINE_MONTHS


@dataclass
class BaselineStatus:
    has_baselines: bool
    is_locked: bool
    categories_count: int
    baseline_period_start: date | None
    baseline_period_end: date | None
    months_count: int


class BaselineCalculatorContainer:
    _instance: BaselineCalculator | None = None

    @classmethod
    def get(cls) -> BaselineCalculator:
        if cls._instance is None:
            from repositories.category_spending import get_category_spending_repository
            from repositories.lifestyle_baseline import get_lifestyle_baseline_repository
            from repositories.spending_period import get_spending_period_repository

            cls._instance = BaselineCalculator(
                category_spending_repo=get_category_spending_repository(),
                spending_period_repo=get_spending_period_repository(),
                baseline_repo=get_lifestyle_baseline_repository(),
            )
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_baseline_calculator() -> BaselineCalculator:
    return BaselineCalculatorContainer.get()
