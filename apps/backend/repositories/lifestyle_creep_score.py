from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Any
from uuid import UUID

from models.analytics import LifestyleCreepScoreCreate, LifestyleCreepScoreResponse
from repositories.base import BaseRepository
from services.database import DatabaseService, get_database_service


class LifestyleCreepScoreRepository(
    BaseRepository[LifestyleCreepScoreResponse, LifestyleCreepScoreCreate]
):
    def __init__(self, database_service: DatabaseService) -> None:
        super().__init__(database_service, "lifestyle_creep_scores")

    def get_by_user_and_period(
        self,
        user_id: UUID,
        period_start: date,
    ) -> list[dict[str, Any]]:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .eq("period_start", period_start.isoformat())
            .order("percentage_change", desc=True)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def get_by_user_period_category(
        self,
        user_id: UUID,
        period_start: date,
        category_primary: str,
    ) -> dict[str, Any] | None:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .eq("period_start", period_start.isoformat())
            .eq("category_primary", category_primary)
            .execute()
        )
        if not result.data:
            return None
        return dict(result.data[0])

    def get_periods_for_user(
        self,
        user_id: UUID,
        limit: int = 12,
    ) -> list[date]:
        result = (
            self._get_table()
            .select("period_start")
            .eq("user_id", str(user_id))
            .order("period_start", desc=True)
            .execute()
        )

        if not result.data:
            return []

        seen: set[str] = set()
        periods: list[date] = []
        for item in result.data:
            period_str = item["period_start"]
            if period_str not in seen:
                seen.add(period_str)
                periods.append(date.fromisoformat(period_str))
                if len(periods) >= limit:
                    break

        return periods

    def get_category_history(
        self,
        user_id: UUID,
        category_primary: str,
        limit: int = 12,
    ) -> list[dict[str, Any]]:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .eq("category_primary", category_primary)
            .order("period_start", desc=True)
            .limit(limit)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def get_recent_scores_by_category(
        self,
        user_id: UUID,
        lookback_periods: int = 4,
    ) -> dict[str, list[dict[str, Any]]]:
        """Fetch last N periods of scores for ALL categories in a single query.

        Returns {category_primary: [scores newest-first]}.
        """
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .order("period_start", desc=True)
            .limit(lookback_periods * 10)
            .execute()
        )

        if not result.data:
            return {}

        by_category: dict[str, list[dict[str, Any]]] = {}
        for item in result.data:
            cat = item["category_primary"]
            if cat not in by_category:
                by_category[cat] = []
            if len(by_category[cat]) < lookback_periods:
                by_category[cat].append(dict(item))

        return by_category

    def get_top_creeping_categories(
        self,
        user_id: UUID,
        period_start: date,
        limit: int = 5,
    ) -> list[dict[str, Any]]:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .eq("period_start", period_start.isoformat())
            .gt("percentage_change", 0)
            .order("percentage_change", desc=True)
            .limit(limit)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def get_improving_categories(
        self,
        user_id: UUID,
        period_start: date,
        limit: int = 5,
    ) -> list[dict[str, Any]]:
        result = (
            self._get_table()
            .select("*")
            .eq("user_id", str(user_id))
            .eq("period_start", period_start.isoformat())
            .lt("percentage_change", 0)
            .order("percentage_change")
            .limit(limit)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def get_average_creep_for_period(
        self,
        user_id: UUID,
        period_start: date,
    ) -> Decimal | None:
        scores = self.get_by_user_and_period(user_id, period_start)
        if not scores:
            return None

        total = sum(
            (Decimal(str(s["percentage_change"])) for s in scores),
            Decimal("0"),
        )
        return total / Decimal(len(scores))

    def upsert(self, data: LifestyleCreepScoreCreate) -> dict[str, Any]:
        dump = data.model_dump(mode="json")
        result = (
            self._get_table()
            .upsert(dump, on_conflict="user_id,period_start,category_primary")
            .execute()
        )
        if not result.data:
            raise ValueError("Failed to upsert lifestyle creep score")
        return dict(result.data[0])

    def upsert_many(self, records: list[LifestyleCreepScoreCreate]) -> list[dict[str, Any]]:
        if not records:
            return []

        data = [r.model_dump(mode="json") for r in records]
        result = (
            self._get_table()
            .upsert(data, on_conflict="user_id,period_start,category_primary")
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def delete_for_period(
        self,
        user_id: UUID,
        period_start: date,
    ) -> int:
        result = (
            self._get_table()
            .delete()
            .eq("user_id", str(user_id))
            .eq("period_start", period_start.isoformat())
            .execute()
        )
        return len(result.data) if result.data else 0

    def delete_for_user(self, user_id: UUID) -> int:
        result = self._get_table().delete().eq("user_id", str(user_id)).execute()
        return len(result.data) if result.data else 0

    def count_for_user(self, user_id: UUID) -> int:
        result = self._get_table().select("id", count="exact").eq("user_id", str(user_id)).execute()
        return result.count or 0


class LifestyleCreepScoreRepositoryContainer:
    _instance: LifestyleCreepScoreRepository | None = None

    @classmethod
    def get(cls) -> LifestyleCreepScoreRepository:
        if cls._instance is None:
            cls._instance = LifestyleCreepScoreRepository(get_database_service())
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_lifestyle_creep_score_repository() -> LifestyleCreepScoreRepository:
    return LifestyleCreepScoreRepositoryContainer.get()
