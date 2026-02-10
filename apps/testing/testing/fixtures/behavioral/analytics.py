from __future__ import annotations

import sys
from pathlib import Path
from uuid import UUID

from ...context import TestContext


_BACKEND_PATH = Path(__file__).parent.parent.parent.parent / "backend"
if str(_BACKEND_PATH) not in sys.path:
    sys.path.insert(0, str(_BACKEND_PATH))


def compute_analytics(
    context: TestContext,
    force_full_recompute: bool = True,
) -> AnalyticsComputationResult:
    if context.user is None:
        raise ValueError("Context must have a user")

    user_id = context.user_id

    from services.analytics import (
        get_spending_computation_manager,
        get_merchant_stats_aggregator,
        get_cash_flow_aggregator,
    )

    result = AnalyticsComputationResult(user_id=user_id)

    spending_manager = get_spending_computation_manager()
    spending_result = spending_manager.compute_for_user(
        user_id, force_full_recompute=force_full_recompute
    )
    result.spending_periods_computed = spending_result.periods_computed
    result.transactions_processed = spending_result.transactions_processed

    merchant_aggregator = get_merchant_stats_aggregator()
    merchant_result = merchant_aggregator.compute_for_user(user_id)
    result.merchants_computed = merchant_result.merchants_computed

    cash_flow_aggregator = get_cash_flow_aggregator()
    cash_flow_result = cash_flow_aggregator.compute_for_user(
        user_id, force_full_recompute=force_full_recompute
    )
    result.cash_flow_periods_computed = cash_flow_result.periods_computed
    result.income_sources_detected = cash_flow_result.income_sources_detected

    return result


def compute_baselines(
    context: TestContext,
    force_recompute: bool = False,
) -> BaselineComputationResult:
    if context.user is None:
        raise ValueError("Context must have a user")

    user_id = context.user_id

    from services.analytics import get_baseline_calculator, MINIMUM_BASELINE_MONTHS

    calculator = get_baseline_calculator()

    if not force_recompute and not calculator.should_compute_baselines(user_id):
        status = calculator.get_baseline_status(user_id)
        if status.has_baselines:
            return BaselineComputationResult(
                user_id=user_id,
                baselines_computed=0,
                error="Baselines already exist. Use force_recompute=True to override.",
            )
        return BaselineComputationResult(
            user_id=user_id,
            baselines_computed=0,
            error=f"Insufficient data. Need at least {MINIMUM_BASELINE_MONTHS} months.",
        )

    result = calculator.compute_baselines_for_user(user_id, force_recompute=force_recompute)

    return BaselineComputationResult(
        user_id=user_id,
        baselines_computed=result.baselines_computed,
        categories_analyzed=result.categories_analyzed,
        error=result.error_message,
    )


def compute_creep_scores(
    context: TestContext,
) -> CreepScoreComputationResult:
    if context.user is None:
        raise ValueError("Context must have a user")

    user_id = context.user_id

    from services.analytics import get_baseline_calculator, get_creep_scorer

    calculator = get_baseline_calculator()
    status = calculator.get_baseline_status(user_id)

    if not status.has_baselines:
        return CreepScoreComputationResult(
            user_id=user_id,
            scores_computed=0,
            error="No baselines exist. Call compute_baselines first.",
        )

    scorer = get_creep_scorer()
    result = scorer.compute_current_period(user_id)

    pacing = scorer.get_pacing_status(user_id)
    stability_score = pacing.stability_score if pacing else None
    overall_severity = pacing.overall_severity.value if pacing and pacing.overall_severity else None

    return CreepScoreComputationResult(
        user_id=user_id,
        scores_computed=result.creep_scores_computed,
        overall_severity=overall_severity,
        stability_score=stability_score,
    )


def compute_full_analytics_pipeline(
    context: TestContext,
    force_full_recompute: bool = True,
) -> FullAnalyticsPipelineResult:
    if context.user is None:
        raise ValueError("Context must have a user")

    analytics_result = compute_analytics(context, force_full_recompute=force_full_recompute)

    baseline_result = compute_baselines(context, force_recompute=False)

    creep_result: CreepScoreComputationResult | None = None
    if baseline_result.baselines_computed > 0 or baseline_result.error is None:
        creep_result = compute_creep_scores(context)

    return FullAnalyticsPipelineResult(
        user_id=context.user_id,
        analytics=analytics_result,
        baselines=baseline_result,
        creep_scores=creep_result,
    )


class AnalyticsComputationResult:
    def __init__(self, user_id: UUID) -> None:
        self.user_id = user_id
        self.spending_periods_computed: int = 0
        self.transactions_processed: int = 0
        self.merchants_computed: int = 0
        self.cash_flow_periods_computed: int = 0
        self.income_sources_detected: int = 0

    def __repr__(self) -> str:
        return (
            f"AnalyticsComputationResult("
            f"periods={self.spending_periods_computed}, "
            f"txns={self.transactions_processed}, "
            f"merchants={self.merchants_computed})"
        )


class BaselineComputationResult:
    def __init__(
        self,
        user_id: UUID,
        baselines_computed: int = 0,
        categories_analyzed: int = 0,
        error: str | None = None,
    ) -> None:
        self.user_id = user_id
        self.baselines_computed = baselines_computed
        self.categories_analyzed = categories_analyzed
        self.error = error

    @property
    def success(self) -> bool:
        return self.error is None and self.baselines_computed > 0

    def __repr__(self) -> str:
        if self.error:
            return f"BaselineComputationResult(error={self.error})"
        return f"BaselineComputationResult(baselines={self.baselines_computed}, categories={self.categories_analyzed})"


class CreepScoreComputationResult:
    def __init__(
        self,
        user_id: UUID,
        scores_computed: int = 0,
        overall_severity: str | None = None,
        stability_score: int | None = None,
        error: str | None = None,
    ) -> None:
        self.user_id = user_id
        self.scores_computed = scores_computed
        self.overall_severity = overall_severity
        self.stability_score = stability_score
        self.error = error

    @property
    def success(self) -> bool:
        return self.error is None

    def __repr__(self) -> str:
        if self.error:
            return f"CreepScoreComputationResult(error={self.error})"
        return (
            f"CreepScoreComputationResult("
            f"scores={self.scores_computed}, "
            f"severity={self.overall_severity}, "
            f"stability={self.stability_score})"
        )


class FullAnalyticsPipelineResult:
    def __init__(
        self,
        user_id: UUID,
        analytics: AnalyticsComputationResult,
        baselines: BaselineComputationResult,
        creep_scores: CreepScoreComputationResult | None = None,
    ) -> None:
        self.user_id = user_id
        self.analytics = analytics
        self.baselines = baselines
        self.creep_scores = creep_scores

    @property
    def success(self) -> bool:
        return self.baselines.success and (
            self.creep_scores is None or self.creep_scores.success
        )

    def __repr__(self) -> str:
        return (
            f"FullAnalyticsPipelineResult("
            f"analytics={self.analytics}, "
            f"baselines={self.baselines}, "
            f"creep={self.creep_scores})"
        )
