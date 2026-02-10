from __future__ import annotations

from datetime import UTC, datetime
from datetime import date as date_type
from typing import Any
from uuid import UUID

from models.analytics import (
    AnalyticsComputationLogCreate,
    AnalyticsComputationLogResponse,
    AnalyticsComputationLogUpdate,
)
from models.enums import ComputationStatus
from repositories.base import BaseRepository
from services.database import DatabaseService, get_database_service


class AnalyticsComputationLogRepository(
    BaseRepository[AnalyticsComputationLogResponse, AnalyticsComputationLogCreate]
):
    def __init__(self, database_service: DatabaseService) -> None:
        super().__init__(database_service, "analytics_computation_log")

    def get_last_computation(
        self,
        user_id: UUID,
        computation_type: str,
    ) -> dict[str, Any] | None:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .eq("computation_type", computation_type)
            .execute()
        )
        if not result.data:
            return None
        return dict(result.data[0])

    def get_all_for_user(self, user_id: UUID) -> list[dict[str, Any]]:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .order("last_computed_at", desc=True)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def get_failed_computations(self, user_id: UUID) -> list[dict[str, Any]]:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .eq("status", ComputationStatus.FAILED.value)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def get_in_progress_computations(self, user_id: UUID) -> list[dict[str, Any]]:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .eq("status", ComputationStatus.IN_PROGRESS.value)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def update(
        self,
        record_id: UUID,
        data: AnalyticsComputationLogUpdate,
    ) -> dict[str, Any] | None:
        update_data = data.model_dump(mode="json", exclude_none=True)
        if not update_data:
            return self.get_by_id(record_id)

        result = self._get_table().update(update_data).eq("id", str(record_id)).execute()
        if not result.data:
            return None
        return dict(result.data[0])

    def upsert(
        self,
        user_id: UUID,
        computation_type: str,
        status: ComputationStatus,
        last_transaction_date: date_type | None = None,
        last_transaction_id: UUID | None = None,
        computation_duration_ms: int | None = None,
        rows_affected: int | None = None,
        error_message: str | None = None,
    ) -> dict[str, Any]:
        data = {
            "user_id": str(user_id),
            "computation_type": computation_type,
            "status": status.value,
            "last_computed_at": datetime.now(UTC).isoformat(),
        }

        if last_transaction_date is not None:
            data["last_transaction_date"] = last_transaction_date.isoformat()
        if last_transaction_id is not None:
            data["last_transaction_id"] = str(last_transaction_id)
        if computation_duration_ms is not None:
            data["computation_duration_ms"] = computation_duration_ms
        if rows_affected is not None:
            data["rows_affected"] = rows_affected
        if error_message is not None:
            data["error_message"] = error_message

        result = self._get_table().upsert(data, on_conflict="user_id,computation_type").execute()
        if not result.data:
            raise ValueError("Failed to upsert analytics computation log")
        return dict(result.data[0])

    def mark_in_progress(
        self,
        user_id: UUID,
        computation_type: str,
    ) -> dict[str, Any]:
        return self.upsert(
            user_id=user_id,
            computation_type=computation_type,
            status=ComputationStatus.IN_PROGRESS,
        )

    def mark_complete(
        self,
        user_id: UUID,
        computation_type: str,
        rows_affected: int,
        duration_ms: int,
        last_transaction_date: date_type | None = None,
        last_transaction_id: UUID | None = None,
    ) -> dict[str, Any]:
        return self.upsert(
            user_id=user_id,
            computation_type=computation_type,
            status=ComputationStatus.SUCCESS,
            last_transaction_date=last_transaction_date,
            last_transaction_id=last_transaction_id,
            computation_duration_ms=duration_ms,
            rows_affected=rows_affected,
            error_message=None,
        )

    def mark_failed(
        self,
        user_id: UUID,
        computation_type: str,
        error_message: str,
        duration_ms: int | None = None,
    ) -> dict[str, Any]:
        return self.upsert(
            user_id=user_id,
            computation_type=computation_type,
            status=ComputationStatus.FAILED,
            computation_duration_ms=duration_ms,
            error_message=error_message,
        )

    def delete_for_user(self, user_id: UUID) -> int:
        result = self._get_table().delete().eq("user_id", str(user_id)).execute()
        return len(result.data) if result.data else 0


class AnalyticsComputationLogRepositoryContainer:
    _instance: AnalyticsComputationLogRepository | None = None

    @classmethod
    def get(cls) -> AnalyticsComputationLogRepository:
        if cls._instance is None:
            database_service = get_database_service()
            cls._instance = AnalyticsComputationLogRepository(database_service)
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_analytics_computation_log_repository() -> AnalyticsComputationLogRepository:
    return AnalyticsComputationLogRepositoryContainer.get()
