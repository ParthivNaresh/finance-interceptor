from __future__ import annotations

from typing import Any

from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.responses import Response

from errors import DomainError
from models.errors import ApiErrorResponse, ApiFieldError
from observability import get_logger

logger = get_logger("middleware.exceptions")


def _get_request_id(request: Request) -> str:
    request_id = request.headers.get("X-Request-ID")
    if request_id:
        return request_id

    state_request_id = getattr(request.state, "request_id", None)
    if isinstance(state_request_id, str) and state_request_id:
        return state_request_id

    return "unknown"


def _json_error(
    *,
    status_code: int,
    error: str,
    code: str,
    message: str,
    request_id: str,
    details: dict[str, Any] | None = None,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    payload = ApiErrorResponse(
        error=error,
        code=code,
        message=message,
        request_id=request_id,
        details=details,
    )
    return JSONResponse(
        status_code=status_code,
        content=payload.model_dump(),
        headers=headers,
    )


def domain_error_handler(request: Request, exc: DomainError) -> Response:
    request_id = _get_request_id(request)

    log_method = logger.warning if 400 <= exc.http_status < 500 else logger.error
    log_method(
        "api.domain_error",
        request_id=request_id,
        path=str(request.url.path),
        method=request.method,
        status_code=exc.http_status,
        error=exc.error,
        code=exc.code,
    )

    return _json_error(
        status_code=exc.http_status,
        error=exc.error,
        code=exc.code,
        message=exc.message,
        request_id=request_id,
        details=exc.details,
    )


def http_exception_handler(request: Request, exc: HTTPException) -> Response:
    request_id = _get_request_id(request)

    status_code = int(getattr(exc, "status_code", 500) or 500)

    if status_code == 401:
        error = "unauthorized"
        code = "FI-401-001"
        message = "Unauthorized"
    elif status_code == 403:
        error = "forbidden"
        code = "FI-403-001"
        message = "Forbidden"
    elif status_code == 404:
        error = "not_found"
        code = "FI-404-001"
        message = "Not found"
    elif status_code == 429:
        error = "rate_limit_exceeded"
        code = "FI-429-001"
        message = "Too many requests"
    elif 400 <= status_code < 500:
        error = "invalid_request"
        code = "FI-400-001"
        message = "Invalid request"
    else:
        error = "internal_error"
        code = "FI-500-001"
        message = "An unexpected error occurred"

    logger.warning(
        "api.http_exception",
        request_id=request_id,
        path=str(request.url.path),
        method=request.method,
        status_code=status_code,
        error=error,
        code=code,
    )

    headers: dict[str, str] | None = None
    if isinstance(exc.headers, dict):
        headers = {str(k): str(v) for k, v in exc.headers.items()}

    return _json_error(
        status_code=status_code,
        error=error,
        code=code,
        message=message,
        request_id=request_id,
        headers=headers,
    )


def request_validation_error_handler(request: Request, exc: RequestValidationError) -> Response:
    request_id = _get_request_id(request)

    field_errors: list[ApiFieldError] = []
    for err in exc.errors()[:50]:
        loc = [str(part) for part in err.get("loc", [])]
        msg = str(err.get("msg", "Invalid value"))
        err_type = str(err.get("type", "validation_error"))
        field_errors.append(ApiFieldError(loc=loc, msg=msg, type=err_type))

    logger.warning(
        "api.validation_error",
        request_id=request_id,
        path=str(request.url.path),
        method=request.method,
        status_code=422,
        errors_count=len(exc.errors()),
    )

    return _json_error(
        status_code=422,
        error="validation_error",
        code="FI-422-001",
        message="Request validation failed",
        request_id=request_id,
        details={
            "fields": [e.model_dump() for e in field_errors],
        },
    )


def unhandled_exception_handler(request: Request, exc: Exception) -> Response:
    request_id = _get_request_id(request)

    logger.exception(
        "api.unhandled_exception",
        request_id=request_id,
        path=str(request.url.path),
        method=request.method,
        status_code=500,
    )

    return _json_error(
        status_code=500,
        error="internal_error",
        code="FI-500-UNEXPECTED",
        message="An unexpected error occurred",
        request_id=request_id,
    )
