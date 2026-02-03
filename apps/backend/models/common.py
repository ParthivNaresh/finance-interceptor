from typing import Literal

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: Literal["healthy", "unhealthy"] = Field(description="API health status")
    version: str = Field(description="API version")
