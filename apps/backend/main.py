from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from repositories.account import AccountRepositoryContainer
from repositories.plaid_item import PlaidItemRepositoryContainer
from repositories.transaction import TransactionRepositoryContainer
from repositories.webhook_event import WebhookEventRepositoryContainer
from routers import api_router
from services.auth import AuthServiceContainer
from services.database import DatabaseServiceContainer
from services.encryption import EncryptionServiceContainer
from services.plaid import PlaidServiceContainer
from services.transaction_sync import TransactionSyncServiceContainer
from services.webhook import WebhookServiceContainer


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
    DatabaseServiceContainer.get()
    AuthServiceContainer.get()
    EncryptionServiceContainer.get()
    PlaidServiceContainer.get()
    PlaidItemRepositoryContainer.get()
    AccountRepositoryContainer.get()
    TransactionRepositoryContainer.get()
    WebhookEventRepositoryContainer.get()
    TransactionSyncServiceContainer.get()
    WebhookServiceContainer.get()
    yield
    WebhookServiceContainer.reset()
    TransactionSyncServiceContainer.reset()
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
        version="0.1.0",
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(api_router)

    return application


app = create_app()
