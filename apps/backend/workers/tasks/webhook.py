from dataclasses import dataclass, field
from typing import Any
from uuid import UUID

from arq import Retry

from models.webhook import (
    ItemWebhookCode,
    PlaidWebhookRequest,
    TransactionsWebhookCode,
    WebhookEventStatus,
    WebhookType,
)
from observability import bind_context, clear_context, get_logger
from workers.context import WebhookWorkerContext

logger = get_logger("workers.tasks.webhook")


class WebhookTaskError(Exception):
    def __init__(self, message: str, retryable: bool = True) -> None:
        self.message = message
        self.retryable = retryable
        super().__init__(self.message)


@dataclass
class WebhookTaskResult:
    event_id: str
    webhook_type: str
    webhook_code: str
    item_id: str
    status: str
    transactions_added: int = 0
    transactions_modified: int = 0
    transactions_removed: int = 0
    recurring_synced: bool = False
    analytics_enqueued: bool = False
    analytics_ran_sync: bool = False
    partial_failure: bool = False
    errors: list[str] = field(default_factory=list)


async def process_plaid_webhook(
    ctx: dict[str, Any],
    event_id: str,
    webhook_type: str,
    webhook_code: str,
    item_id: str,
    payload: dict[str, Any],
) -> dict[str, Any]:
    event_uuid = UUID(event_id)
    job_try = ctx.get("job_try", 1)

    bind_context(
        event_id=event_id,
        webhook_type=webhook_type,
        webhook_code=webhook_code,
        item_id=item_id,
        task="process_webhook",
        job_try=job_try,
    )

    log = logger.bind(
        event_id=event_id,
        webhook_type=webhook_type,
        webhook_code=webhook_code,
        item_id=item_id,
        job_try=job_try,
    )
    log.info("task.webhook.started")

    worker_context: WebhookWorkerContext = ctx["webhook_context"]

    worker_context.webhook_event_repo.update_status(event_uuid, WebhookEventStatus.PROCESSING)

    try:
        webhook = PlaidWebhookRequest(
            webhook_type=webhook_type,
            webhook_code=webhook_code,
            item_id=item_id,
            error=payload.get("error"),
            new_transactions=payload.get("new_transactions"),
            removed_transactions=payload.get("removed_transactions"),
            consent_expiration_time=payload.get("consent_expiration_time"),
        )

        result = await _execute_webhook_processing(worker_context, webhook, event_uuid, log)

        error_msg = "; ".join(result.errors) if result.errors else None
        worker_context.webhook_event_repo.update_status(
            event_uuid, WebhookEventStatus.COMPLETED, error_msg
        )

        clear_context()
        return _to_dict(result)

    except WebhookTaskError as e:
        log.error("task.webhook.failed", error=e.message, retryable=e.retryable)
        worker_context.webhook_event_repo.update_status(
            event_uuid, WebhookEventStatus.FAILED, e.message
        )
        worker_context.webhook_event_repo.increment_retry_count(event_uuid)
        clear_context()
        if e.retryable:
            raise Retry(defer=ctx.get("job_try", 1) * 10) from e
        raise

    except Exception as e:
        log.exception("task.webhook.unexpected_error")
        worker_context.webhook_event_repo.update_status(
            event_uuid, WebhookEventStatus.FAILED, str(e)
        )
        worker_context.webhook_event_repo.increment_retry_count(event_uuid)
        clear_context()
        raise Retry(defer=ctx.get("job_try", 1) * 10) from e


async def _execute_webhook_processing(
    worker_context: WebhookWorkerContext,
    webhook: PlaidWebhookRequest,
    event_id: UUID,
    log: Any,
) -> WebhookTaskResult:
    result = WebhookTaskResult(
        event_id=str(event_id),
        webhook_type=webhook.webhook_type,
        webhook_code=webhook.webhook_code,
        item_id=webhook.item_id,
        status="processing",
    )

    try:
        wh_type = WebhookType(webhook.webhook_type)
    except ValueError:
        log.warning("task.webhook.unknown_type", status="skipped")
        result.status = "skipped"
        result.errors.append(f"Unknown webhook type: {webhook.webhook_type}")
        return result

    if wh_type == WebhookType.TRANSACTIONS:
        await _handle_transactions_webhook(worker_context, webhook, result, log)
    elif wh_type == WebhookType.ITEM:
        _handle_item_webhook(worker_context, webhook, result, log)
    else:
        log.warning("task.webhook.unhandled_type", status="skipped")
        result.status = "skipped"
        result.errors.append(f"Unhandled webhook type: {webhook.webhook_type}")

    if not result.errors:
        result.status = "completed"
    elif result.partial_failure:
        result.status = "completed_with_errors"

    return result


