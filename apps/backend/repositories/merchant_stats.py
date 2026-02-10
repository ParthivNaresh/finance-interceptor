from __future__ import annotations

from typing import Any, Literal
from uuid import UUID

from models.analytics import MerchantStatsCreate, MerchantStatsResponse, MerchantStatsUpdate
from repositories.base import BaseRepository
from services.database import DatabaseService, get_database_service

SortField = Literal["total_lifetime_spend", "total_transaction_count", "last_transaction_date"]


class MerchantStatsRepository(BaseRepository[MerchantStatsResponse, MerchantStatsCreate]):
    def __init__(self, database_service: DatabaseService) -> None:
        super().__init__(database_service, "merchant_stats")

    def get_by_merchant_name(
        self,
        user_id: UUID,
        merchant_name: str,
    ) -> dict[str, Any] | None:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .eq("merchant_name", merchant_name)
            .execute()
        )
        if not result.data:
            return None
        return dict(result.data[0])

    def get_all_for_user(
        self,
        user_id: UUID,
        limit: int = 100,
        offset: int = 0,
        sort_by: SortField = "total_lifetime_spend",
        descending: bool = True,
    ) -> list[dict[str, Any]]:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .order(sort_by, desc=descending)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def get_top_by_spend(
        self,
        user_id: UUID,
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .order("total_lifetime_spend", desc=True)
            .limit(limit)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def get_top_by_frequency(
        self,
        user_id: UUID,
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .order("total_transaction_count", desc=True)
            .limit(limit)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def get_recurring_merchants(
        self,
        user_id: UUID,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .eq("is_recurring", True)
            .order("total_lifetime_spend", desc=True)
            .limit(limit)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def count_for_user(self, user_id: UUID) -> int:
        result = self._get_table().select("id", count="exact").eq("user_id", str(user_id)).execute()
        return result.count if result.count is not None else 0

    def update(
        self,
        record_id: UUID,
        data: MerchantStatsUpdate,
    ) -> dict[str, Any] | None:
        update_data = data.model_dump(mode="json", exclude_none=True)
        if not update_data:
            return self.get_by_id(record_id)

        result = self._get_table().update(update_data).eq("id", str(record_id)).execute()
        if not result.data:
            return None
        return dict(result.data[0])

    def upsert(self, data: MerchantStatsCreate) -> dict[str, Any]:
        dump = data.model_dump(mode="json")
        result = self._get_table().upsert(dump, on_conflict="user_id,merchant_name").execute()
        if not result.data:
            raise ValueError("Failed to upsert merchant stats")
        return dict(result.data[0])

    def upsert_many(self, records: list[MerchantStatsCreate]) -> list[dict[str, Any]]:
        if not records:
            return []

        data = [r.model_dump(mode="json") for r in records]
        result = self._get_table().upsert(data, on_conflict="user_id,merchant_name").execute()
        return [dict(item) for item in result.data] if result.data else []

    def delete_for_user(self, user_id: UUID) -> int:
        result = self._get_table().delete().eq("user_id", str(user_id)).execute()
        return len(result.data) if result.data else 0

    def delete_by_merchant_name(
        self,
        user_id: UUID,
        merchant_name: str,
    ) -> bool:
        result = (
            self._get_table()
            .delete()
            .eq("user_id", str(user_id))
            .eq("merchant_name", merchant_name)
            .execute()
        )
        return len(result.data) > 0 if result.data else False


class MerchantStatsRepositoryContainer:
    _instance: MerchantStatsRepository | None = None

    @classmethod
    def get(cls) -> MerchantStatsRepository:
        if cls._instance is None:
            database_service = get_database_service()
            cls._instance = MerchantStatsRepository(database_service)
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_merchant_stats_repository() -> MerchantStatsRepository:
    return MerchantStatsRepositoryContainer.get()
