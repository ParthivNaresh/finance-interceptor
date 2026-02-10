from dataclasses import dataclass
from typing import Any
from uuid import UUID

from arq import Retry

from observability import bind_context, clear_context, get_logger
from workers.context import WorkerContext

logger = get_logger("workers.tasks.analytics")


class AnalyticsTaskError(Exception):
    def __init__(self, message: str, retryable: bool = True) -> None:
        self.message = message
        self.retryable = retryable
        super().__init__(self.message)


@dataclass
class TaskResult:
    user_id: str
    spending_periods: int
    spending_transactions: int
    merchant_count: int
    merchant_transactions: int
    cash_flow_periods: int
    income_sources: int
    baselines_computed: int
    creep_scores_computed: int
    target_auto_established: bool
    partial_failure: bool
    errors: list[str]


async def compute_analytics_for_user(ctx: dict[str, Any], user_id: str) -> dict[str, Any]:
    user_uuid = UUID(user_id)
    job_try = ctx.get("job_try", 1)

    bind_context(user_id=user_id, task="compute_analytics", job_try=job_try)

    log = logger.bind(user_id=user_id, job_try=job_try)
    log.info("task.analytics.started")

    worker_context: WorkerContext = ctx["worker_context"]

    try:
        result = _execute_analytics(worker_context, user_uuid, log)
        worker_context.cache_invalidator.on_analytics_computation(user_uuid)
        clear_context()
        return _to_dict(result)
    except AnalyticsTaskError as e:
        log.error(
            "task.analytics.failed",
            error=e.message,
            retryable=e.retryable,
        )
        clear_context()
        if e.retryable:
            raise Retry(defer=ctx.get("job_try", 1) * 10) from e
        raise
    except Exception as e:
        log.exception("task.analytics.unexpected_error")
        clear_context()
        raise Retry(defer=ctx.get("job_try", 1) * 10) from e


def _execute_analytics(
    worker_context: WorkerContext,
    user_id: UUID,
    log: Any,
) -> TaskResult:
    errors: list[str] = []
    spending_periods = 0
    spending_transactions = 0
    merchant_count = 0
    merchant_transactions = 0
    cash_flow_periods = 0
    income_sources = 0
    baselines_computed = 0
    creep_scores_computed = 0
    target_auto_established = False

    spending_error: Exception | None = None
    merchant_error: Exception | None = None
    cash_flow_error: Exception | None = None

    try:
        spending_result = worker_context.spending_manager.compute_for_user(
            user_id, force_full_recompute=True
        )
        spending_periods = spending_result.periods_computed
        spending_transactions = spending_result.transactions_processed
        log.info(
            "task.analytics.spending_completed",
            periods_computed=spending_periods,
            transactions_processed=spending_transactions,
            categories_computed=spending_result.categories_computed,
            merchants_computed=spending_result.merchants_computed,
        )
    except Exception as e:
        spending_error = e
        errors.append("Spending computation failed")
        log.warning("task.analytics.spending_failed", error=str(e))

    try:
        merchant_result = worker_context.merchant_aggregator.compute_for_user(user_id)
        merchant_count = merchant_result.merchants_computed
        merchant_transactions = merchant_result.transactions_processed
        log.info(
            "task.analytics.merchant_stats_completed",
            merchants_computed=merchant_count,
            transactions_processed=merchant_transactions,
        )
    except Exception as e:
        merchant_error = e
        errors.append("Merchant stats computation failed")
        log.warning("task.analytics.merchant_stats_failed", error=str(e))

    try:
        cash_flow_result = worker_context.cash_flow_aggregator.compute_for_user(
            user_id, force_full_recompute=True
        )
        cash_flow_periods = cash_flow_result.periods_computed
        income_sources = cash_flow_result.income_sources_detected
        log.info(
            "task.analytics.cash_flow_completed",
            periods_computed=cash_flow_periods,
            income_sources_detected=income_sources,
        )
    except Exception as e:
        cash_flow_error = e
        errors.append("Cash flow computation failed")
        log.warning("task.analytics.cash_flow_failed", error=str(e))

    if worker_context.baseline_calculator.should_compute_baselines(user_id):
        try:
            baseline_result = worker_context.baseline_calculator.compute_baselines_for_user(
                user_id, force_recompute=False
            )
            baselines_computed = baseline_result.baselines_computed
            if baselines_computed > 0:
                target_auto_established = True
                log.info(
                    "task.analytics.target_auto_established",
                    baselines_computed=baselines_computed,
                    period_start=str(baseline_result.baseline_period_start),
                    period_end=str(baseline_result.baseline_period_end),
                )
        except Exception as e:
            errors.append("Baseline computation failed")
            log.warning("task.analytics.baseline_failed", error=str(e))

    baseline_status = worker_context.baseline_calculator.get_baseline_status(user_id)
    if baseline_status.has_baselines:
        try:
            creep_result = worker_context.creep_scorer.compute_current_period(user_id)
            creep_scores_computed = creep_result.creep_scores_computed
            log.info(
                "task.analytics.creep_completed",
                scores_computed=creep_scores_computed,
            )
        except Exception as e:
            errors.append("Creep score computation failed")
            log.warning("task.analytics.creep_failed", error=str(e))

    if spending_error and merchant_error and cash_flow_error:
        raise AnalyticsTaskError(
            "All computations failed",
            retryable=True,
        )

    partial_failure = bool(errors)

    if partial_failure:
        log.warning(
            "task.analytics.completed_with_partial_failure",
            error_count=len(errors),
        )
    else:
        log.info("task.analytics.completed")

    return TaskResult(
        user_id=str(user_id),
        spending_periods=spending_periods,
        spending_transactions=spending_transactions,
        merchant_count=merchant_count,
        merchant_transactions=merchant_transactions,
        cash_flow_periods=cash_flow_periods,
        income_sources=income_sources,
        baselines_computed=baselines_computed,
        creep_scores_computed=creep_scores_computed,
        target_auto_established=target_auto_established,
        partial_failure=partial_failure,
        errors=errors,
    )


def _to_dict(result: TaskResult) -> dict[str, Any]:
    return {
        "user_id": result.user_id,
        "spending": {
            "periods_computed": result.spending_periods,
            "transactions_processed": result.spending_transactions,
        },
        "merchant_stats": {
            "merchants_computed": result.merchant_count,
            "transactions_processed": result.merchant_transactions,
        },
        "cash_flow": {
            "periods_computed": result.cash_flow_periods,
            "income_sources_detected": result.income_sources,
        },
        "lifestyle_creep": {
            "baselines_computed": result.baselines_computed,
            "creep_scores_computed": result.creep_scores_computed,
            "target_auto_established": result.target_auto_established,
        },
        "partial_failure": result.partial_failure,
        "errors": result.errors,
        "success": not result.partial_failure and len(result.errors) == 0,
    }
