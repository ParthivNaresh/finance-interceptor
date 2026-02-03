from datetime import datetime
from typing import Literal

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


class ExchangeTokenResponse(BaseModel):
    item_id: str = Field(description="Unique identifier for the connected bank account")
    status: Literal["success", "error"] = Field(
        default="success",
        description="Status of the token exchange",
    )


class HealthResponse(BaseModel):
    status: Literal["healthy", "unhealthy"] = Field(description="API health status")
    version: str = Field(description="API version")