async def _handle_transactions_webhook(
    worker_context: WebhookWorkerContext,
    webhook: PlaidWebhookRequest,
    result: WebhookTaskResult,
    log: Any,
) -> None:
    try:
        code = TransactionsWebhookCode(webhook.webhook_code)
    except ValueError:
        log.warning("task.webhook.transactions.unknown_code", status="skipped")
        result.status = "skipped"
        result.errors.append(f"Unknown transactions webhook code: {webhook.webhook_code}")
        return

    sync_codes = {
        TransactionsWebhookCode.SYNC_UPDATES_AVAILABLE,
        TransactionsWebhookCode.INITIAL_UPDATE,
        TransactionsWebhookCode.HISTORICAL_UPDATE,
        TransactionsWebhookCode.DEFAULT_UPDATE,
    }

    if code in sync_codes or code == TransactionsWebhookCode.TRANSACTIONS_REMOVED:
        log.info("task.webhook.transactions.syncing")
        await _trigger_transaction_sync(worker_context, webhook.item_id, result, log)

    elif code == TransactionsWebhookCode.RECURRING_TRANSACTIONS_UPDATE:
        log.info("task.webhook.recurring.syncing")
        _trigger_recurring_sync_only(worker_context, webhook.item_id, result, log)

    else:
        log.warning("task.webhook.transactions.unhandled_code", status="skipped")
        result.status = "skipped"
        result.errors.append(f"Unhandled transactions webhook code: {code}")


async def _trigger_transaction_sync(
    worker_context: WebhookWorkerContext,
    item_id: str,
    result: WebhookTaskResult,
    log: Any,
) -> None:
    plaid_item = worker_context.plaid_item_repo.get_by_item_id(item_id)
    if not plaid_item:
        log.warning(
            "task.webhook.plaid_item_not_found_skipping",
            reason="Item may not be created yet (race condition with token exchange)",
        )
        result.status = "skipped"
        result.errors.append(f"Plaid item not found: {item_id} (may be race condition)")
        return

    try:
        sync_result = worker_context.transaction_sync_service.sync_item(item_id)
        result.transactions_added = sync_result.added
        result.transactions_modified = sync_result.modified
        result.transactions_removed = sync_result.removed
        log.info(
            "task.webhook.transaction_sync.completed",
            transactions_added=sync_result.added,
            transactions_modified=sync_result.modified,
            transactions_removed=sync_result.removed,
        )
    except Exception as e:
        log.exception("task.webhook.transaction_sync.failed")
        result.partial_failure = True
        result.errors.append(f"Transaction sync failed: {e}")
        raise WebhookTaskError("Transaction sync failed", retryable=True) from e

    plaid_item_id = UUID(plaid_item["id"])
    user_id = UUID(plaid_item["user_id"])

    worker_context.cache_invalidator.on_transaction_sync(user_id)

    _trigger_recurring_sync_silent(worker_context, plaid_item_id, result, log)

    await _trigger_analytics_computation(worker_context, user_id, result, log)


def _trigger_recurring_sync_only(
    worker_context: WebhookWorkerContext,
    item_id: str,
    result: WebhookTaskResult,
    log: Any,
) -> None:
    plaid_item = worker_context.plaid_item_repo.get_by_item_id(item_id)
    if not plaid_item:
        log.error("task.webhook.recurring_sync.item_not_found")
        result.errors.append(f"Plaid item not found: {item_id}")
        return

    plaid_item_id = UUID(plaid_item["id"])

    try:
        worker_context.recurring_sync_service.sync_for_plaid_item(plaid_item_id)
        result.recurring_synced = True
        log.info("task.webhook.recurring_sync.completed")
        user_id = UUID(plaid_item["user_id"])
        worker_context.cache_invalidator.on_recurring_sync(user_id)
    except Exception as e:
        log.exception("task.webhook.recurring_sync.failed")
        result.partial_failure = True
        result.errors.append(f"Recurring sync failed: {e}")


def _trigger_recurring_sync_silent(
    worker_context: WebhookWorkerContext,
    plaid_item_id: UUID,
    result: WebhookTaskResult,
    log: Any,
) -> None:
    try:
        worker_context.recurring_sync_service.sync_for_plaid_item(plaid_item_id)
        result.recurring_synced = True
        log.info("task.webhook.recurring_sync.completed")
    except Exception:
        log.warning("task.webhook.recurring_sync.failed_silent")


async def _trigger_analytics_computation(
    worker_context: WebhookWorkerContext,
    user_id: UUID,
    result: WebhookTaskResult,
    log: Any,
) -> None:
    analytics_log = log.bind(user_id=str(user_id))

    if worker_context.task_queue_service.is_enabled():
        try:
            enqueue_result = await worker_context.task_queue_service.enqueue_analytics_computation(
                user_id
            )
            result.analytics_enqueued = True
            analytics_log.info(
                "task.webhook.analytics.enqueued",
                job_id=enqueue_result.job_id,
                was_debounced=enqueue_result.was_debounced,
                defer_seconds=enqueue_result.defer_seconds,
            )
            return
        except Exception:
            analytics_log.warning("task.webhook.analytics.enqueue_failed")

    _run_analytics_sync(worker_context, user_id, result, analytics_log)
    worker_context.cache_invalidator.on_analytics_computation(user_id)


