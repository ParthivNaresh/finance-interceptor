from __future__ import annotations

from collections.abc import Callable

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from config import Settings, get_settings
from middleware.exceptions import get_request_id
from models.errors import ApiErrorResponse
from observability import get_logger

logger = get_logger("middleware.rate_limit")

_RATE_LIMIT_ERROR = "rate_limit_exceeded"
_RATE_LIMIT_CODE = "FI-429-001"
_RATE_LIMIT_MESSAGE = "Too many requests. Please try again later."


def get_client_ip(request: Request) -> str:
    return get_remote_address(request) or "unknown"


def get_user_or_ip(request: Request) -> str:
    user = getattr(request.state, "user", None)
    if user is not None:
        user_id = getattr(user, "id", None)
        if user_id is not None:
            return f"user:{user_id}"

    return f"ip:{get_client_ip(request)}"


def get_user_id_only(request: Request) -> str:
    user = getattr(request.state, "user", None)
    if user is not None:
        user_id = getattr(user, "id", None)
        if user_id is not None:
            return f"user:{user_id}"

    return f"ip:{get_client_ip(request)}"


def _create_limiter(settings: Settings) -> Limiter:
    if not settings.rate_limit_enabled:
        return Limiter(
            key_func=get_user_or_ip,
            enabled=False,
        )

    storage_uri = settings.get_rate_limit_storage_url()

    return Limiter(
        key_func=get_user_or_ip,
        storage_uri=storage_uri,
        strategy="fixed-window",
        headers_enabled=False,
    )


def rate_limit_exceeded_handler(request: Request, exc: Exception) -> Response:
    if not isinstance(exc, RateLimitExceeded):
        raise TypeError(f"Expected RateLimitExceeded, got {type(exc).__name__}")

    retry_after = _extract_retry_after(exc)
    request_id = get_request_id(request)

    logger.warning(
        "rate_limit.exceeded",
        request_id=request_id,
        path=request.url.path,
        method=request.method,
        limit=str(exc.detail),
        retry_after=retry_after,
    )

    payload = ApiErrorResponse(
        error=_RATE_LIMIT_ERROR,
        code=_RATE_LIMIT_CODE,
        message=_RATE_LIMIT_MESSAGE,
        request_id=request_id,
        details={"retry_after": retry_after},
    )

    return JSONResponse(
        status_code=429,
        content=payload.model_dump(),
        headers={"Retry-After": str(retry_after)},
    )


def _extract_retry_after(exc: RateLimitExceeded) -> int:
    try:
        detail = str(exc.detail)
        if "per" in detail:
            parts = detail.split()
            for i, part in enumerate(parts):
                if part == "per" and i + 1 < len(parts):
                    time_part = parts[i + 1]
                    if "second" in time_part:
                        return 1
                    if "minute" in time_part:
                        return 60
                    if "hour" in time_part:
                        return 3600
    except Exception:
        pass
    return 60


class RateLimits:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    @property
    def auth(self) -> str:
        return self._settings.rate_limit_auth

    @property
    def plaid(self) -> str:
        return self._settings.rate_limit_plaid

    @property
    def analytics_write(self) -> str:
        return self._settings.rate_limit_analytics_write

    @property
    def default(self) -> str:
        return self._settings.rate_limit_default


class RateLimiterContainer:
    _limiter: Limiter | None = None
    _limits: RateLimits | None = None

    @classmethod
    def get_limiter(cls) -> Limiter:
        if cls._limiter is None:
            settings = get_settings()
            cls._limiter = _create_limiter(settings)
        return cls._limiter

    @classmethod
    def get_limits(cls) -> RateLimits:
        if cls._limits is None:
            settings = get_settings()
            cls._limits = RateLimits(settings)
        return cls._limits

    @classmethod
    def reset(cls) -> None:
        cls._limiter = None
        cls._limits = None


def get_limiter() -> Limiter:
    return RateLimiterContainer.get_limiter()


def get_rate_limits() -> RateLimits:
    return RateLimiterContainer.get_limits()


def limit(
    limit_value: str | Callable[[], str],
    key_func: Callable[[Request], str] | None = None,
    exempt_when: Callable[[Request], bool] | None = None,
) -> Callable[[Callable[..., Response]], Callable[..., Response]]:
    limiter = get_limiter()
    return limiter.limit(
        limit_value,
        key_func=key_func,
        exempt_when=exempt_when,
    )


def shared_limit(
    limit_value: str,
    scope: str,
    key_func: Callable[[Request], str] | None = None,
) -> Callable[[Callable[..., Response]], Callable[..., Response]]:
    limiter = get_limiter()
    return limiter.shared_limit(
        limit_value,
        scope=scope,
        key_func=key_func,
    )
