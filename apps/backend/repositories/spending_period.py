from __future__ import annotations

from datetime import date as date_type
from decimal import Decimal
from typing import Any
from uuid import UUID

from models.analytics import SpendingPeriodCreate, SpendingPeriodResponse, SpendingPeriodUpdate
from models.enums import PeriodType
from repositories.base import BaseRepository
from services.database import DatabaseService, get_database_service


class SpendingPeriodRepository(BaseRepository[SpendingPeriodResponse, SpendingPeriodCreate]):
    def __init__(self, database_service: DatabaseService) -> None:
        super().__init__(database_service, "spending_periods")

    def get_by_user_and_period(
        self,
        user_id: UUID,
        period_type: PeriodType,
        period_start: date_type,
    ) -> dict[str, Any] | None:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .eq("period_type", period_type.value)
            .eq("period_start", period_start.isoformat())
            .execute()
        )
        if not result.data:
            return None
        return dict(result.data[0])

    def get_periods_for_user(
        self,
        user_id: UUID,
        period_type: PeriodType,
        limit: int = 12,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .eq("period_type", period_type.value)
            .order("period_start", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def get_periods_in_range(
        self,
        user_id: UUID,
        period_type: PeriodType,
        start_date: date_type,
        end_date: date_type,
    ) -> list[dict[str, Any]]:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .eq("period_type", period_type.value)
            .gte("period_start", start_date.isoformat())
            .lte("period_start", end_date.isoformat())
            .order("period_start", desc=True)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def get_rolling_average(
        self,
        user_id: UUID,
        period_type: PeriodType,
        months: int,
    ) -> Decimal | None:
        periods = self.get_periods_for_user(user_id, period_type, limit=months)
        if not periods:
            return None

        total = sum(
            (Decimal(str(p["total_outflow_excluding_transfers"])) for p in periods),
            Decimal("0"),
        )
        return total / Decimal(len(periods))

    def get_unfinalized_periods(
        self,
        user_id: UUID,
        period_type: PeriodType,
    ) -> list[dict[str, Any]]:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .eq("period_type", period_type.value)
            .eq("is_finalized", False)
            .order("period_start", desc=True)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def update(
        self,
        record_id: UUID,
        data: SpendingPeriodUpdate,
    ) -> dict[str, Any] | None:
        update_data = data.model_dump(mode="json", exclude_none=True)
        if not update_data:
            return self.get_by_id(record_id)

        result = self._get_table().update(update_data).eq("id", str(record_id)).execute()
        if not result.data:
            return None
        return dict(result.data[0])

    def upsert(self, data: SpendingPeriodCreate) -> dict[str, Any]:
        dump = data.model_dump(mode="json")
        result = (
            self._get_table().upsert(dump, on_conflict="user_id,period_type,period_start").execute()
        )
        if not result.data:
            raise ValueError("Failed to upsert spending period")
        return dict(result.data[0])

    def upsert_many(self, records: list[SpendingPeriodCreate]) -> list[dict[str, Any]]:
        if not records:
            return []

        data = [r.model_dump(mode="json") for r in records]
        result = (
            self._get_table().upsert(data, on_conflict="user_id,period_type,period_start").execute()
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

    def mark_finalized(
        self,
        user_id: UUID,
        period_type: PeriodType,
        period_start: date_type,
    ) -> bool:
        result = (
            self._get_table()
            .update({"is_finalized": True})
            .eq("user_id", str(user_id))
            .eq("period_type", period_type.value)
            .eq("period_start", period_start.isoformat())
            .execute()
        )
        return bool(result.data)

    def mark_finalized_before(
        self,
        user_id: UUID,
        period_type: PeriodType,
        before_date: date_type,
    ) -> int:
        result = (
            self._get_table()
            .update({"is_finalized": True})
            .eq("user_id", str(user_id))
            .eq("period_type", period_type.value)
            .lt("period_start", before_date.isoformat())
            .eq("is_finalized", False)
            .execute()
        )
        return len(result.data) if result.data else 0


class SpendingPeriodRepositoryContainer:
    _instance: SpendingPeriodRepository | None = None

    @classmethod
    def get(cls) -> SpendingPeriodRepository:
        if cls._instance is None:
            database_service = get_database_service()
            cls._instance = SpendingPeriodRepository(database_service)
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_spending_period_repository() -> SpendingPeriodRepository:
    return SpendingPeriodRepositoryContainer.get()
