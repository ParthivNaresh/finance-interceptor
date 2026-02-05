from fastapi import APIRouter

from .accounts import router as accounts_router
from .alerts import router as alerts_router
from .analytics import router as analytics_router
from .health import router as health_router
from .plaid import router as plaid_router
from .recurring import router as recurring_router
from .transactions import router as transactions_router
from .webhooks import router as webhooks_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["Health"])
api_router.include_router(plaid_router, prefix="/api/plaid", tags=["Plaid"])
api_router.include_router(webhooks_router, prefix="/api/webhooks", tags=["Webhooks"])
api_router.include_router(accounts_router, prefix="/api/accounts", tags=["Accounts"])
api_router.include_router(transactions_router, prefix="/api/transactions", tags=["Transactions"])
api_router.include_router(recurring_router, prefix="/api/recurring", tags=["Recurring"])
api_router.include_router(alerts_router, prefix="/api/alerts", tags=["Alerts"])
api_router.include_router(analytics_router, prefix="/api/analytics", tags=["Analytics"])
