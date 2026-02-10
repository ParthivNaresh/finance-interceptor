from uuid import UUID

from pydantic import BaseModel, Field


class AuthenticatedUser(BaseModel):
    id: UUID = Field(description="User ID from Supabase auth")
    email: str | None = Field(default=None, description="User email")
    role: str = Field(default="authenticated", description="User role")
