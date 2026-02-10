from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from models.enums import (
    AlertSeverity,
    AlertStatus,
    AlertType,
    FrequencyType,
    StreamStatus,
    StreamType,
    UserActionType,
)


class RecurringStreamBase(BaseModel):
    stream_type: StreamType
    description: str
    merchant_name: str | None = None
    category_primary: str | None = None
    category_detailed: str | None = None
    frequency: FrequencyType
    first_date: date
    last_date: date
    predicted_next_date: date | None = None
    average_amount: Decimal
    last_amount: Decimal
    iso_currency_code: str = "USD"
    is_active: bool = True
    status: StreamStatus
    is_user_modified: bool = False
    transaction_ids: list[str] = Field(default_factory=list)


class RecurringStreamCreate(RecurringStreamBase):
    user_id: UUID
    plaid_item_id: UUID
    account_id: UUID
    stream_id: str
    plaid_raw: dict[str, Any] | None = None


class RecurringStreamUpdate(BaseModel):
    description: str | None = None
    merchant_name: str | None = None
    category_primary: str | None = None
    category_detailed: str | None = None
    frequency: FrequencyType | None = None
    last_date: date | None = None
    predicted_next_date: date | None = None
    average_amount: Decimal | None = None
    last_amount: Decimal | None = None
    is_active: bool | None = None
    status: StreamStatus | None = None
    is_user_modified: bool | None = None
    transaction_ids: list[str] | None = None
    plaid_raw: dict[str, Any] | None = None
    last_synced_at: datetime | None = None


class RecurringStreamResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    plaid_item_id: UUID
    account_id: UUID
    stream_id: str
    stream_type: StreamType
    description: str
    merchant_name: str | None
    category_primary: str | None
    category_detailed: str | None
    frequency: FrequencyType
    first_date: date
    last_date: date
    predicted_next_date: date | None
    average_amount: Decimal
    last_amount: Decimal
    iso_currency_code: str
    is_active: bool
    status: StreamStatus
    is_user_modified: bool
    transaction_ids: list[str]
    last_synced_at: datetime
    created_at: datetime
    updated_at: datetime


class RecurringStreamListResponse(BaseModel):
    inflow_streams: list[RecurringStreamResponse]
    outflow_streams: list[RecurringStreamResponse]
    total_monthly_inflow: Decimal
    total_monthly_outflow: Decimal
    last_synced_at: datetime | None


class UpcomingBillResponse(BaseModel):
    stream: RecurringStreamResponse
    days_until_due: int
    expected_amount: Decimal


class UpcomingBillsListResponse(BaseModel):
    bills: list[UpcomingBillResponse]
    total_amount: Decimal
    period_days: int


class AlertBase(BaseModel):
    alert_type: AlertType
    severity: AlertSeverity
    title: str
    message: str
    data: dict[str, Any] | None = None


class AlertCreate(AlertBase):
    user_id: UUID
    recurring_stream_id: UUID | None = None


class AlertUpdate(BaseModel):
    status: AlertStatus | None = None
    user_action: UserActionType | None = None
    read_at: datetime | None = None
    dismissed_at: datetime | None = None
    actioned_at: datetime | None = None


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    recurring_stream_id: UUID | None
    alert_type: AlertType
    severity: AlertSeverity
    title: str
    message: str
    data: dict[str, Any] | None
    status: AlertStatus
    user_action: UserActionType | None
    created_at: datetime
    read_at: datetime | None
    dismissed_at: datetime | None
    actioned_at: datetime | None


class AlertWithStreamResponse(AlertResponse):
    stream: RecurringStreamResponse | None = None


class AlertListResponse(BaseModel):
    alerts: list[AlertWithStreamResponse]
    total: int
    unread_count: int


class AlertAcknowledgeRequest(BaseModel):
    user_action: UserActionType | None = None


class RecurringSyncResult(BaseModel):
    streams_synced: int
    streams_created: int
    streams_updated: int
    streams_deactivated: int
    alerts_created: int


class StreamTransactionResponse(BaseModel):
    id: UUID
    account_id: UUID
    transaction_id: str
    amount: Decimal
    iso_currency_code: str
    date: date
    name: str
    merchant_name: str | None = None
    pending: bool
    payment_channel: str | None = None
    category: list[str] | None = None
    personal_finance_category_primary: str | None = None
    personal_finance_category_detailed: str | None = None
    logo_url: str | None = None
    created_at: datetime
    updated_at: datetime


class RecurringStreamDetailResponse(BaseModel):
    stream: RecurringStreamResponse
    transactions: list[StreamTransactionResponse]
    total_spent: Decimal
    occurrence_count: int
