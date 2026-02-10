import structlog

Logger = structlog.stdlib.BoundLogger


def get_logger(name: str | None = None) -> Logger:
    return structlog.stdlib.get_logger(name)
