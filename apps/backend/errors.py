from __future__ import annotations

from typing import Any


class DomainError(Exception):
    __slots__ = ("code", "details", "error", "http_status", "message")

    def __init__(
        self,
        *,
        error: str,
        code: str,
        message: str,
        http_status: int,
        details: dict[str, Any] | None = None,
    ) -> None:
        self.error = error
        self.code = code
        self.message = message
        self.http_status = http_status
        self.details = details
        super().__init__(message)

    def __str__(self) -> str:
        return f"{self.code}: {self.message}"

    def __repr__(self) -> str:
        return (
            f"{self.__class__.__name__}("
            f"error={self.error!r}, "
            f"code={self.code!r}, "
            f"message={self.message!r}, "
            f"http_status={self.http_status!r}, "
            f"details={self.details!r})"
        )


class UnauthorizedError(DomainError):
    __slots__ = ()

    def __init__(
        self,
        message: str = "Unauthorized",
        *,
        code: str = "FI-401-001",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            error="unauthorized",
            code=code,
            message=message,
            http_status=401,
            details=details,
        )


class ForbiddenError(DomainError):
    __slots__ = ()

    def __init__(
        self,
        message: str = "Forbidden",
        *,
        code: str = "FI-403-001",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            error="forbidden",
            code=code,
            message=message,
            http_status=403,
            details=details,
        )


class NotFoundError(DomainError):
    __slots__ = ()

    def __init__(
        self,
        message: str = "Not found",
        *,
        code: str = "FI-404-001",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            error="not_found",
            code=code,
            message=message,
            http_status=404,
            details=details,
        )


class ConflictError(DomainError):
    __slots__ = ()

    def __init__(
        self,
        message: str = "Conflict",
        *,
        code: str = "FI-409-001",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            error="conflict",
            code=code,
            message=message,
            http_status=409,
            details=details,
        )


class InvalidRequestError(DomainError):
    __slots__ = ()

    def __init__(
        self,
        message: str = "Invalid request",
        *,
        code: str = "FI-400-001",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            error="invalid_request",
            code=code,
            message=message,
            http_status=400,
            details=details,
        )


class ExternalServiceError(DomainError):
    __slots__ = ()

    def __init__(
        self,
        message: str = "Upstream service error",
        *,
        code: str = "FI-502-001",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            error="upstream_error",
            code=code,
            message=message,
            http_status=502,
            details=details,
        )


class EncryptionError(DomainError):
    __slots__ = ()

    def __init__(
        self,
        message: str = "Encryption operation failed",
        *,
        code: str = "FI-500-ENCRYPTION",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            error="internal_error",
            code=code,
            message=message,
            http_status=500,
            details=details,
        )


class TaskQueueError(DomainError):
    __slots__ = ()

    def __init__(
        self,
        message: str = "Task queue operation failed",
        *,
        code: str = "FI-503-TASK_QUEUE",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            error="upstream_error",
            code=code,
            message=message,
            http_status=503,
            details=details,
        )


class WebhookVerificationError(DomainError):
    __slots__ = ()

    def __init__(
        self,
        message: str = "Webhook signature verification failed",
        *,
        code: str = "FI-401-WEBHOOK",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            error="webhook_verification_failed",
            code=code,
            message=message,
            http_status=401,
            details=details,
        )
