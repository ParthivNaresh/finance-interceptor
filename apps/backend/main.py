from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded

from config import get_settings
from middleware.rate_limit import get_limiter, rate_limit_exceeded_handler
from observability import RequestLoggingMiddleware, configure_logging, get_logger
from repositories.account import AccountRepositoryContainer
from repositories.alert import AlertRepositoryContainer
from repositories.plaid_item import PlaidItemRepositoryContainer
from repositories.recurring_stream import RecurringStreamRepositoryContainer
from repositories.transaction import TransactionRepositoryContainer
from repositories.webhook_event import WebhookEventRepositoryContainer
from routers import api_router
from services.auth import AuthServiceContainer
from services.database import DatabaseServiceContainer
from services.encryption import EncryptionServiceContainer
from services.plaid import PlaidServiceContainer
from services.recurring import AlertDetectionServiceContainer, RecurringSyncServiceContainer
from services.task_queue import TaskQueueServiceContainer
from services.transaction_sync import TransactionSyncServiceContainer
from services.webhook import WebhookServiceContainer

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

    logger.info("application.ready")

    yield

    logger.info("application.shutdown")

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
    application = FastAPI(
        title="Finance Interceptor API",
        description="Backend API for the Finance Interceptor mobile app",
        version=settings.app_version,
        lifespan=lifespan,
    )

    limiter = get_limiter()
    application.state.limiter = limiter
    application.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

    application.add_middleware(RequestLoggingMiddleware)

    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(api_router)

    logger.info(
        "application.rate_limiting",
        enabled=settings.rate_limit_enabled,
    )

    return application


app = create_app()