def _run_analytics_sync(
    worker_context: WebhookWorkerContext,
    user_id: UUID,
    result: WebhookTaskResult,
    log: Any,
) -> None:
    result.analytics_ran_sync = True

    try:
        spending_result = worker_context.spending_manager.compute_for_user(
            user_id, force_full_recompute=True
        )
        log.info(
            "task.webhook.analytics.spending_completed",
            periods_computed=spending_result.periods_computed,
            transactions_processed=spending_result.transactions_processed,
        )
    except Exception:
        log.warning("task.webhook.analytics.spending_failed")

    try:
        stats_result = worker_context.merchant_aggregator.compute_for_user(user_id)
        log.info(
            "task.webhook.analytics.merchant_stats_completed",
            merchants_computed=stats_result.merchants_computed,
            transactions_processed=stats_result.transactions_processed,
        )
    except Exception:
        log.warning("task.webhook.analytics.merchant_stats_failed")

    try:
        cash_flow_result = worker_context.cash_flow_aggregator.compute_for_user(
            user_id, force_full_recompute=True
        )
        log.info(
            "task.webhook.analytics.cash_flow_completed",
            periods_computed=cash_flow_result.periods_computed,
            income_sources_detected=cash_flow_result.income_sources_detected,
        )
    except Exception:
        log.warning("task.webhook.analytics.cash_flow_failed")

    if worker_context.baseline_calculator.should_compute_baselines(user_id):
        try:
            baseline_result = worker_context.baseline_calculator.compute_baselines_for_user(
                user_id, force_recompute=False
            )
            if baseline_result.baselines_computed > 0:
                log.info(
                    "task.webhook.analytics.target_auto_established",
                    baselines_computed=baseline_result.baselines_computed,
                )
        except Exception:
            log.warning("task.webhook.analytics.baseline_failed")

    baseline_status = worker_context.baseline_calculator.get_baseline_status(user_id)
    if baseline_status.has_baselines:
        try:
            creep_result = worker_context.creep_scorer.compute_current_period(user_id)
            log.info(
                "task.webhook.analytics.creep_completed",
                scores_computed=creep_result.creep_scores_computed,
            )
        except Exception:
            log.warning("task.webhook.analytics.creep_failed")


def _handle_item_webhook(
    worker_context: WebhookWorkerContext,
    webhook: PlaidWebhookRequest,
    result: WebhookTaskResult,
    log: Any,
) -> None:
    try:
        code = ItemWebhookCode(webhook.webhook_code)
    except ValueError:
        log.warning("task.webhook.item.unknown_code", status="skipped")
        result.status = "skipped"
        result.errors.append(f"Unknown item webhook code: {webhook.webhook_code}")
        return

    plaid_item = worker_context.plaid_item_repo.get_by_item_id(webhook.item_id)
    if not plaid_item:
        log.error("task.webhook.item.not_found")
        result.errors.append(f"Plaid item not found: {webhook.item_id}")
        return

    plaid_item_id = UUID(plaid_item["id"])

    if code == ItemWebhookCode.ERROR:
        error_code = webhook.error.get("error_code") if webhook.error else None
        error_message = webhook.error.get("error_message") if webhook.error else None
        log.warning(
            "task.webhook.item.error_received",
            plaid_error_code=error_code,
            plaid_error_message=error_message,
        )
        worker_context.plaid_item_repo.update_status(
            plaid_item_id, "error", error_code=error_code, error_message=error_message
        )

    elif code == ItemWebhookCode.LOGIN_REPAIRED:
        log.info("task.webhook.item.login_repaired")
        worker_context.plaid_item_repo.update_status(plaid_item_id, "active")

    elif code == ItemWebhookCode.PENDING_EXPIRATION:
        log.info("task.webhook.item.pending_expiration")

    elif code in (
        ItemWebhookCode.USER_PERMISSION_REVOKED,
        ItemWebhookCode.USER_ACCOUNT_REVOKED,
    ):
        log.warning("task.webhook.item.access_revoked")
        worker_context.plaid_item_repo.update_status(plaid_item_id, "revoked")

    elif code == ItemWebhookCode.WEBHOOK_UPDATE_ACKNOWLEDGED:
        log.info("task.webhook.item.webhook_update_acknowledged")

    else:
        log.warning("task.webhook.item.unhandled_code", status="skipped")
        result.status = "skipped"
        result.errors.append(f"Unhandled item webhook code: {code}")


def _to_dict(result: WebhookTaskResult) -> dict[str, Any]:
    return {
        "event_id": result.event_id,
        "webhook_type": result.webhook_type,
        "webhook_code": result.webhook_code,
        "item_id": result.item_id,
        "status": result.status,
        "sync": {
            "transactions_added": result.transactions_added,
            "transactions_modified": result.transactions_modified,
            "transactions_removed": result.transactions_removed,
            "recurring_synced": result.recurring_synced,
        },
        "analytics": {
            "enqueued": result.analytics_enqueued,
            "ran_sync": result.analytics_ran_sync,
        },
        "partial_failure": result.partial_failure,
        "errors": result.errors,
        "success": result.status == "completed" and not result.partial_failure,
    }
