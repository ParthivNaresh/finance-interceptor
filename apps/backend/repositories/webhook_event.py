from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from models.webhook import WebhookEventCreate, WebhookEventResponse, WebhookEventStatus
from repositories.base import BaseRepository
from services.database import DatabaseService, get_database_service


class WebhookEventRepository(BaseRepository[WebhookEventResponse, WebhookEventCreate]):
    def __init__(self, database_service: DatabaseService) -> None:
        super().__init__(database_service, "webhook_events")

    def get_by_idempotency_key(self, idempotency_key: str) -> dict[str, Any] | None:
        result = self._get_table().select("*").eq("idempotency_key", idempotency_key).execute()
        if not result.data:
            return None
        return dict(result.data[0])

    def get_by_item_id(self, item_id: str, limit: int = 50) -> list[dict[str, Any]]:
        result = (
            self._get_table()
            .select("*")
            .eq("item_id", item_id)
            .order("received_at", desc=True)
            .limit(limit)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def get_pending_events(self, limit: int = 100) -> list[dict[str, Any]]:
        result = (
            self._get_table()
            .select("*")
            .eq("status", WebhookEventStatus.PENDING.value)
            .order("received_at", desc=True)
            .limit(limit)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def update_status(
        self,
        event_id: UUID,
        status: WebhookEventStatus,
        error_message: str | None = None,
    ) -> dict[str, Any] | None:
        update_data: dict[str, Any] = {"status": status.value}

        if status == WebhookEventStatus.COMPLETED:
            update_data["processed_at"] = datetime.now(timezone.utc).isoformat()

        if error_message is not None:
            update_data["error_message"] = error_message

        result = self._get_table().update(update_data).eq("id", str(event_id)).execute()
        if not result.data:
            return None
        return dict(result.data[0])

    def increment_retry_count(self, event_id: UUID) -> dict[str, Any] | None:
        current = self.get_by_id(event_id)
        if not current:
            return None

        new_count = current.get("retry_count", 0) + 1
        result = self._get_table().update({"retry_count": new_count}).eq("id", str(event_id)).execute()
        if not result.data:
            return None
        return dict(result.data[0])

    def link_to_plaid_item(self, event_id: UUID, plaid_item_id: UUID) -> dict[str, Any] | None:
        result = (
            self._get_table()
            .update({"plaid_item_id": str(plaid_item_id)})
            .eq("id", str(event_id))
            .execute()
        )
        if not result.data:
            return None
        return dict(result.data[0])


class WebhookEventRepositoryContainer:
    _instance: WebhookEventRepository | None = None

    @classmethod
    def get(cls) -> WebhookEventRepository:
        if cls._instance is None:
            database_service = get_database_service()
            cls._instance = WebhookEventRepository(database_service)
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_webhook_event_repository() -> WebhookEventRepository:
    return WebhookEventRepositoryContainer.get()
