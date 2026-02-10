from __future__ import annotations

import calendar
import time
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID

from models.analytics import (
    CategoryCreepSummary,
    LifestyleCreepComputationResult,
    LifestyleCreepScoreCreate,
    LifestyleCreepSummary,
    PacingMode,
    PacingResponse,
    PacingStatus,
)
from models.enums import ComputationStatus, CreepSeverity, PeriodType, SpendingCategory
from services.analytics.period_calculator import (
    get_period_bounds,
    get_previous_period_start,
)
from services.analytics.seasonality_detector import detect_seasonality

if TYPE_CHECKING:
    from repositories.cash_flow_metrics import CashFlowMetricsRepository
    from repositories.category_spending import CategorySpendingRepository
    from repositories.lifestyle_baseline import LifestyleBaselineRepository
    from repositories.lifestyle_creep_score import LifestyleCreepScoreRepository
    from repositories.spending_period import SpendingPeriodRepository


CREEP_SCORE_SCALE_FACTOR = Decimal("10")
MAX_CREEP_SCORE = Decimal("100")
MIN_CREEP_SCORE = Decimal("-100")


@dataclass
class CreepComputationTotals:
    periods_computed: int = 0
    scores_computed: int = 0
    categories_analyzed: int = 0


@dataclass
class PeriodCreepData:
    period_start: date
    category_scores: list[LifestyleCreepScoreCreate] = field(default_factory=list)
    total_baseline_discretionary: Decimal = Decimal("0")
    total_current_discretionary: Decimal = Decimal("0")
    income_for_period: Decimal | None = None


