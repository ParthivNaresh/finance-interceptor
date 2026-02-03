from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import api_router
from services.plaid import PlaidServiceContainer


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
    PlaidServiceContainer.get()
    yield
    PlaidServiceContainer.reset()


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
