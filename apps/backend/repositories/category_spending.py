from __future__ import annotations

from datetime import date as date_type
from typing import Any
from uuid import UUID

from models.analytics import (
    CategorySpendingCreate,
    CategorySpendingResponse,
    CategorySpendingUpdate,
)
from models.enums import PeriodType
from repositories.base import BaseRepository
from services.database import DatabaseService, get_database_service


class CategorySpendingRepository(BaseRepository[CategorySpendingResponse, CategorySpendingCreate]):
    def __init__(self, database_service: DatabaseService) -> None:
        super().__init__(database_service, "category_spending")

    def get_by_user_and_period(
        self,
        user_id: UUID,
        period_type: PeriodType,
        period_start: date_type,
    ) -> list[dict[str, Any]]:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .eq("period_type", period_type.value)
            .eq("period_start", period_start.isoformat())
            .order("total_amount", desc=True)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def get_by_user_period_category(
        self,
        user_id: UUID,
        period_type: PeriodType,
        period_start: date_type,
        category_primary: str,
    ) -> dict[str, Any] | None:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .eq("period_type", period_type.value)
            .eq("period_start", period_start.isoformat())
            .eq("category_primary", category_primary)
            .execute()
        )
        if not result.data:
            return None
        return dict(result.data[0])

    def get_category_history(
        self,
        user_id: UUID,
        category_primary: str,
        period_type: PeriodType = PeriodType.MONTHLY,
        months: int = 12,
    ) -> list[dict[str, Any]]:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .eq("period_type", period_type.value)
            .eq("category_primary", category_primary)
            .order("period_start", desc=True)
            .limit(months)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def get_top_categories(
        self,
        user_id: UUID,
        period_type: PeriodType,
        period_start: date_type,
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .eq("period_type", period_type.value)
            .eq("period_start", period_start.isoformat())
            .order("total_amount", desc=True)
            .limit(limit)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def get_all_categories_for_user(
        self,
        user_id: UUID,
        period_type: PeriodType = PeriodType.MONTHLY,
    ) -> list[str]:
        result = (
            self._get_table()
            .select("category_primary")
            .eq("user_id", str(user_id))
            .eq("period_type", period_type.value)
            .execute()
        )
        if not result.data:
            return []

        categories = {item["category_primary"] for item in result.data}
        return sorted(categories)

    def update(
        self,
        record_id: UUID,
        data: CategorySpendingUpdate,
    ) -> dict[str, Any] | None:
        update_data = data.model_dump(mode="json", exclude_none=True)
        if not update_data:
            return self.get_by_id(record_id)

        result = self._get_table().update(update_data).eq("id", str(record_id)).execute()
        if not result.data:
            return None
        return dict(result.data[0])

    def upsert(self, data: CategorySpendingCreate) -> dict[str, Any]:
        dump = data.model_dump(mode="json")
        result = (
            self._get_table()
            .upsert(dump, on_conflict="user_id,period_type,period_start,category_primary")
            .execute()
        )
        if not result.data:
            raise ValueError("Failed to upsert category spending")
        return dict(result.data[0])

    def upsert_many(self, records: list[CategorySpendingCreate]) -> list[dict[str, Any]]:
        if not records:
            return []

        data = [r.model_dump(mode="json") for r in records]
        result = (
            self._get_table()
            .upsert(data, on_conflict="user_id,period_type,period_start,category_primary")
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def delete_for_period(
        self,
        user_id: UUID,
        period_type: PeriodType,
        period_start: date_type,
    ) -> int:
        result = (
            self._get_table()
            .delete()
            .eq("user_id", str(user_id))
            .eq("period_type", period_type.value)
            .eq("period_start", period_start.isoformat())
            .execute()
        )
        return len(result.data) if result.data else 0

    def delete_for_user(self, user_id: UUID) -> int:
        result = self._get_table().delete().eq("user_id", str(user_id)).execute()
        return len(result.data) if result.data else 0


class CategorySpendingRepositoryContainer:
    _instance: CategorySpendingRepository | None = None

    @classmethod
    def get(cls) -> CategorySpendingRepository:
        if cls._instance is None:
            database_service = get_database_service()
            cls._instance = CategorySpendingRepository(database_service)
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_category_spending_repository() -> CategorySpendingRepository:
    return CategorySpendingRepositoryContainer.get()
