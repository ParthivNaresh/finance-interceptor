from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class LinkTokenResponse(BaseModel):
    link_token: str = Field(description="Token used to initialize Plaid Link")
    expiration: datetime = Field(description="When the link token expires")
    request_id: str = Field(description="Plaid request ID for debugging")


class ExchangeTokenRequest(BaseModel):
    public_token: str = Field(
        ...,
        min_length=1,
        description="Public token received from Plaid Link after user authentication",
    )


class AccountResponse(BaseModel):
    id: UUID = Field(description="Internal account ID")
    account_id: str = Field(description="Plaid account ID")
    name: str = Field(description="Account name")
    official_name: str | None = Field(default=None, description="Official account name")
    type: str = Field(description="Account type (depository, credit, etc.)")
    subtype: str | None = Field(default=None, description="Account subtype")
    mask: str | None = Field(default=None, description="Last 4 digits of account number")
    current_balance: Decimal | None = Field(default=None, description="Current balance")
    available_balance: Decimal | None = Field(default=None, description="Available balance")
    iso_currency_code: str = Field(default="USD", description="Currency code")


class PlaidItemResponse(BaseModel):
    id: UUID = Field(description="Internal plaid item ID")
    item_id: str = Field(description="Plaid item ID")
    institution_id: str | None = Field(default=None, description="Institution ID")
    institution_name: str | None = Field(default=None, description="Institution name")
    status: str = Field(description="Connection status")
    accounts: list[AccountResponse] = Field(default_factory=list, description="Connected accounts")


class ExchangeTokenResponse(BaseModel):
    item_id: str = Field(description="Plaid item ID")
    plaid_item: PlaidItemResponse = Field(description="Created plaid item with accounts")
    status: Literal["success", "error"] = Field(
        default="success",
        description="Status of the token exchange",
    )


class PlaidItemCreate(BaseModel):
    user_id: UUID
    item_id: str
    institution_id: str | None = None
    institution_name: str | None = None
    encrypted_access_token: str


class AccountCreate(BaseModel):
    plaid_item_id: UUID
    account_id: str
    name: str
    official_name: str | None = None
    type: str
    subtype: str | None = None
    mask: str | None = None
    current_balance: Decimal | None = None
    available_balance: Decimal | None = None
    iso_currency_code: str = "USD"
