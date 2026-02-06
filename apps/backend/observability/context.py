from typing import Any

import structlog


def bind_context(**kwargs: Any) -> None:
    structlog.contextvars.bind_contextvars(**kwargs)


def clear_context() -> None:
    structlog.contextvars.clear_contextvars()


def unbind_context(*keys: str) -> None:
    structlog.contextvars.unbind_contextvars(*keys)


def get_context() -> dict[str, Any]:
    return dict(structlog.contextvars.get_contextvars())
