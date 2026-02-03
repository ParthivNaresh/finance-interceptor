from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

PlaidEnvironment = Literal["sandbox", "development", "production"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    plaid_client_id: str
    plaid_secret: str
    plaid_environment: PlaidEnvironment = "sandbox"

    supabase_url: str = Field(description="Supabase project URL")
    supabase_anon_key: str = Field(description="Supabase anonymous/public key")
    supabase_service_role_key: str = Field(description="Supabase service role key (backend only)")

    app_name: str = "Finance Interceptor"
    debug: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
