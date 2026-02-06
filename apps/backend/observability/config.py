import logging
import logging.config
import sys
from dataclasses import dataclass
from typing import Any, Literal

import structlog
from structlog.typing import Processor

from observability.constants import THIRD_PARTY_LOGGERS
from observability.processors import add_service_info, drop_color_message, scrub_sensitive_data

LogFormat = Literal["json", "console"]
LogLevel = Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]


@dataclass(frozen=True, slots=True)
class LoggingConfig:
    log_level: str = "INFO"
    log_format: str = "console"
    service_name: str = "finance-interceptor"
    service_version: str = "0.1.0"

    def configure(self) -> None:
        self._configure_structlog()
        self._configure_stdlib_logging()
        self._configure_exception_hook()

    def _get_shared_processors(self) -> list[Processor]:
        return [
            structlog.contextvars.merge_contextvars,
            scrub_sensitive_data,
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.stdlib.ExtraAdder(),
            drop_color_message,
            add_service_info(self.service_name, self.service_version),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
        ]

    def _get_renderer(self) -> Processor:
        if self._is_json_format():
            return structlog.processors.JSONRenderer()
        return structlog.dev.ConsoleRenderer(colors=True)

    def _is_json_format(self) -> bool:
        return self.log_format.lower() == "json"

    def _configure_structlog(self) -> None:
        shared_processors = self._get_shared_processors()

        if self._is_json_format():
            shared_processors.append(structlog.processors.format_exc_info)

        structlog.configure(
            processors=[
                *shared_processors,
                structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
            ],
            logger_factory=structlog.stdlib.LoggerFactory(),
            wrapper_class=structlog.stdlib.BoundLogger,
            cache_logger_on_first_use=True,
        )

    def _configure_stdlib_logging(self) -> None:
        shared_processors = self._get_shared_processors()

        if self._is_json_format():
            shared_processors.append(structlog.processors.format_exc_info)

        formatter = structlog.stdlib.ProcessorFormatter(
            foreign_pre_chain=shared_processors,
            processors=[
                structlog.stdlib.ProcessorFormatter.remove_processors_meta,
                self._get_renderer(),
            ],
        )

        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(formatter)

        root_logger = logging.getLogger()
        root_logger.handlers.clear()
        root_logger.addHandler(handler)
        root_logger.setLevel(self.log_level.upper())

        self._configure_third_party_loggers()

    def _configure_third_party_loggers(self) -> None:
        for logger_name in THIRD_PARTY_LOGGERS:
            logger = logging.getLogger(logger_name)
            logger.handlers.clear()
            logger.propagate = True

        uvicorn_access = logging.getLogger("uvicorn.access")
        uvicorn_access.handlers.clear()
        uvicorn_access.propagate = False

    def _configure_exception_hook(self) -> None:
        def handle_exception(
            exc_type: type[BaseException],
            exc_value: BaseException,
            exc_traceback: Any,
        ) -> None:
            if issubclass(exc_type, KeyboardInterrupt):
                sys.__excepthook__(exc_type, exc_value, exc_traceback)
                return

            logger = structlog.stdlib.get_logger("uncaught_exception")
            logger.critical(
                "Uncaught exception",
                exc_info=(exc_type, exc_value, exc_traceback),
            )

        sys.excepthook = handle_exception