class CreepScorer:
    def __init__(
        self,
        category_spending_repo: CategorySpendingRepository,
        baseline_repo: LifestyleBaselineRepository,
        creep_score_repo: LifestyleCreepScoreRepository,
        cash_flow_repo: CashFlowMetricsRepository,
        spending_period_repo: SpendingPeriodRepository,
    ) -> None:
        self._category_spending_repo = category_spending_repo
        self._baseline_repo = baseline_repo
        self._creep_score_repo = creep_score_repo
        self._cash_flow_repo = cash_flow_repo
        self._spending_period_repo = spending_period_repo

    def compute_creep_for_user(
        self,
        user_id: UUID,
        periods_to_compute: int = 6,
        force_recompute: bool = False,
    ) -> LifestyleCreepComputationResult:
        start_time = time.monotonic()

        try:
            baselines = self._baseline_repo.get_by_user_id(user_id)
            if not baselines:
                duration_ms = int((time.monotonic() - start_time) * 1000)
                return LifestyleCreepComputationResult(
                    status=ComputationStatus.SUCCESS,
                    baselines_computed=0,
                    creep_scores_computed=0,
                    categories_analyzed=0,
                    computation_time_ms=duration_ms,
                    error_message="No baselines found. Compute baselines first.",
                )

            baseline_map = self._build_baseline_map(baselines)

            periods = self._get_periods_to_compute(user_id, periods_to_compute)

            totals = CreepComputationTotals()
            totals.categories_analyzed = len(baseline_map)

            for period_start in periods:
                period_data = self._compute_period_creep(
                    user_id=user_id,
                    period_start=period_start,
                    baseline_map=baseline_map,
                )

                if period_data.category_scores:
                    if force_recompute:
                        self._creep_score_repo.delete_for_period(user_id, period_start)

                    self._creep_score_repo.upsert_many(period_data.category_scores)
                    totals.scores_computed += len(period_data.category_scores)
                    totals.periods_computed += 1

            duration_ms = int((time.monotonic() - start_time) * 1000)

            return LifestyleCreepComputationResult(
                status=ComputationStatus.SUCCESS,
                baselines_computed=len(baseline_map),
                creep_scores_computed=totals.scores_computed,
                categories_analyzed=totals.categories_analyzed,
                computation_time_ms=duration_ms,
            )

        except Exception:
            duration_ms = int((time.monotonic() - start_time) * 1000)
            return LifestyleCreepComputationResult(
                status=ComputationStatus.FAILED,
                baselines_computed=0,
                creep_scores_computed=0,
                categories_analyzed=0,
                computation_time_ms=duration_ms,
                error_message="Creep score computation failed",
            )

    def compute_current_period(self, user_id: UUID) -> LifestyleCreepComputationResult:
        return self.compute_creep_for_user(user_id, periods_to_compute=1, force_recompute=True)

    def get_creep_summary(
        self,
        user_id: UUID,
        period_start: date,
    ) -> LifestyleCreepSummary | None:
        scores = self._creep_score_repo.get_by_user_and_period(user_id, period_start)
        if not scores:
            return None

        cash_flow = self._cash_flow_repo.get_by_user_and_period(user_id, period_start)
        income_for_period = Decimal(str(cash_flow["total_income"])) if cash_flow else None

        total_baseline = Decimal("0")
        total_current = Decimal("0")
        category_summaries: list[CategoryCreepSummary] = []

        for score in scores:
            category = score["category_primary"]
            baseline_amount = Decimal(str(score["baseline_amount"]))
            current_amount = Decimal(str(score["current_amount"]))
            absolute_change = Decimal(str(score["absolute_change"]))
            percentage_change = Decimal(str(score["percentage_change"]))

            total_baseline += baseline_amount
            total_current += current_amount

            seasonality = detect_seasonality(category, period_start)
            severity = self._calculate_severity_with_seasonality(
                percentage_change, seasonality.is_seasonal
            )

            category_summaries.append(
                CategoryCreepSummary(
                    category_primary=category,
                    baseline_amount=baseline_amount,
                    current_amount=current_amount,
                    absolute_change=absolute_change,
                    percentage_change=percentage_change,
                    severity=severity,
                    is_seasonal=seasonality.is_seasonal,
                    seasonal_months=list(seasonality.seasonal_months)
                    if seasonality.seasonal_months
                    else None,
                )
            )

        overall_creep_percentage = self._calculate_overall_creep_percentage(
            total_baseline, total_current
        )

        overall_severity = self._calculate_overall_severity(category_summaries)

        discretionary_ratio = self._calculate_discretionary_ratio(total_current, income_for_period)

        top_creeping = sorted(
            [c for c in category_summaries if c.percentage_change > 0],
            key=lambda x: x.percentage_change,
            reverse=True,
        )[:5]

        improving = sorted(
            [c for c in category_summaries if c.percentage_change < 0],
            key=lambda x: x.percentage_change,
        )[:5]

        return LifestyleCreepSummary(
            period_start=period_start,
            total_baseline_discretionary=total_baseline,
            total_current_discretionary=total_current,
            overall_creep_percentage=overall_creep_percentage,
            overall_severity=overall_severity,
            discretionary_ratio=discretionary_ratio,
            income_for_period=income_for_period,
            top_creeping_categories=top_creeping,
            improving_categories=improving,
        )

    def get_creep_history(
        self,
        user_id: UUID,
        periods: int = 12,
    ) -> list[LifestyleCreepSummary]:
        period_dates = self._creep_score_repo.get_periods_for_user(user_id, limit=periods)

        summaries: list[LifestyleCreepSummary] = []
        for period_start in period_dates:
            summary = self.get_creep_summary(user_id, period_start)
            if summary:
                summaries.append(summary)

        return summaries

    def get_category_creep_history(
        self,
        user_id: UUID,
        category_primary: str,
        periods: int = 12,
    ) -> list[CategoryCreepSummary]:
        scores = self._creep_score_repo.get_category_history(
            user_id=user_id,
            category_primary=category_primary,
            limit=periods,
        )

        return [
            CategoryCreepSummary(
                category_primary=score["category_primary"],
                baseline_amount=Decimal(str(score["baseline_amount"])),
                current_amount=Decimal(str(score["current_amount"])),
                absolute_change=Decimal(str(score["absolute_change"])),
                percentage_change=Decimal(str(score["percentage_change"])),
                severity=CreepSeverity.from_percentage(float(score["percentage_change"])),
            )
            for score in scores
        ]

    def get_pacing_status(self, user_id: UUID) -> PacingResponse | None:
        baselines = self._baseline_repo.get_by_user_id(user_id)
        if not baselines:
            return None

        baseline_map = self._build_baseline_map(baselines)
        target_amount = sum(baseline_map.values())

        if target_amount == 0:
            return None

        period_start = self._get_latest_period_start_with_transactions(user_id)
        if period_start is None:
            return None

        reference = date.today()
        _, period_end = get_period_bounds(period_start, PeriodType.MONTHLY)

        days_into_period = (reference - period_start).days + 1
        total_days_in_period = calendar.monthrange(period_start.year, period_start.month)[1]

        current_discretionary = self._get_current_discretionary_spend(
            user_id, period_start, baseline_map
        )

        pacing_percentage = (
            (current_discretionary / target_amount) * 100 if target_amount > 0 else Decimal("0")
        ).quantize(Decimal("0.01"))

        expected_pacing_percentage = (
            Decimal(days_into_period) / Decimal(total_days_in_period) * 100
        ).quantize(Decimal("0.01"))

        pacing_difference = pacing_percentage - expected_pacing_percentage

        pacing_status = self._determine_pacing_status(pacing_difference)
        mode = self._determine_pacing_mode(days_into_period)

        stability_score: int | None = None
        overall_severity: CreepSeverity | None = None
        top_drifting_category: CategoryCreepSummary | None = None

        if mode == PacingMode.STABILITY:
            creep_summary = self.get_creep_summary(user_id, period_start)
            if creep_summary:
                creep_pct = float(creep_summary.overall_creep_percentage)
                if creep_pct <= 0:
                    stability_score = 100
                elif creep_pct >= 100:
                    stability_score = 0
                else:
                    stability_score = max(0, round(100 - creep_pct))

                if creep_summary.overall_severity in (CreepSeverity.MEDIUM, CreepSeverity.HIGH):
                    stability_score = min(stability_score, 85)

                overall_severity = creep_summary.overall_severity

                if creep_summary.top_creeping_categories:
                    top_drifting_category = creep_summary.top_creeping_categories[0]

        return PacingResponse(
            mode=mode,
            period_start=period_start,
            period_end=period_end,
            days_into_period=days_into_period,
            total_days_in_period=total_days_in_period,
            target_amount=target_amount,
            current_discretionary_spend=current_discretionary,
            pacing_percentage=pacing_percentage,
            expected_pacing_percentage=expected_pacing_percentage,
            pacing_status=pacing_status,
            pacing_difference=pacing_difference,
            stability_score=stability_score,
            overall_severity=overall_severity,
            top_drifting_category=top_drifting_category,
        )

    def _get_current_discretionary_spend(
        self,
        user_id: UUID,
        period_start: date,
        baseline_map: dict[str, Decimal],
    ) -> Decimal:
        current_spending = self._category_spending_repo.get_by_user_and_period(
            user_id=user_id,
            period_type=PeriodType.MONTHLY,
            period_start=period_start,
        )

        total = Decimal("0")
        for record in current_spending:
            category = record["category_primary"]
            if category in baseline_map or SpendingCategory.is_discretionary(category):
                total += Decimal(str(record["total_amount"]))

        return total

    def _determine_pacing_status(self, pacing_difference: Decimal) -> PacingStatus:
        threshold = Decimal("5")

        if pacing_difference > threshold:
            return PacingStatus.AHEAD
        elif pacing_difference < -threshold:
            return PacingStatus.BEHIND
        else:
            return PacingStatus.ON_TRACK

    def _determine_pacing_mode(self, days_into_period: int) -> PacingMode:
        if days_into_period <= 3:
            return PacingMode.KICKOFF
        elif days_into_period <= 7:
            return PacingMode.PACING
        else:
            return PacingMode.STABILITY

    def _compute_period_creep(
        self,
        user_id: UUID,
        period_start: date,
        baseline_map: dict[str, Decimal],
    ) -> PeriodCreepData:
        period_data = PeriodCreepData(period_start=period_start)

        current_spending = self._category_spending_repo.get_by_user_and_period(
            user_id=user_id,
            period_type=PeriodType.MONTHLY,
            period_start=period_start,
        )

        current_map = {
            record["category_primary"]: Decimal(str(record["total_amount"]))
            for record in current_spending
            if SpendingCategory.is_discretionary(record["category_primary"])
        }

        cash_flow = self._cash_flow_repo.get_by_user_and_period(user_id, period_start)
        if cash_flow:
            period_data.income_for_period = Decimal(str(cash_flow["total_income"]))

        all_categories = set(baseline_map.keys()) | set(current_map.keys())

        for category in all_categories:
            baseline_amount = baseline_map.get(category, Decimal("0"))
            current_amount = current_map.get(category, Decimal("0"))

            if baseline_amount == 0 and current_amount == 0:
                continue

            absolute_change = current_amount - baseline_amount
            percentage_change = self._calculate_percentage_change(baseline_amount, current_amount)
            creep_score = self._calculate_creep_score(percentage_change)

            period_data.total_baseline_discretionary += baseline_amount
            period_data.total_current_discretionary += current_amount

            period_data.category_scores.append(
                LifestyleCreepScoreCreate(
                    user_id=user_id,
                    period_start=period_start,
                    category_primary=category,
                    baseline_amount=baseline_amount,
                    current_amount=current_amount,
                    absolute_change=absolute_change,
                    percentage_change=percentage_change,
                    creep_score=creep_score,
                    is_inflation_adjusted=False,
                    inflation_rate_used=None,
                )
            )

        return period_data

    def _build_baseline_map(
        self,
        baselines: list[dict],
    ) -> dict[str, Decimal]:
        return {
            b["category_primary"]: Decimal(str(b["baseline_monthly_amount"])) for b in baselines
        }

    def _get_periods_to_compute(self, user_id: UUID, count: int) -> list[date]:
        current = self._get_latest_period_start_with_transactions(user_id)
        if current is None:
            return []

        periods: list[date] = []
        for _ in range(count):
            periods.append(current)
            current = get_previous_period_start(current, PeriodType.MONTHLY)

        return periods

    def _get_latest_period_start_with_transactions(self, user_id: UUID) -> date | None:
        periods = self._spending_period_repo.get_periods_for_user(
            user_id=user_id,
            period_type=PeriodType.MONTHLY,
            limit=24,
        )

        for period in periods:
            period_start = date.fromisoformat(str(period["period_start"]))
            current_spending = self._category_spending_repo.get_by_user_and_period(
                user_id=user_id,
                period_type=PeriodType.MONTHLY,
                period_start=period_start,
            )
            if current_spending:
                return period_start

        return None

    def _calculate_percentage_change(
        self,
        baseline: Decimal,
        current: Decimal,
    ) -> Decimal:
        if baseline == 0:
            if current == 0:
                return Decimal("0")
            return Decimal("100")

        change = ((current - baseline) / baseline) * 100
        return change.quantize(Decimal("0.01"))

    def _calculate_creep_score(self, percentage_change: Decimal) -> Decimal:
        score = percentage_change / CREEP_SCORE_SCALE_FACTOR
        clamped = max(MIN_CREEP_SCORE, min(MAX_CREEP_SCORE, score))
        return clamped.quantize(Decimal("0.01"))

    def _calculate_overall_creep_percentage(
        self,
        total_baseline: Decimal,
        total_current: Decimal,
    ) -> Decimal:
        if total_baseline == 0:
            if total_current == 0:
                return Decimal("0")
            return Decimal("100")

        change = ((total_current - total_baseline) / total_baseline) * 100
        return change.quantize(Decimal("0.01"))

    def _calculate_overall_severity(
        self,
        category_summaries: list[CategoryCreepSummary],
    ) -> CreepSeverity:
        positive = [c for c in category_summaries if c.percentage_change > 0]
        if not positive:
            return CreepSeverity.NONE

        positive.sort(key=lambda c: c.percentage_change, reverse=True)
        top = positive[:2]

        avg_change = sum((c.percentage_change for c in top), Decimal("0")) / Decimal(len(top))
        return CreepSeverity.from_percentage(float(avg_change))

    def _calculate_discretionary_ratio(
        self,
        total_discretionary: Decimal,
        income: Decimal | None,
    ) -> Decimal | None:
        if income is None or income <= 0:
            return None

        ratio = total_discretionary / income
        return ratio.quantize(Decimal("0.0001"))

    def _calculate_severity_with_seasonality(
        self,
        percentage_change: Decimal,
        is_seasonal: bool,
    ) -> CreepSeverity:
        base_severity = CreepSeverity.from_percentage(float(percentage_change))

        if not is_seasonal:
            return base_severity

        if base_severity == CreepSeverity.HIGH:
            return CreepSeverity.MEDIUM
        if base_severity == CreepSeverity.MEDIUM:
            return CreepSeverity.LOW

        return base_severity


class CreepScorerContainer:
    _instance: CreepScorer | None = None

    @classmethod
    def get(cls) -> CreepScorer:
        if cls._instance is None:
            from repositories.cash_flow_metrics import get_cash_flow_metrics_repository
            from repositories.category_spending import get_category_spending_repository
            from repositories.lifestyle_baseline import get_lifestyle_baseline_repository
            from repositories.lifestyle_creep_score import get_lifestyle_creep_score_repository
            from repositories.spending_period import get_spending_period_repository

            cls._instance = CreepScorer(
                category_spending_repo=get_category_spending_repository(),
                baseline_repo=get_lifestyle_baseline_repository(),
                creep_score_repo=get_lifestyle_creep_score_repository(),
                cash_flow_repo=get_cash_flow_metrics_repository(),
                spending_period_repo=get_spending_period_repository(),
            )
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_creep_scorer() -> CreepScorer:
    return CreepScorerContainer.get()
