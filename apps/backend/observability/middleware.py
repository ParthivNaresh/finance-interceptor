import time
import uuid
from collections.abc import Callable
from typing import Any, Final

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from observability.context import bind_context, clear_context
from observability.logger import get_logger

REQUEST_ID_HEADER: Final[str] = "X-Request-ID"

_PATHS_TO_SKIP: Final[frozenset[str]] = frozenset(
    {
        "/health",
        "/healthz",
        "/ready",
        "/readyz",
        "/metrics",
        "/favicon.ico",
    }
)

logger = get_logger("http.access")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        if self._should_skip_logging(request.url.path):
            return await call_next(request)

        request_id = self._get_or_create_request_id(request)
        start_time = time.perf_counter_ns()

        clear_context()
        bind_context(
            request_id=request_id,
            http_method=request.method,
            http_path=request.url.path,
        )

        client_host = self._get_client_host(request)
        if client_host:
            bind_context(client_ip=client_host)

        logger.info(
            "http.request.started",
            http_query=str(request.url.query) if request.url.query else None,
        )

        response: Response
        try:
            response = await call_next(request)
        except Exception:
            duration_ms = self._calculate_duration_ms(start_time)
            logger.exception(
                "http.request.failed",
                http_status=500,
                duration_ms=duration_ms,
            )
            raise

        duration_ms = self._calculate_duration_ms(start_time)

        bind_context(http_status=response.status_code)

        log_method = self._get_log_method_for_status(response.status_code)
        log_method(
            "http.request.completed",
            duration_ms=duration_ms,
        )

        response.headers[REQUEST_ID_HEADER] = request_id

        return response

    def _should_skip_logging(self, path: str) -> bool:
        return path in _PATHS_TO_SKIP

    def _get_or_create_request_id(self, request: Request) -> str:
        request_id = request.headers.get(REQUEST_ID_HEADER)
        if request_id:
            return request_id
        return str(uuid.uuid4())

    def _get_client_host(self, request: Request) -> str | None:
        if request.client:
            return request.client.host
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        return None

    def _calculate_duration_ms(self, start_time_ns: int) -> float:
        elapsed_ns = time.perf_counter_ns() - start_time_ns
        return round(elapsed_ns / 1_000_000, 2)

    def _get_log_method_for_status(
        self,
        status_code: int,
    ) -> Callable[..., Any]:
        if status_code >= 500:
            return logger.error
        if status_code >= 400:
            return logger.warning
        return logger.info
