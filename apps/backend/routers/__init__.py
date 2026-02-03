from fastapi import APIRouter

from .health import router as health_router
from .plaid import router as plaid_router
from .webhooks import router as webhooks_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["Health"])
api_router.include_router(plaid_router, prefix="/api/plaid", tags=["Plaid"])
api_router.include_router(webhooks_router, prefix="/api/webhooks", tags=["Webhooks"])
