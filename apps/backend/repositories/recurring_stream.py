from datetime import date, datetime
from typing import Any
from uuid import UUID

from models.enums import StreamStatus, StreamType
from models.recurring import RecurringStreamCreate, RecurringStreamResponse, RecurringStreamUpdate
from repositories.base import BaseRepository
from services.database import DatabaseService, get_database_service


class RecurringStreamRepository(BaseRepository[RecurringStreamResponse, RecurringStreamCreate]):
    def __init__(self, database_service: DatabaseService) -> None:
        super().__init__(database_service, "recurring_streams")

    def get_by_stream_id(self, plaid_item_id: UUID, stream_id: str) -> dict[str, Any] | None:
        result = (
            self._get_table()
            .select("*")
            .eq("plaid_item_id", str(plaid_item_id))
            .eq("stream_id", stream_id)
            .execute()
        )
        if not result.data:
            return None
        return dict(result.data[0])

    def get_by_user_id(self, user_id: UUID) -> list[dict[str, Any]]:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .order("last_date", desc=True)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def get_active_by_user_id(self, user_id: UUID) -> list[dict[str, Any]]:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .eq("is_active", True)
            .order("last_date", desc=True)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def get_by_plaid_item_id(self, plaid_item_id: UUID) -> list[dict[str, Any]]:
        result = (
            self._get_table()
            .select("*")
            .eq("plaid_item_id", str(plaid_item_id))
            .order("last_date", desc=True)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def get_by_type(self, user_id: UUID, stream_type: StreamType) -> list[dict[str, Any]]:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .eq("stream_type", stream_type.value)
            .eq("is_active", True)
            .order("last_date", desc=True)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def get_upcoming(
        self,
        user_id: UUID,
        days_ahead: int = 30
    ) -> list[dict[str, Any]]:
        today = date.today()
        end_date = date.today().replace(day=today.day + days_ahead) if days_ahead < 28 else date(
            today.year, today.month + 1, today.day
        ) if today.month < 12 else date(today.year + 1, 1, today.day)

        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .eq("is_active", True)
            .eq("stream_type", StreamType.OUTFLOW.value)
            .gte("predicted_next_date", str(today))
            .lte("predicted_next_date", str(end_date))
            .order("predicted_next_date", desc=False)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def update(self, stream_id: UUID, data: RecurringStreamUpdate) -> dict[str, Any] | None:
        update_data = data.model_dump(mode="json", exclude_none=True)
        if not update_data:
            return self.get_by_id(stream_id)

        result = (
            self._get_table()
            .update(update_data)
            .eq("id", str(stream_id))
            .execute()
        )
        if not result.data:
            return None
        return dict(result.data[0])

    def upsert(self, data: RecurringStreamCreate) -> dict[str, Any]:
        existing = self.get_by_stream_id(data.plaid_item_id, data.stream_id)

        if existing:
            update_data = RecurringStreamUpdate(
                description=data.description,
                merchant_name=data.merchant_name,
                category_primary=data.category_primary,
                category_detailed=data.category_detailed,
                frequency=data.frequency,
                last_date=data.last_date,
                predicted_next_date=data.predicted_next_date,
                average_amount=data.average_amount,
                last_amount=data.last_amount,
                is_active=data.is_active,
                status=data.status,
                is_user_modified=data.is_user_modified,
                transaction_ids=data.transaction_ids,
                plaid_raw=data.plaid_raw,
                last_synced_at=datetime.now(),
            )
            result = self.update(UUID(existing["id"]), update_data)
            if result:
                return result
            raise ValueError("Failed to update recurring stream")

        return self.create(data)

    def deactivate(self, stream_id: UUID) -> dict[str, Any] | None:
        result = (
            self._get_table()
            .update({"is_active": False, "status": StreamStatus.TOMBSTONED.value})
            .eq("id", str(stream_id))
            .execute()
        )
        if not result.data:
            return None
        return dict(result.data[0])

    def deactivate_missing(
        self,
        plaid_item_id: UUID,
        active_stream_ids: set[str]
    ) -> list[dict[str, Any]]:
        existing = self.get_by_plaid_item_id(plaid_item_id)
        deactivated = []

        for stream in existing:
            if stream["stream_id"] not in active_stream_ids and stream["is_active"]:
                result = self.deactivate(UUID(stream["id"]))
                if result:
                    deactivated.append(result)

        return deactivated

    def delete_by_plaid_item_id(self, plaid_item_id: UUID) -> int:
        result = (
            self._get_table()
            .delete()
            .eq("plaid_item_id", str(plaid_item_id))
            .execute()
        )
        return len(result.data) if result.data else 0


class RecurringStreamRepositoryContainer:
    _instance: RecurringStreamRepository | None = None

    @classmethod
    def get(cls) -> RecurringStreamRepository:
        if cls._instance is None:
            database_service = get_database_service()
            cls._instance = RecurringStreamRepository(database_service)
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_recurring_stream_repository() -> RecurringStreamRepository:
    return RecurringStreamRepositoryContainer.get()
