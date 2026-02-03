from fastapi import APIRouter

from .health import router as health_router
from .plaid import router as plaid_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["Health"])
api_router.include_router(plaid_router, prefix="/api/plaid", tags=["Plaid"])
