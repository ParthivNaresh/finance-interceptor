from __future__ import annotations

import hashlib
from typing import ClassVar

from models.auth import AuthenticatedUser
from observability import get_logger
from services.cache.base import CacheService, get_cache_service

logger = get_logger("services.cache.auth")


class AuthCache:
    _DOMAIN: ClassVar[str] = "auth"

    def __init__(self, cache_service: CacheService, ttl_seconds: int = 300) -> None:
        self._cache = cache_service
        self._ttl = ttl_seconds

    def _token_key(self, token: str) -> str:
        token_hash = hashlib.sha256(token.encode()).hexdigest()[:32]
        return self._cache._build_key(self._DOMAIN, token_hash)

    def get(self, token: str) -> AuthenticatedUser | None:
        key = self._token_key(token)
        raw = self._cache.get(key)
        if raw is None:
            return None

        try:
            return AuthenticatedUser.model_validate_json(raw)
        except Exception as e:
            logger.warning("auth_cache.deserialize_failed", error=str(e))
            self._cache.delete(key)
            return None

    def set(self, token: str, user: AuthenticatedUser) -> bool:
        key = self._token_key(token)
        data = user.model_dump_json().encode("utf-8")
        return self._cache.set(key, data, self._ttl)

    def invalidate_token(self, token: str) -> bool:
        key = self._token_key(token)
        return self._cache.delete(key)


class AuthCacheContainer:
    _instance: AuthCache | None = None

    @classmethod
    def get(cls) -> AuthCache:
        if cls._instance is None:
            from config import get_settings

            settings = get_settings()
            cache_service = get_cache_service()
            cls._instance = AuthCache(cache_service, ttl_seconds=settings.cache_auth_ttl_seconds)
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_auth_cache() -> AuthCache:
    return AuthCacheContainer.get()
