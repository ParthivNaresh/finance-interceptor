from __future__ import annotations

from typing import ClassVar
from uuid import UUID

from models.plaid import AccountsListResponse
from observability import get_logger
from services.cache.base import CacheService, get_cache_service

logger = get_logger("services.cache.accounts")


class AccountCache:
    _DOMAIN: ClassVar[str] = "accounts"

    def __init__(self, cache_service: CacheService, ttl_seconds: int = 600) -> None:
        self._cache = cache_service
        self._ttl = ttl_seconds

    def _key(self, user_id: UUID, *parts: str) -> str:
        return self._cache._build_key(self._DOMAIN, str(user_id), *parts)

    def get_accounts_list(self, user_id: UUID) -> AccountsListResponse | None:
        raw = self._cache.get(self._key(user_id, "list"))
        if raw is None:
            return None
        try:
            return AccountsListResponse.model_validate_json(raw)
        except Exception:
            return None

    def set_accounts_list(self, user_id: UUID, response: AccountsListResponse) -> bool:
        key = self._key(user_id, "list")
        return self._cache.set(key, response.model_dump_json().encode(), self._ttl)

    def invalidate_for_user(self, user_id: UUID) -> int:
        pattern = self._cache._build_key(self._DOMAIN, str(user_id), "*")
        return self._cache.delete_pattern(pattern)


class AccountCacheContainer:
    _instance: AccountCache | None = None

    @classmethod
    def get(cls) -> AccountCache:
        if cls._instance is None:
            from config import get_settings

            settings = get_settings()
            cache_service = get_cache_service()
            cls._instance = AccountCache(
                cache_service, ttl_seconds=settings.cache_accounts_ttl_seconds
            )
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_account_cache() -> AccountCache:
    return AccountCacheContainer.get()
