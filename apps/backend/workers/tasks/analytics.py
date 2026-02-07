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

    spending_error: Exception | None = None
    merchant_error: Exception | None = None

    try:
        spending_result = worker_context.spending_manager.compute_current_month(user_id)
        spending_periods = spending_result.periods_computed
        spending_transactions = spending_result.transactions_processed
        log.info(
            "task.analytics.spending_completed",
            periods_computed=spending_periods,
            transactions_processed=spending_transactions,
        )
    except Exception as e:
        spending_error = e
        errors.append("Spending computation failed")
        log.warning("task.analytics.spending_failed")

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
        log.warning("task.analytics.merchant_stats_failed")

    if spending_error and merchant_error:
        raise AnalyticsTaskError(
            "Both computations failed",
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
        "partial_failure": result.partial_failure,
        "errors": result.errors,
        "success": not result.partial_failure and len(result.errors) == 0,
    }
