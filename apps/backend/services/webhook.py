from __future__ import annotations

import hashlib
import hmac
import time
from typing import TYPE_CHECKING, Any
from uuid import UUID

from models.webhook import (
    ItemWebhookCode,
    PlaidWebhookRequest,
    TransactionsWebhookCode,
    WebhookEventCreate,
    WebhookEventStatus,
    WebhookType,
)

if TYPE_CHECKING:
    from repositories.plaid_item import PlaidItemRepository
    from repositories.webhook_event import WebhookEventRepository
    from services.recurring import RecurringSyncService
    from services.transaction_sync import TransactionSyncService


class WebhookVerificationError(Exception):
    def __init__(self, message: str = "Webhook verification failed") -> None:
        self.message = message
        super().__init__(self.message)


class WebhookProcessingError(Exception):
    def __init__(self, message: str = "Webhook processing failed") -> None:
        self.message = message
        super().__init__(self.message)


class WebhookService:
    _SIGNATURE_TOLERANCE_SECONDS = 300

    def __init__(
        self,
        webhook_event_repo: WebhookEventRepository,
        plaid_item_repo: PlaidItemRepository,
        transaction_sync_service: TransactionSyncService,
        recurring_sync_service: RecurringSyncService,
    ) -> None:
        self._webhook_event_repo = webhook_event_repo
        self._plaid_item_repo = plaid_item_repo
        self._transaction_sync_service = transaction_sync_service
        self._recurring_sync_service = recurring_sync_service

    def verify_signature(
        self,
        body: bytes,
        plaid_signature: str,
        webhook_secret: str,
    ) -> bool:
        try:
            signed_jwt = plaid_signature
            parts = signed_jwt.split(".")
            if len(parts) != 3:
                return False

            header_b64, payload_b64, signature_b64 = parts

            message = f"{header_b64}.{payload_b64}"
            expected_signature = hmac.new(
                webhook_secret.encode(),
                message.encode(),
                hashlib.sha256,
            ).hexdigest()

            return hmac.compare_digest(expected_signature, signature_b64)
        except Exception:
            return False

    def verify_timestamp(self, timestamp: int) -> bool:
        current_time = int(time.time())
        return abs(current_time - timestamp) <= self._SIGNATURE_TOLERANCE_SECONDS

    def generate_idempotency_key(self, webhook: PlaidWebhookRequest) -> str:
        key_parts = [
            webhook.webhook_type,
            webhook.webhook_code,
            webhook.item_id,
            str(webhook.new_transactions or 0),
        ]
        return hashlib.sha256(":".join(key_parts).encode()).hexdigest()[:32]

    def is_duplicate(self, idempotency_key: str) -> bool:
        existing = self._webhook_event_repo.get_by_idempotency_key(idempotency_key)
        return existing is not None

    def store_event(
        self,
        webhook: PlaidWebhookRequest,
        payload: dict[str, Any],
    ) -> UUID:
        idempotency_key = self.generate_idempotency_key(webhook)

        plaid_item = self._plaid_item_repo.get_by_item_id(webhook.item_id)
        plaid_item_id = UUID(plaid_item["id"]) if plaid_item else None

        event_data = WebhookEventCreate(
            webhook_type=webhook.webhook_type,
            webhook_code=webhook.webhook_code,
            item_id=webhook.item_id,
            plaid_item_id=plaid_item_id,
            payload=payload,
            idempotency_key=idempotency_key,
        )

        created = self._webhook_event_repo.create(event_data)
        return UUID(created["id"])

    def process_webhook(self, webhook: PlaidWebhookRequest, event_id: UUID) -> None:
        try:
            webhook_type = WebhookType(webhook.webhook_type)

            if webhook_type == WebhookType.TRANSACTIONS:
                self._handle_transactions_webhook(webhook, event_id)
            elif webhook_type == WebhookType.ITEM:
                self._handle_item_webhook(webhook, event_id)
            else:
                self._webhook_event_repo.update_status(
                    event_id,
                    WebhookEventStatus.SKIPPED,
                    error_message=f"Unhandled webhook type: {webhook.webhook_type}",
                )

        except ValueError:
            self._webhook_event_repo.update_status(
                event_id,
                WebhookEventStatus.SKIPPED,
                error_message=f"Unknown webhook type: {webhook.webhook_type}",
            )
        except Exception as e:
            self._webhook_event_repo.update_status(
                event_id,
                WebhookEventStatus.FAILED,
                error_message=str(e),
            )
            raise WebhookProcessingError(str(e)) from e

    def _handle_transactions_webhook(self, webhook: PlaidWebhookRequest, event_id: UUID) -> None:
        try:
            code = TransactionsWebhookCode(webhook.webhook_code)
        except ValueError:
            self._webhook_event_repo.update_status(
                event_id,
                WebhookEventStatus.SKIPPED,
                error_message=f"Unknown transactions webhook code: {webhook.webhook_code}",
            )
            return

        sync_codes = {
            TransactionsWebhookCode.SYNC_UPDATES_AVAILABLE,
            TransactionsWebhookCode.INITIAL_UPDATE,
            TransactionsWebhookCode.HISTORICAL_UPDATE,
            TransactionsWebhookCode.DEFAULT_UPDATE,
        }

        if code in sync_codes:
            self._trigger_transaction_sync(webhook.item_id, event_id)
        elif code == TransactionsWebhookCode.TRANSACTIONS_REMOVED:
            self._trigger_transaction_sync(webhook.item_id, event_id)
        elif code == TransactionsWebhookCode.RECURRING_TRANSACTIONS_UPDATE:
            self._trigger_recurring_sync(webhook.item_id, event_id)
        else:
            self._webhook_event_repo.update_status(
                event_id,
                WebhookEventStatus.SKIPPED,
                error_message=f"Unhandled transactions webhook code: {code}",
            )

    def _handle_item_webhook(self, webhook: PlaidWebhookRequest, event_id: UUID) -> None:
        try:
            code = ItemWebhookCode(webhook.webhook_code)
        except ValueError:
            self._webhook_event_repo.update_status(
                event_id,
                WebhookEventStatus.SKIPPED,
                error_message=f"Unknown item webhook code: {webhook.webhook_code}",
            )
            return

        plaid_item = self._plaid_item_repo.get_by_item_id(webhook.item_id)
        if not plaid_item:
            self._webhook_event_repo.update_status(
                event_id,
                WebhookEventStatus.FAILED,
                error_message=f"Plaid item not found: {webhook.item_id}",
            )
            return

        plaid_item_id = UUID(plaid_item["id"])

        if code == ItemWebhookCode.ERROR:
            error_code = webhook.error.get("error_code") if webhook.error else None
            error_message = webhook.error.get("error_message") if webhook.error else None
            self._plaid_item_repo.update_status(
                plaid_item_id,
                "error",
                error_code=error_code,
                error_message=error_message,
            )
            self._webhook_event_repo.update_status(event_id, WebhookEventStatus.COMPLETED)

        elif code == ItemWebhookCode.LOGIN_REPAIRED:
            self._plaid_item_repo.update_status(plaid_item_id, "active")
            self._webhook_event_repo.update_status(event_id, WebhookEventStatus.COMPLETED)

        elif code == ItemWebhookCode.PENDING_EXPIRATION:
            self._webhook_event_repo.update_status(event_id, WebhookEventStatus.COMPLETED)

        elif code in (ItemWebhookCode.USER_PERMISSION_REVOKED, ItemWebhookCode.USER_ACCOUNT_REVOKED):
            self._plaid_item_repo.update_status(plaid_item_id, "revoked")
            self._webhook_event_repo.update_status(event_id, WebhookEventStatus.COMPLETED)

        elif code == ItemWebhookCode.WEBHOOK_UPDATE_ACKNOWLEDGED:
            self._webhook_event_repo.update_status(event_id, WebhookEventStatus.COMPLETED)

        else:
            self._webhook_event_repo.update_status(
                event_id,
                WebhookEventStatus.SKIPPED,
                error_message=f"Unhandled item webhook code: {code}",
            )

    def _trigger_transaction_sync(self, item_id: str, event_id: UUID) -> None:
        try:
            self._transaction_sync_service.sync_item(item_id)
            self._webhook_event_repo.update_status(event_id, WebhookEventStatus.COMPLETED)
        except Exception as e:
            self._webhook_event_repo.update_status(
                event_id,
                WebhookEventStatus.FAILED,
                error_message=f"Sync failed: {e}",
            )
            raise

    def _trigger_recurring_sync(self, item_id: str, event_id: UUID) -> None:
        try:
            plaid_item = self._plaid_item_repo.get_by_item_id(item_id)
            if not plaid_item:
                self._webhook_event_repo.update_status(
                    event_id,
                    WebhookEventStatus.FAILED,
                    error_message=f"Plaid item not found: {item_id}",
                )
                return

            plaid_item_id = UUID(plaid_item["id"])
            self._recurring_sync_service.sync_for_plaid_item(plaid_item_id)
            self._webhook_event_repo.update_status(event_id, WebhookEventStatus.COMPLETED)
        except Exception as e:
            self._webhook_event_repo.update_status(
                event_id,
                WebhookEventStatus.FAILED,
                error_message=f"Recurring sync failed: {e}",
            )
            raise


class WebhookServiceContainer:
    _instance: WebhookService | None = None

    @classmethod
    def get(cls) -> WebhookService:
        if cls._instance is None:
            from repositories.plaid_item import get_plaid_item_repository
            from repositories.webhook_event import get_webhook_event_repository
            from services.recurring import get_recurring_sync_service
            from services.transaction_sync import get_transaction_sync_service

            webhook_event_repo = get_webhook_event_repository()
            plaid_item_repo = get_plaid_item_repository()
            transaction_sync_service = get_transaction_sync_service()
            recurring_sync_service = get_recurring_sync_service()
            cls._instance = WebhookService(
                webhook_event_repo,
                plaid_item_repo,
                transaction_sync_service,
                recurring_sync_service,
            )
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_webhook_service() -> WebhookService:
    return WebhookServiceContainer.get()
