from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from models.plaid import PlaidItemCreate, PlaidItemResponse
from repositories.base import BaseRepository
from services.database import DatabaseService, get_database_service


class PlaidItemRepository(BaseRepository[PlaidItemResponse, PlaidItemCreate]):
    def __init__(self, database_service: DatabaseService) -> None:
        super().__init__(database_service, "plaid_items")

    def get_by_user_id(self, user_id: UUID) -> list[dict[str, Any]]:
        result = self._get_table().select("*").eq("user_id", str(user_id)).execute()
        return [dict(item) for item in result.data] if result.data else []

    def get_by_item_id(self, item_id: str) -> dict[str, Any] | None:
        result = self._get_table().select("*").eq("item_id", item_id).execute()
        if not result.data:
            return None
        return dict(result.data[0])

    def update_status(
        self,
        record_id: UUID,
        status: str,
        error_code: str | None = None,
        error_message: str | None = None,
    ) -> dict[str, Any] | None:
        update_data: dict[str, Any] = {"status": status}
        if error_code is not None:
            update_data["error_code"] = error_code
        if error_message is not None:
            update_data["error_message"] = error_message
        if status == "active":
            update_data["error_code"] = None
            update_data["error_message"] = None

        result = self._get_table().update(update_data).eq("id", str(record_id)).execute()
        if not result.data:
            return None
        return dict(result.data[0])

    def update_access_token(self, record_id: UUID, encrypted_token: str) -> dict[str, Any] | None:
        result = (
            self._get_table()
            .update({"encrypted_access_token": encrypted_token})
            .eq("id", str(record_id))
            .execute()
        )
        if not result.data:
            return None
        return dict(result.data[0])

    def update_sync_cursor(self, record_id: UUID, cursor: str) -> dict[str, Any] | None:
        result = (
            self._get_table()
            .update({"sync_cursor": cursor})
            .eq("id", str(record_id))
            .execute()
        )
        if not result.data:
            return None
        return dict(result.data[0])

    def update_last_sync(self, record_id: UUID) -> dict[str, Any] | None:
        result = (
            self._get_table()
            .update({"last_successful_sync": datetime.now(timezone.utc).isoformat()})
            .eq("id", str(record_id))
            .execute()
        )
        if not result.data:
            return None
        return dict(result.data[0])


class PlaidItemRepositoryContainer:
    _instance: PlaidItemRepository | None = None

    @classmethod
    def get(cls) -> PlaidItemRepository:
        if cls._instance is None:
            database_service = get_database_service()
            cls._instance = PlaidItemRepository(database_service)
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_plaid_item_repository() -> PlaidItemRepository:
    return PlaidItemRepositoryContainer.get()
