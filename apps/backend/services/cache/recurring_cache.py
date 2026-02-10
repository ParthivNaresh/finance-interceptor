from __future__ import annotations

from typing import ClassVar
from uuid import UUID

from models.recurring import RecurringStreamListResponse, UpcomingBillsListResponse
from observability import get_logger
from services.cache.base import CacheService, get_cache_service

logger = get_logger("services.cache.recurring")


class RecurringCache:
    _DOMAIN: ClassVar[str] = "recurring"

    def __init__(self, cache_service: CacheService, ttl_seconds: int = 600) -> None:
        self._cache = cache_service
        self._ttl = ttl_seconds

    def _key(self, user_id: UUID, *parts: str) -> str:
        return self._cache._build_key(self._DOMAIN, str(user_id), *parts)

    def get_recurring_list(
        self, user_id: UUID, active_only: bool
    ) -> RecurringStreamListResponse | None:
        raw = self._cache.get(self._key(user_id, "list", str(active_only).lower()))
        if raw is None:
            return None
        try:
            return RecurringStreamListResponse.model_validate_json(raw)
        except Exception:
            return None

    def set_recurring_list(
        self, user_id: UUID, active_only: bool, response: RecurringStreamListResponse
    ) -> bool:
        key = self._key(user_id, "list", str(active_only).lower())
        return self._cache.set(key, response.model_dump_json().encode(), self._ttl)

    def get_upcoming_bills(
        self, user_id: UUID, days: int
    ) -> UpcomingBillsListResponse | None:
        raw = self._cache.get(self._key(user_id, "upcoming", str(days)))
        if raw is None:
            return None
        try:
            return UpcomingBillsListResponse.model_validate_json(raw)
        except Exception:
            return None

    def set_upcoming_bills(
        self, user_id: UUID, days: int, response: UpcomingBillsListResponse
    ) -> bool:
        key = self._key(user_id, "upcoming", str(days))
        return self._cache.set(key, response.model_dump_json().encode(), self._ttl)

    def invalidate_for_user(self, user_id: UUID) -> int:
        pattern = self._cache._build_key(self._DOMAIN, str(user_id), "*")
        return self._cache.delete_pattern(pattern)


class RecurringCacheContainer:
    _instance: RecurringCache | None = None

    @classmethod
    def get(cls) -> RecurringCache:
        if cls._instance is None:
            from config import get_settings

            settings = get_settings()
            cache_service = get_cache_service()
            cls._instance = RecurringCache(
                cache_service, ttl_seconds=settings.cache_recurring_ttl_seconds
            )
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_recurring_cache() -> RecurringCache:
    return RecurringCacheContainer.get()
