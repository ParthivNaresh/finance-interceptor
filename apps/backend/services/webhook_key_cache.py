from __future__ import annotations

import contextlib
import json
import time
from typing import Any, ClassVar

from redis import Redis
from redis.exceptions import RedisError

from config import Settings, get_settings
from models.webhook_verification import CachedKey, JWKPublicKey
from observability import get_logger

logger = get_logger("services.webhook_key_cache")


class WebhookKeyCacheError(Exception):
    def __init__(self, message: str = "Webhook key cache operation failed") -> None:
        self.message = message
        super().__init__(self.message)


class WebhookKeyCache:
    _KEY_PREFIX: ClassVar[str] = "plaid:webhook:key"

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client: Redis | None = None
        self._ttl_seconds = settings.webhook_key_cache_ttl_seconds

    def _get_client(self) -> Redis:
        if self._client is None:
            self._client = Redis.from_url(
                self._settings.redis_url,
                decode_responses=False,
                socket_connect_timeout=5.0,
                socket_timeout=5.0,
            )
        return self._client

    def _build_key(self, key_id: str) -> str:
        return f"{self._KEY_PREFIX}:{key_id}"

    def _serialize_cached_key(self, cached: CachedKey) -> bytes:
        data = {
            "key": {
                "kid": cached.key.kid,
                "alg": cached.key.alg,
                "kty": cached.key.kty,
                "crv": cached.key.crv,
                "x": cached.key.x,
                "y": cached.key.y,
                "use": cached.key.use,
                "created_at": cached.key.created_at,
                "expired_at": cached.key.expired_at,
            },
            "cached_at": cached.cached_at,
        }
        return json.dumps(data).encode("utf-8")

    def _deserialize_cached_key(self, data: bytes) -> CachedKey:
        parsed: dict[str, Any] = json.loads(data.decode("utf-8"))
        key_data = parsed["key"]
        return CachedKey(
            key=JWKPublicKey(
                kid=key_data["kid"],
                alg=key_data["alg"],
                kty=key_data["kty"],
                crv=key_data["crv"],
                x=key_data["x"],
                y=key_data["y"],
                use=key_data["use"],
                created_at=key_data["created_at"],
                expired_at=key_data["expired_at"],
            ),
            cached_at=parsed["cached_at"],
        )

    def _is_expired(self, cached: CachedKey) -> bool:
        current_time = time.time()

        if cached.key.expired_at is not None and cached.key.expired_at < current_time:
            return True

        cache_age = current_time - cached.cached_at
        return cache_age > self._ttl_seconds

    def get(self, key_id: str) -> JWKPublicKey | None:
        redis_key = self._build_key(key_id)
        log = logger.bind(key_id=key_id, redis_key=redis_key)

        try:
            client = self._get_client()
            raw_data = client.get(redis_key)

            if raw_data is None:
                log.debug("webhook_key_cache.miss")
                return None

            if not isinstance(raw_data, bytes):
                log.warning("webhook_key_cache.unexpected_type", data_type=type(raw_data).__name__)
                return None

            cached = self._deserialize_cached_key(raw_data)

            if self._is_expired(cached):
                log.info(
                    "webhook_key_cache.expired",
                    cached_at=cached.cached_at,
                    plaid_expired_at=cached.key.expired_at,
                )
                self.delete(key_id)
                return None

            log.debug("webhook_key_cache.hit")
            return cached.key

        except RedisError as e:
            log.warning("webhook_key_cache.get_failed", error=str(e))
            return None
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            log.warning("webhook_key_cache.deserialize_failed", error=str(e))
            self.delete(key_id)
            return None

    def set(self, key: JWKPublicKey) -> bool:
        redis_key = self._build_key(key.kid)
        log = logger.bind(key_id=key.kid, redis_key=redis_key)

        try:
            cached = CachedKey(key=key, cached_at=time.time())
            serialized = self._serialize_cached_key(cached)

            ttl = self._calculate_ttl(key)

            client = self._get_client()
            client.setex(redis_key, ttl, serialized)

            log.debug("webhook_key_cache.set", ttl_seconds=ttl)
            return True

        except RedisError as e:
            log.warning("webhook_key_cache.set_failed", error=str(e))
            return False

    def _calculate_ttl(self, key: JWKPublicKey) -> int:
        if key.expired_at is not None:
            time_until_plaid_expiry = int(key.expired_at - time.time())
            if time_until_plaid_expiry > 0:
                return min(time_until_plaid_expiry, self._ttl_seconds)

        return self._ttl_seconds

    def delete(self, key_id: str) -> bool:
        redis_key = self._build_key(key_id)
        log = logger.bind(key_id=key_id, redis_key=redis_key)

        try:
            client = self._get_client()
            result = client.delete(redis_key)
            was_deleted = bool(result)
            log.debug("webhook_key_cache.deleted", was_present=was_deleted)
            return was_deleted

        except RedisError as e:
            log.warning("webhook_key_cache.delete_failed", error=str(e))
            return False

    def close(self) -> None:
        if self._client is not None:
            with contextlib.suppress(RedisError):
                self._client.close()
            self._client = None

    def is_available(self) -> bool:
        try:
            client = self._get_client()
            client.ping()
            return True
        except RedisError:
            return False


class WebhookKeyCacheContainer:
    _instance: WebhookKeyCache | None = None

    @classmethod
    def get(cls) -> WebhookKeyCache:
        if cls._instance is None:
            settings = get_settings()
            cls._instance = WebhookKeyCache(settings)
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        if cls._instance is not None:
            cls._instance.close()
        cls._instance = None


def get_webhook_key_cache() -> WebhookKeyCache:
    return WebhookKeyCacheContainer.get()
