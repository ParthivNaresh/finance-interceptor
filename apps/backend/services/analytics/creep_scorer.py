from __future__ import annotations

import calendar
import time
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING, Any
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

# Statistical z-score thresholds
Z_THRESHOLD_LOW = Decimal("1.0")
Z_THRESHOLD_MEDIUM = Decimal("1.5")
Z_THRESHOLD_HIGH = Decimal("2.0")

# Fallback percentage thresholds (relaxed vs original 10/25/50)
FALLBACK_PCT_LOW = 15.0
FALLBACK_PCT_MEDIUM = 35.0
FALLBACK_PCT_HIGH = 60.0

# Trend detection constants
TREND_LOOKBACK = 4
TREND_ELEVATED_MINIMUM = 3

# Spend-weighted severity: sustained categories get 1.5x weight
SUSTAINED_WEIGHT_MULTIPLIER = Decimal("1.5")


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

        # Batch-fetch trend data (1 query for all categories)
        trend_data = self._creep_score_repo.get_recent_scores_by_category(user_id, TREND_LOOKBACK)

        # Build std_dev map for statistical severity
        baselines = self._baseline_repo.get_by_user_id(user_id)
        std_dev_map = self._build_std_dev_map(baselines)

        total_baseline = Decimal("0")
        total_current = Decimal("0")
        category_summaries: list[CategoryCreepSummary] = []
        sustained_count = 0

        for score in scores:
            category = score["category_primary"]
            baseline_amount = Decimal(str(score["baseline_amount"]))
            current_amount = Decimal(str(score["current_amount"]))
            absolute_change = Decimal(str(score["absolute_change"]))
            percentage_change = Decimal(str(score["percentage_change"]))

            total_baseline += baseline_amount
            total_current += current_amount

            std_dev = std_dev_map.get(category)

            # Improvement 3: Statistical severity
            severity = self._calculate_statistical_severity(
                current_amount, baseline_amount, std_dev
            )

            # Seasonality downgrade
            seasonality = detect_seasonality(category, period_start)
            severity = self._downgrade_severity_for_seasonality(severity, seasonality.is_seasonal)

            # Improvement 3: z-score for transparency
            z_score = self._calculate_z_score(current_amount, baseline_amount, std_dev)

            # Improvement 2: Trend detection
            category_scores = trend_data.get(category, [])
            trend_direction, consecutive = self._detect_category_trend(
                category_scores, baseline_amount, std_dev
            )

            if trend_direction == "sustained_increase":
                sustained_count += 1

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
                    trend_direction=trend_direction,
                    consecutive_months_elevated=consecutive,
                    z_score=z_score,
                )
            )

        overall_creep_percentage = self._calculate_overall_creep_percentage(
            total_baseline, total_current
        )

        # Improvement 4: Spend-weighted overall severity
        overall_severity = self._calculate_spend_weighted_severity(category_summaries)

        # Improvement 5: Income correlation
        income_growth_pct: Decimal | None = None
        income_adjusted_creep_pct: Decimal | None = None

        if income_for_period is not None and income_for_period > 0:
            baseline_income = self._calculate_baseline_income(user_id, baselines)
            if baseline_income is not None and baseline_income > 0:
                income_growth_pct = (
                    (income_for_period - baseline_income) / baseline_income * 100
                ).quantize(Decimal("0.01"))
                income_adjusted_creep_pct = max(
                    Decimal("0"), overall_creep_percentage - income_growth_pct
                ).quantize(Decimal("0.01"))

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
            categories_with_sustained_creep=sustained_count,
            income_growth_percentage=income_growth_pct,
            income_adjusted_creep_percentage=income_adjusted_creep_pct,
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

        # Fetch baseline for std_dev
        baseline = self._baseline_repo.get_by_category(user_id, category_primary)
        std_dev: Decimal | None = None
        if baseline and baseline.get("baseline_std_deviation") is not None:
            std_dev = Decimal(str(baseline["baseline_std_deviation"]))

        return [
            CategoryCreepSummary(
                category_primary=score["category_primary"],
                baseline_amount=Decimal(str(score["baseline_amount"])),
                current_amount=Decimal(str(score["current_amount"])),
                absolute_change=Decimal(str(score["absolute_change"])),
                percentage_change=Decimal(str(score["percentage_change"])),
                severity=self._calculate_statistical_severity(
                    Decimal(str(score["current_amount"])),
                    Decimal(str(score["baseline_amount"])),
                    std_dev,
                ),
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

    # -------------------------------------------------------------------------
    # Improvement 3: Statistical severity using z-scores
    # -------------------------------------------------------------------------

    @staticmethod
    def _calculate_statistical_severity(
        current: Decimal,
        baseline: Decimal,
        std_dev: Decimal | None,
    ) -> CreepSeverity:
        if current <= baseline or baseline == 0:
            return CreepSeverity.NONE

        if std_dev is None or std_dev == 0:
            pct = float(((current - baseline) / baseline) * 100)
            thresholds = [
                (FALLBACK_PCT_HIGH, CreepSeverity.HIGH),
                (FALLBACK_PCT_MEDIUM, CreepSeverity.MEDIUM),
                (FALLBACK_PCT_LOW, CreepSeverity.LOW),
            ]
        else:
            z = (current - baseline) / std_dev
            pct = float(z)
            thresholds = [
                (float(Z_THRESHOLD_HIGH), CreepSeverity.HIGH),
                (float(Z_THRESHOLD_MEDIUM), CreepSeverity.MEDIUM),
                (float(Z_THRESHOLD_LOW), CreepSeverity.LOW),
            ]

        for threshold, severity in thresholds:
            if pct >= threshold:
                return severity
        return CreepSeverity.NONE

    @staticmethod
    def _calculate_z_score(
        current: Decimal,
        baseline: Decimal,
        std_dev: Decimal | None,
    ) -> Decimal | None:
        if std_dev is None or std_dev == 0 or baseline == 0:
            return None
        return ((current - baseline) / std_dev).quantize(Decimal("0.01"))

    # -------------------------------------------------------------------------
    # Improvement 2: Trend detection
    # -------------------------------------------------------------------------

    @staticmethod
    def _detect_category_trend(
        category_scores: list[dict[str, Any]],
        baseline_amount: Decimal,
        std_dev: Decimal | None,
    ) -> tuple[str | None, int]:
        """Detect whether a category has sustained, fluctuating, or declining spend.

        Returns (direction, consecutive_months_elevated).
        """
        if len(category_scores) < 2:
            return ("new", 0) if len(category_scores) < 2 else (None, 0)

        # Define "elevated" threshold
        if std_dev is not None and std_dev > 0:
            threshold = baseline_amount + std_dev * Decimal("0.5")
        elif baseline_amount > 0:
            threshold = baseline_amount * Decimal("1.15")
        else:
            return (None, 0)

        # Count elevated months in last TREND_LOOKBACK periods
        elevated_count = 0
        below_baseline_count = 0
        for score in category_scores[:TREND_LOOKBACK]:
            current_amount = Decimal(str(score["current_amount"]))
            if current_amount > threshold:
                elevated_count += 1
            if current_amount < baseline_amount:
                below_baseline_count += 1

        total_checked = min(len(category_scores), TREND_LOOKBACK)

        if elevated_count >= TREND_ELEVATED_MINIMUM:
            return ("sustained_increase", elevated_count)
        if below_baseline_count == total_checked:
            return ("sustained_decrease", 0)
        return ("fluctuating", elevated_count)

    # -------------------------------------------------------------------------
    # Improvement 4: Spend-weighted overall severity
    # -------------------------------------------------------------------------

    def _calculate_spend_weighted_severity(
        self,
        category_summaries: list[CategoryCreepSummary],
    ) -> CreepSeverity:
        positive = [c for c in category_summaries if c.percentage_change > 0]
        if not positive:
            return CreepSeverity.NONE

        total_weight = Decimal("0")
        weighted_sum = Decimal("0")

        for cat in positive:
            weight = cat.baseline_amount
            if cat.trend_direction == "sustained_increase":
                weight = weight * SUSTAINED_WEIGHT_MULTIPLIER
            weighted_sum += cat.percentage_change * weight
            total_weight += weight

        if total_weight == 0:
            return CreepSeverity.NONE

        weighted_avg = weighted_sum / total_weight
        return CreepSeverity.from_percentage(float(weighted_avg))

    # -------------------------------------------------------------------------
    # Improvement 5: Income correlation
    # -------------------------------------------------------------------------

    def _calculate_baseline_income(
        self,
        user_id: UUID,
        baselines: list[dict[str, Any]],
    ) -> Decimal | None:
        if not baselines:
            return None

        baseline_start_str = baselines[0].get("baseline_period_start")
        baseline_end_str = baselines[0].get("baseline_period_end")
        if not baseline_start_str or not baseline_end_str:
            return None

        baseline_start = date.fromisoformat(str(baseline_start_str))
        baseline_end = date.fromisoformat(str(baseline_end_str))

        cash_flow_periods = self._cash_flow_repo.get_periods_in_range(
            user_id, baseline_start, baseline_end
        )

        if not cash_flow_periods:
            return None

        total_income = sum(
            (Decimal(str(p["total_income"])) for p in cash_flow_periods),
            Decimal("0"),
        )
        return (total_income / Decimal(len(cash_flow_periods))).quantize(Decimal("0.01"))

    # -------------------------------------------------------------------------
    # Seasonality
    # -------------------------------------------------------------------------

    @staticmethod
    def _downgrade_severity_for_seasonality(
        severity: CreepSeverity,
        is_seasonal: bool,
    ) -> CreepSeverity:
        if not is_seasonal:
            return severity

        if severity == CreepSeverity.HIGH:
            return CreepSeverity.MEDIUM
        if severity == CreepSeverity.MEDIUM:
            return CreepSeverity.LOW

        return severity

    # -------------------------------------------------------------------------
    # Internal helpers
    # -------------------------------------------------------------------------

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
        baselines: list[dict[str, Any]],
    ) -> dict[str, Decimal]:
        return {
            b["category_primary"]: Decimal(str(b["baseline_monthly_amount"])) for b in baselines
        }

    @staticmethod
    def _build_std_dev_map(baselines: list[dict[str, Any]]) -> dict[str, Decimal | None]:
        result: dict[str, Decimal | None] = {}
        for b in baselines:
            std_dev_val = b.get("baseline_std_deviation")
            if std_dev_val is not None:
                result[b["category_primary"]] = Decimal(str(std_dev_val))
            else:
                result[b["category_primary"]] = None
        return result

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
            if int(period.get("transaction_count", 0)) == 0:
                continue
            period_start = date.fromisoformat(str(period["period_start"]))
            category_spending = self._category_spending_repo.get_by_user_and_period(
                user_id=user_id,
                period_type=PeriodType.MONTHLY,
                period_start=period_start,
            )
            if any(
                SpendingCategory.is_discretionary(r["category_primary"]) for r in category_spending
            ):
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

    def _calculate_discretionary_ratio(
        self,
        total_discretionary: Decimal,
        income: Decimal | None,
    ) -> Decimal | None:
        if income is None or income <= 0:
            return None

        ratio = total_discretionary / income
        return ratio.quantize(Decimal("0.0001"))


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
