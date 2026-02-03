from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class WebhookType(str, Enum):
    TRANSACTIONS = "TRANSACTIONS"
    ITEM = "ITEM"
    AUTH = "AUTH"
    ASSETS = "ASSETS"
    HOLDINGS = "HOLDINGS"
    INVESTMENTS_TRANSACTIONS = "INVESTMENTS_TRANSACTIONS"
    LIABILITIES = "LIABILITIES"
    INCOME = "INCOME"


class TransactionsWebhookCode(str, Enum):
    SYNC_UPDATES_AVAILABLE = "SYNC_UPDATES_AVAILABLE"
    RECURRING_TRANSACTIONS_UPDATE = "RECURRING_TRANSACTIONS_UPDATE"
    INITIAL_UPDATE = "INITIAL_UPDATE"
    HISTORICAL_UPDATE = "HISTORICAL_UPDATE"
    DEFAULT_UPDATE = "DEFAULT_UPDATE"
    TRANSACTIONS_REMOVED = "TRANSACTIONS_REMOVED"


class ItemWebhookCode(str, Enum):
    ERROR = "ERROR"
    LOGIN_REPAIRED = "LOGIN_REPAIRED"
    PENDING_EXPIRATION = "PENDING_EXPIRATION"
    USER_PERMISSION_REVOKED = "USER_PERMISSION_REVOKED"
    USER_ACCOUNT_REVOKED = "USER_ACCOUNT_REVOKED"
    WEBHOOK_UPDATE_ACKNOWLEDGED = "WEBHOOK_UPDATE_ACKNOWLEDGED"


class WebhookEventStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class PlaidWebhookRequest(BaseModel):
    webhook_type: str = Field(description="Type of webhook (TRANSACTIONS, ITEM, etc.)")
    webhook_code: str = Field(description="Specific webhook code")
    item_id: str = Field(description="Plaid item ID this webhook relates to")
    error: dict[str, Any] | None = Field(default=None, description="Error details if applicable")
    new_transactions: int | None = Field(default=None, description="Number of new transactions")
    removed_transactions: list[str] | None = Field(default=None, description="Removed transaction IDs")
    consent_expiration_time: str | None = Field(default=None, description="When consent expires")


class WebhookEventCreate(BaseModel):
    webhook_type: str
    webhook_code: str
    item_id: str
    plaid_item_id: UUID | None = None
    payload: dict[str, Any]
    idempotency_key: str


class WebhookEventResponse(BaseModel):
    id: UUID
    webhook_type: str
    webhook_code: str
    item_id: str
    plaid_item_id: UUID | None
    status: str
    retry_count: int
    error_message: str | None
    received_at: datetime
    processed_at: datetime | None


class WebhookAcknowledgeResponse(BaseModel):
    received: bool = True
    event_id: UUID | None = None
    status: str = "acknowledged"
