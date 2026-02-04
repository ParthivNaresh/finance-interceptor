from datetime import datetime
from typing import Any
from uuid import UUID

from models.enums import AlertStatus, AlertType, UserActionType
from models.recurring import AlertCreate, AlertResponse, AlertUpdate
from repositories.base import BaseRepository
from services.database import DatabaseService, get_database_service


class AlertRepository(BaseRepository[AlertResponse, AlertCreate]):
    def __init__(self, database_service: DatabaseService) -> None:
        super().__init__(database_service, "alerts")

    def get_by_user_id(
        self,
        user_id: UUID,
        limit: int = 50,
        offset: int = 0
    ) -> list[dict[str, Any]]:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def get_unread_by_user_id(self, user_id: UUID) -> list[dict[str, Any]]:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .eq("status", AlertStatus.UNREAD.value)
            .order("created_at", desc=True)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def get_by_type(
        self,
        user_id: UUID,
        alert_type: AlertType,
        limit: int = 50
    ) -> list[dict[str, Any]]:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .eq("alert_type", alert_type.value)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def get_by_recurring_stream_id(
        self,
        recurring_stream_id: UUID
    ) -> list[dict[str, Any]]:
        result = (
            self._get_table()
            .select("*")
            .eq("recurring_stream_id", str(recurring_stream_id))
            .order("created_at", desc=True)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def count_unread(self, user_id: UUID) -> int:
        result = (
            self._get_table()
            .select("id", count="exact")
            .eq("user_id", str(user_id))
            .eq("status", AlertStatus.UNREAD.value)
            .execute()
        )
        return result.count if result.count else 0

    def count_by_user_id(self, user_id: UUID) -> int:
        result = (
            self._get_table()
            .select("id", count="exact")
            .eq("user_id", str(user_id))
            .execute()
        )
        return result.count if result.count else 0

    def update(self, alert_id: UUID, data: AlertUpdate) -> dict[str, Any] | None:
        update_data = data.model_dump(mode="json", exclude_none=True)
        if not update_data:
            return self.get_by_id(alert_id)

        result = (
            self._get_table()
            .update(update_data)
            .eq("id", str(alert_id))
            .execute()
        )
        if not result.data:
            return None
        return dict(result.data[0])

    def mark_as_read(self, alert_id: UUID) -> dict[str, Any] | None:
        update_data = AlertUpdate(
            status=AlertStatus.READ,
            read_at=datetime.now()
        )
        return self.update(alert_id, update_data)

    def dismiss(self, alert_id: UUID) -> dict[str, Any] | None:
        update_data = AlertUpdate(
            status=AlertStatus.DISMISSED,
            dismissed_at=datetime.now()
        )
        return self.update(alert_id, update_data)

    def acknowledge(
        self,
        alert_id: UUID,
        user_action: UserActionType | None = None
    ) -> dict[str, Any] | None:
        update_data = AlertUpdate(
            status=AlertStatus.ACTIONED,
            user_action=user_action,
            actioned_at=datetime.now()
        )
        return self.update(alert_id, update_data)

    def mark_all_as_read(self, user_id: UUID) -> int:
        result = (
            self._get_table()
            .update({
                "status": AlertStatus.READ.value,
                "read_at": datetime.now().isoformat()
            })
            .eq("user_id", str(user_id))
            .eq("status", AlertStatus.UNREAD.value)
            .execute()
        )
        return len(result.data) if result.data else 0

    def delete_by_recurring_stream_id(self, recurring_stream_id: UUID) -> int:
        result = (
            self._get_table()
            .delete()
            .eq("recurring_stream_id", str(recurring_stream_id))
            .execute()
        )
        return len(result.data) if result.data else 0

    def exists_for_stream_and_type(
        self,
        recurring_stream_id: UUID,
        alert_type: AlertType,
        since_hours: int = 24
    ) -> bool:
        from datetime import timedelta
        cutoff = datetime.now() - timedelta(hours=since_hours)

        result = (
            self._get_table()
            .select("id")
            .eq("recurring_stream_id", str(recurring_stream_id))
            .eq("alert_type", alert_type.value)
            .gte("created_at", cutoff.isoformat())
            .limit(1)
            .execute()
        )
        return bool(result.data)


class AlertRepositoryContainer:
    _instance: AlertRepository | None = None

    @classmethod
    def get(cls) -> AlertRepository:
        if cls._instance is None:
            database_service = get_database_service()
            cls._instance = AlertRepository(database_service)
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_alert_repository() -> AlertRepository:
    return AlertRepositoryContainer.get()
