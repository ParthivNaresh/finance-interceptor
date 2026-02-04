from __future__ import annotations

from datetime import date as date_type
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class TransactionCreate(BaseModel):
    account_id: UUID
    transaction_id: str
    amount: Decimal
    iso_currency_code: str = "USD"
    date: date_type
    datetime_field: datetime | None = Field(default=None, alias="datetime")
    authorized_date: date_type | None = None
    authorized_datetime: datetime | None = None
    name: str
    merchant_name: str | None = None
    payment_channel: str | None = None
    pending: bool = False
    pending_transaction_id: str | None = None
    category_id: str | None = None
    category: list[str] | None = None
    personal_finance_category_primary: str | None = None
    personal_finance_category_detailed: str | None = None
    personal_finance_category_confidence: str | None = None
    location_address: str | None = None
    location_city: str | None = None
    location_region: str | None = None
    location_postal_code: str | None = None
    location_country: str | None = None
    location_lat: Decimal | None = None
    location_lon: Decimal | None = None
    logo_url: str | None = None
    website: str | None = None
    check_number: str | None = None

    model_config = {"populate_by_name": True}


class TransactionUpdate(BaseModel):
    amount: Decimal | None = None
    date: date_type | None = None
    name: str | None = None
    merchant_name: str | None = None
    pending: bool | None = None
    category: list[str] | None = None
    personal_finance_category_primary: str | None = None
    personal_finance_category_detailed: str | None = None


class TransactionResponse(BaseModel):
    id: UUID
    account_id: UUID
    transaction_id: str
    amount: Decimal
    iso_currency_code: str
    date: date_type
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


class TransactionDetailResponse(BaseModel):
    id: UUID
    account_id: UUID
    transaction_id: str
    amount: Decimal
    iso_currency_code: str
    date: date_type
    authorized_date: date_type | None = None
    name: str
    merchant_name: str | None = None
    pending: bool
    payment_channel: str | None = None
    category: list[str] | None = None
    personal_finance_category_primary: str | None = None
    personal_finance_category_detailed: str | None = None
    location_address: str | None = None
    location_city: str | None = None
    location_region: str | None = None
    location_postal_code: str | None = None
    location_country: str | None = None
    logo_url: str | None = None
    website: str | None = None
    created_at: datetime
    updated_at: datetime


class TransactionsListResponse(BaseModel):
    transactions: list[TransactionResponse]
    total: int
    limit: int
    offset: int
    has_more: bool


class TransactionSyncResult(BaseModel):
    added: int = 0
    modified: int = 0
    removed: int = 0
    cursor: str
    has_more: bool = False


class PlaidTransactionData(BaseModel):
    transaction_id: str
    account_id: str
    amount: Decimal
    iso_currency_code: str | None = "USD"
    date: date_type
    datetime_field: datetime | None = Field(default=None, alias="datetime")
    authorized_date: date_type | None = None
    authorized_datetime: datetime | None = None
    name: str
    merchant_name: str | None = None
    payment_channel: str | None = None
    pending: bool = False
    pending_transaction_id: str | None = None
    category_id: str | None = None
    category: list[str] | None = None
    personal_finance_category: dict[str, str] | None = None
    location: dict[str, str | float | None] | None = None
    logo_url: str | None = None
    website: str | None = None
    check_number: str | None = None

    model_config = {"populate_by_name": True}
