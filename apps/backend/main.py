from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded

from config import get_settings
from errors import DomainError
from middleware.exceptions import (
    domain_error_handler,
    http_exception_handler,
    request_validation_error_handler,
    unhandled_exception_handler,
)
from middleware.rate_limit import get_limiter, rate_limit_exceeded_handler
from middleware.security_headers import SecurityHeadersMiddleware
from observability import RequestLoggingMiddleware, configure_logging, get_logger
from repositories.account import AccountRepositoryContainer
from repositories.alert import AlertRepositoryContainer
from repositories.plaid_item import PlaidItemRepositoryContainer
from repositories.recurring_stream import RecurringStreamRepositoryContainer
from repositories.transaction import TransactionRepositoryContainer
from repositories.webhook_event import WebhookEventRepositoryContainer
from routers import api_router
from services.auth import AuthServiceContainer
from services.cache.base import CacheServiceContainer
from services.database import DatabaseServiceContainer
from services.encryption import EncryptionServiceContainer
from services.plaid import PlaidServiceContainer
from services.recurring import AlertDetectionServiceContainer, RecurringSyncServiceContainer
from services.task_queue import TaskQueueServiceContainer
from services.transaction_sync import TransactionSyncServiceContainer
from services.webhook import WebhookServiceContainer
from services.webhook_key_cache import WebhookKeyCacheContainer
from services.webhook_verification import PlaidWebhookVerifierContainer

settings = get_settings()

configure_logging(
    log_level=settings.log_level,
    log_format=settings.log_format,
    service_name="finance-interceptor",
    service_version=settings.app_version,
)

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
    logger.info(
        "application.startup",
        environment=settings.plaid_environment,
        debug=settings.debug,
        task_queue_enabled=settings.task_queue_enabled,
    )

    CacheServiceContainer.get()
    DatabaseServiceContainer.get()
    AuthServiceContainer.get()
    EncryptionServiceContainer.get()
    PlaidServiceContainer.get()
    PlaidItemRepositoryContainer.get()
    AccountRepositoryContainer.get()
    TransactionRepositoryContainer.get()
    WebhookEventRepositoryContainer.get()
    RecurringStreamRepositoryContainer.get()
    AlertRepositoryContainer.get()
    TransactionSyncServiceContainer.get()
    AlertDetectionServiceContainer.get()
    RecurringSyncServiceContainer.get()
    TaskQueueServiceContainer.get()
    WebhookServiceContainer.get()
    WebhookKeyCacheContainer.get()
    PlaidWebhookVerifierContainer.get()

    logger.info(
        "application.ready",
        webhook_verification_enabled=settings.plaid_webhook_verification_enabled,
        cache_enabled=settings.cache_enabled,
    )

    yield

    logger.info("application.shutdown")

    PlaidWebhookVerifierContainer.reset()
    WebhookKeyCacheContainer.reset()
    CacheServiceContainer.reset()
    WebhookServiceContainer.reset()
    await TaskQueueServiceContainer.close()
    RecurringSyncServiceContainer.reset()
    AlertDetectionServiceContainer.reset()
    TransactionSyncServiceContainer.reset()
    AlertRepositoryContainer.reset()
    RecurringStreamRepositoryContainer.reset()
    WebhookEventRepositoryContainer.reset()
    TransactionRepositoryContainer.reset()
    AccountRepositoryContainer.reset()
    PlaidItemRepositoryContainer.reset()
    PlaidServiceContainer.reset()
    EncryptionServiceContainer.reset()
    AuthServiceContainer.reset()
    DatabaseServiceContainer.reset()


def create_app() -> FastAPI:
    production_errors = settings.validate_production_settings()
    if production_errors:
        for error in production_errors:
            logger.error("application.config_error", error=error)
        raise RuntimeError(f"Production configuration errors: {'; '.join(production_errors)}")

    if settings.sentry_dsn:
        import sentry_sdk

        sentry_sdk.init(
            dsn=settings.sentry_dsn,
            environment=settings.environment,
            release=f"finance-interceptor@{settings.app_version}",
            traces_sample_rate=0.1,
        )
        logger.info("sentry.initialized", environment=settings.environment)

    application = FastAPI(
        title="Finance Interceptor API",
        description="Backend API for the Finance Interceptor mobile app",
        version=settings.app_version,
        lifespan=lifespan,
    )

    limiter = get_limiter()
    application.state.limiter = limiter
    application.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

    application.add_exception_handler(DomainError, domain_error_handler)
    application.add_exception_handler(RequestValidationError, request_validation_error_handler)
    application.add_exception_handler(HTTPException, http_exception_handler)
    application.add_exception_handler(Exception, unhandled_exception_handler)

    application.add_middleware(RequestLoggingMiddleware)
    application.add_middleware(SecurityHeadersMiddleware)

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.get_cors_allowed_origins(),
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=settings.get_cors_allowed_methods(),
        allow_headers=settings.get_cors_allowed_headers(),
        expose_headers=settings.get_cors_exposed_headers(),
    )

    application.include_router(api_router)

    logger.info(
        "application.rate_limiting",
        enabled=settings.rate_limit_enabled,
    )

    return application


app = create_app()
