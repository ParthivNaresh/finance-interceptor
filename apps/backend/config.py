from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

PlaidEnvironment = Literal["sandbox", "development", "production"]
LogFormat = Literal["json", "console"]
LogLevel = Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]


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
    plaid_webhook_secret: str = Field(
        default="",
        description="Secret for verifying Plaid webhook signatures (not needed for sandbox)",
    )
    plaid_webhook_url: str = Field(
        default="",
        description="URL where Plaid sends webhooks (e.g., ngrok URL for local dev)",
    )

    supabase_url: str = Field(description="Supabase project URL")
    supabase_anon_key: str = Field(description="Supabase anonymous/public key")
    supabase_service_role_key: str = Field(description="Supabase service role key (backend only)")

    encryption_key: str = Field(
        description="Key for encrypting sensitive data like Plaid access tokens"
    )

    app_name: str = "Finance Interceptor"
    app_version: str = "0.1.0"
    debug: bool = True

    log_level: LogLevel = Field(
        default="INFO",
        description="Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)",
    )
    log_format: LogFormat = Field(
        default="console",
        description="Log output format (json for production, console for development)",
    )

    redis_url: str = Field(
        default="redis://localhost:6379",
        description="Redis connection URL for task queue",
    )
    task_queue_enabled: bool = Field(
        default=True,
        description="Enable background task queue (disable for synchronous fallback)",
    )
    task_debounce_seconds: int = Field(
        default=30,
        description="Seconds to wait before processing analytics tasks (debouncing)",
    )

    def is_development(self) -> bool:
        return self.debug or self.plaid_environment == "sandbox"

    def is_production(self) -> bool:
        return not self.is_development()


@lru_cache
def get_settings() -> Settings:
    return Settings()
