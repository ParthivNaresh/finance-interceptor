from __future__ import annotations

import contextlib
from collections import defaultdict
from typing import Any, ClassVar

from redis import Redis
from redis.exceptions import RedisError

from config import Settings, get_settings
from observability import get_logger

logger = get_logger("services.cache")


class CacheService:
    _KEY_PREFIX: ClassVar[str] = "fi"

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client: Redis | None = None
        self._enabled = settings.cache_enabled
        self._stats: dict[str, dict[str, int]] = defaultdict(lambda: {"hits": 0, "misses": 0})

    def _get_client(self) -> Redis:
        if self._client is None:
            self._client = Redis.from_url(
                self._settings.redis_url,
                decode_responses=False,
                socket_connect_timeout=5.0,
                socket_timeout=5.0,
            )
        return self._client

    def _build_key(self, *parts: str) -> str:
        return f"{self._KEY_PREFIX}:{':'.join(parts)}"

    @staticmethod
    def _extract_domain(key: str) -> str:
        parts = key.split(":")
        if len(parts) >= 2 and parts[0] == "fi":
            return parts[1]
        return "unknown"

    def get(self, key: str) -> bytes | None:
        if not self._enabled:
            return None

        domain = self._extract_domain(key)

        try:
            client = self._get_client()
            raw_data = client.get(key)

            if raw_data is None:
                self._stats[domain]["misses"] += 1
                logger.debug("cache.miss", key=key)
                return None

            if not isinstance(raw_data, bytes):
                self._stats[domain]["misses"] += 1
                logger.warning("cache.unexpected_type", key=key, data_type=type(raw_data).__name__)
                return None

            self._stats[domain]["hits"] += 1
            logger.debug("cache.hit", key=key)
            return raw_data

        except RedisError as e:
            self._stats[domain]["misses"] += 1
            logger.warning("cache.get_failed", key=key, error=str(e))
            return None

    def get_stats(self) -> dict[str, Any]:
        total_hits = sum(d["hits"] for d in self._stats.values())
        total_misses = sum(d["misses"] for d in self._stats.values())
        total = total_hits + total_misses

        domains: dict[str, dict[str, Any]] = {}
        for domain, counts in sorted(self._stats.items()):
            domain_total = counts["hits"] + counts["misses"]
            domains[domain] = {
                "hits": counts["hits"],
                "misses": counts["misses"],
                "hit_rate": round(counts["hits"] / domain_total, 4) if domain_total > 0 else 0.0,
            }

        return {
            "total_hits": total_hits,
            "total_misses": total_misses,
            "hit_rate": round(total_hits / total, 4) if total > 0 else 0.0,
            "domains": domains,
        }

    def set(self, key: str, value: bytes, ttl: int) -> bool:
        if not self._enabled:
            return False

        try:
            client = self._get_client()
            client.setex(key, ttl, value)
            logger.debug("cache.set", key=key, ttl_seconds=ttl)
            return True
        except RedisError as e:
            logger.warning("cache.set_failed", key=key, error=str(e))
            return False

    def delete(self, key: str) -> bool:
        if not self._enabled:
            return False

        try:
            client = self._get_client()
            result = client.delete(key)
            was_deleted = bool(result)
            logger.debug("cache.delete", key=key, was_present=was_deleted)
            return was_deleted
        except RedisError as e:
            logger.warning("cache.delete_failed", key=key, error=str(e))
            return False

    def delete_pattern(self, pattern: str) -> int:
        if not self._enabled:
            return 0

        try:
            client = self._get_client()
            deleted = 0
            keys_batch: list[bytes] = []
            for key in client.scan_iter(match=pattern, count=100):
                keys_batch.append(key)
                if len(keys_batch) >= 100:
                    client.delete(*keys_batch)
                    deleted += len(keys_batch)
                    keys_batch = []
            if keys_batch:
                client.delete(*keys_batch)
                deleted += len(keys_batch)
            logger.debug("cache.delete_pattern", pattern=pattern, deleted_count=deleted)
            return deleted
        except RedisError as e:
            logger.warning("cache.delete_pattern_failed", pattern=pattern, error=str(e))
            return 0

    def is_available(self) -> bool:
        if not self._enabled:
            return False

        try:
            client = self._get_client()
            client.ping()
            return True
        except RedisError:
            return False

    def close(self) -> None:
        if self._client is not None:
            with contextlib.suppress(RedisError):
                self._client.close()
            self._client = None


class CacheServiceContainer:
    _instance: CacheService | None = None

    @classmethod
    def get(cls) -> CacheService:
        if cls._instance is None:
            settings = get_settings()
            cls._instance = CacheService(settings)
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        if cls._instance is not None:
            cls._instance.close()
        cls._instance = None


def get_cache_service() -> CacheService:
    return CacheServiceContainer.get()
