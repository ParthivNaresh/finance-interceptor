from __future__ import annotations

from typing import Any
from uuid import UUID

from models.analytics import (
    LifestyleBaselineCreate,
    LifestyleBaselineResponse,
    LifestyleBaselineUpdate,
)
from repositories.base import BaseRepository
from services.database import DatabaseService, get_database_service


class LifestyleBaselineRepository(
    BaseRepository[LifestyleBaselineResponse, LifestyleBaselineCreate]
):
    def __init__(self, database_service: DatabaseService) -> None:
        super().__init__(database_service, "lifestyle_baselines")

    def get_by_user_id(
        self,
        user_id: UUID,
        locked_only: bool = False,
    ) -> list[dict[str, Any]]:
        query = self._get_table().select("*").eq("user_id", str(user_id))

        if locked_only:
            query = query.eq("is_locked", True)

        result = query.order("category_primary").execute()
        return [dict(item) for item in result.data] if result.data else []

    def get_by_category(
        self,
        user_id: UUID,
        category_primary: str,
    ) -> dict[str, Any] | None:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .eq("category_primary", category_primary)
            .execute()
        )
        if not result.data:
            return None
        return dict(result.data[0])

    def get_discretionary_baselines(
        self,
        user_id: UUID,
        categories: list[str],
    ) -> list[dict[str, Any]]:
        if not categories:
            return []

        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .in_("category_primary", categories)
            .order("baseline_monthly_amount", desc=True)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def has_baselines(self, user_id: UUID) -> bool:
        result = self._get_table().select("id", count="exact").eq("user_id", str(user_id)).execute()
        return (result.count or 0) > 0

    def count_for_user(self, user_id: UUID) -> int:
        result = self._get_table().select("id", count="exact").eq("user_id", str(user_id)).execute()
        return result.count or 0

    def update(
        self,
        record_id: UUID,
        data: LifestyleBaselineUpdate,
    ) -> dict[str, Any] | None:
        update_data = data.model_dump(mode="json", exclude_none=True)
        if not update_data:
            return self.get_by_id(record_id)

        result = self._get_table().update(update_data).eq("id", str(record_id)).execute()
        if not result.data:
            return None
        return dict(result.data[0])

    def upsert(self, data: LifestyleBaselineCreate) -> dict[str, Any]:
        dump = data.model_dump(mode="json")
        result = self._get_table().upsert(dump, on_conflict="user_id,category_primary").execute()
        if not result.data:
            raise ValueError("Failed to upsert lifestyle baseline")
        return dict(result.data[0])

    def upsert_many(self, records: list[LifestyleBaselineCreate]) -> list[dict[str, Any]]:
        if not records:
            return []

        data = [r.model_dump(mode="json") for r in records]
        result = self._get_table().upsert(data, on_conflict="user_id,category_primary").execute()
        return [dict(item) for item in result.data] if result.data else []

    def lock_baselines(self, user_id: UUID) -> int:
        result = (
            self._get_table()
            .update({"is_locked": True})
            .eq("user_id", str(user_id))
            .eq("is_locked", False)
            .execute()
        )
        return len(result.data) if result.data else 0

    def unlock_baselines(self, user_id: UUID) -> int:
        result = (
            self._get_table()
            .update({"is_locked": False})
            .eq("user_id", str(user_id))
            .eq("is_locked", True)
            .execute()
        )
        return len(result.data) if result.data else 0

    def delete_for_user(self, user_id: UUID) -> int:
        result = self._get_table().delete().eq("user_id", str(user_id)).execute()
        return len(result.data) if result.data else 0

    def delete_unlocked_for_user(self, user_id: UUID) -> int:
        result = (
            self._get_table().delete().eq("user_id", str(user_id)).eq("is_locked", False).execute()
        )
        return len(result.data) if result.data else 0


class LifestyleBaselineRepositoryContainer:
    _instance: LifestyleBaselineRepository | None = None

    @classmethod
    def get(cls) -> LifestyleBaselineRepository:
        if cls._instance is None:
            cls._instance = LifestyleBaselineRepository(get_database_service())
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_lifestyle_baseline_repository() -> LifestyleBaselineRepository:
    return LifestyleBaselineRepositoryContainer.get()
