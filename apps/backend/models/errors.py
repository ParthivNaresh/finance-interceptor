from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ApiFieldError(BaseModel):
    loc: list[str] = Field(..., description="Location of the invalid field (path components)")
    msg: str = Field(..., description="Human-readable validation message")
    type: str = Field(..., description="Validation error type")


class ApiErrorResponse(BaseModel):
    error: str = Field(..., description="Stable machine-readable error category")
    message: str = Field(..., description="Human-readable message safe to show to end users")
    code: str = Field(..., description="Stable internal error code")
    request_id: str = Field(..., description="Request correlation id")
    details: dict[str, Any] | None = Field(default=None, description="Optional structured details")
