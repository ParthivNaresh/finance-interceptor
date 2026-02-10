from __future__ import annotations

from typing import TYPE_CHECKING, Any
from uuid import UUID

from repositories.base import BaseRepository
from services.database import DatabaseService, get_database_service

if TYPE_CHECKING:
    from services.analytics.income_detector import DetectedIncomeSource


class IncomeSourceRepository(BaseRepository):
    def __init__(self, database_service: DatabaseService) -> None:
        super().__init__(database_service, "income_sources")

    def get_by_user_id(
        self,
        user_id: UUID,
        active_only: bool = True,
    ) -> list[dict[str, Any]]:
        query = self._get_table().select("*").eq("user_id", str(user_id))

        if active_only:
            query = query.eq("is_active", True)

        result = query.order("average_amount", desc=True).execute()
        return [dict(item) for item in result.data] if result.data else []

    def get_by_source_name(
        self,
        user_id: UUID,
        source_name: str,
    ) -> dict[str, Any] | None:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .eq("source_name", source_name)
            .execute()
        )
        if not result.data:
            return None
        return dict(result.data[0])

    def get_high_confidence(
        self,
        user_id: UUID,
        min_confidence: float = 0.80,
    ) -> list[dict[str, Any]]:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .eq("is_active", True)
            .gte("confidence_score", min_confidence)
            .order("average_amount", desc=True)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def upsert_from_detection(
        self,
        user_id: UUID,
        source: DetectedIncomeSource,
    ) -> dict[str, Any]:
        data = {
            "user_id": str(user_id),
            "source_name": source.source_name,
            "source_type": source.source_type.value,
            "frequency": source.frequency.value,
            "average_amount": str(source.average_amount),
            "last_amount": str(source.last_amount),
            "first_date": source.first_date.isoformat(),
            "last_date": source.last_date.isoformat(),
            "next_expected_date": (
                source.next_expected_date.isoformat() if source.next_expected_date else None
            ),
            "transaction_count": source.transaction_count,
            "confidence_score": str(source.confidence_score),
            "is_active": True,
            "account_id": str(source.account_id) if source.account_id else None,
        }

        result = self._get_table().upsert(data, on_conflict="user_id,source_name").execute()
        if not result.data:
            raise ValueError("Failed to upsert income source")
        return dict(result.data[0])

    def mark_inactive(
        self,
        user_id: UUID,
        source_name: str,
    ) -> bool:
        result = (
            self._get_table()
            .update({"is_active": False})
            .eq("user_id", str(user_id))
            .eq("source_name", source_name)
            .execute()
        )
        return bool(result.data)

    def delete_for_user(self, user_id: UUID) -> int:
        result = self._get_table().delete().eq("user_id", str(user_id)).execute()
        return len(result.data) if result.data else 0

    def count_for_user(
        self,
        user_id: UUID,
        active_only: bool = True,
    ) -> int:
        query = self._get_table().select("id", count="exact").eq("user_id", str(user_id))

        if active_only:
            query = query.eq("is_active", True)

        result = query.execute()
        return result.count or 0


class IncomeSourceRepositoryContainer:
    _instance: IncomeSourceRepository | None = None

    @classmethod
    def get(cls) -> IncomeSourceRepository:
        if cls._instance is None:
            cls._instance = IncomeSourceRepository(get_database_service())
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_income_source_repository() -> IncomeSourceRepository:
    return IncomeSourceRepositoryContainer.get()
