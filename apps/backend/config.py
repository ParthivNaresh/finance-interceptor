from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

PlaidEnvironment = Literal["sandbox", "development", "production"]
LogFormat = Literal["json", "console"]
LogLevel = Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]


def _parse_csv(value: str) -> list[str]:
    items = [item.strip() for item in value.split(",")]
    return [item for item in items if item]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    cors_allowed_origins: str = Field(
        default="",
        description="Comma-separated allowed CORS origins. Empty means deny all in production.",
    )
    cors_allow_credentials: bool = Field(
        default=False,
        description="Allow credentialed CORS requests. Keep false unless using cookie-based auth.",
    )
    cors_allowed_methods: str = Field(
        default="GET,POST,PUT,PATCH,DELETE,OPTIONS",
        description="Comma-separated list of allowed CORS methods.",
    )
    cors_allowed_headers: str = Field(
        default="Authorization,Content-Type,X-Request-ID",
        description="Comma-separated list of allowed CORS headers.",
    )
    cors_exposed_headers: str = Field(
        default="X-Request-ID",
        description="Comma-separated list of CORS exposed headers.",
    )

    def get_cors_allowed_origins(self) -> list[str]:
        return _parse_csv(self.cors_allowed_origins)

    def get_cors_allowed_methods(self) -> list[str]:
        return _parse_csv(self.cors_allowed_methods)

    def get_cors_allowed_headers(self) -> list[str]:
        return _parse_csv(self.cors_allowed_headers)

    def get_cors_exposed_headers(self) -> list[str]:
        return _parse_csv(self.cors_exposed_headers)

    plaid_client_id: str
    plaid_secret: str
    plaid_environment: PlaidEnvironment = "sandbox"
    plaid_webhook_url: str = Field(
        default="",
        description="URL where Plaid sends webhooks (e.g., ngrok URL for local dev)",
    )
    plaid_webhook_verification_enabled: bool = Field(
        default=False,
        description="Enable Plaid webhook JWT signature verification. Must be True in production.",
    )
    webhook_key_cache_ttl_seconds: int = Field(
        default=86400,
        description="TTL in seconds for cached Plaid webhook verification keys (default: 24 hours)",
    )
    webhook_verification_timeout_seconds: float = Field(
        default=10.0,
        description="Timeout in seconds for Plaid webhook verification key fetch requests",
    )

    supabase_url: str = Field(description="Supabase project URL")
    supabase_anon_key: str = Field(description="Supabase anonymous/public key")
    supabase_service_role_key: str = Field(description="Supabase service role key (backend only)")

    encryption_key: str = Field(
        description="Key for encrypting sensitive data like Plaid access tokens"
    )

    app_name: str = "Finance Interceptor"
    app_version: str = "0.1.0"
    debug: bool = Field(
        default=False,
        description="Enable debug mode. Must be False in production.",
    )

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

    rate_limit_enabled: bool = Field(
        default=True,
        description="Enable API rate limiting",
    )
    rate_limit_storage_url: str = Field(
        default="",
        description="Redis URL for rate limit storage (defaults to redis_url if empty)",
    )
    rate_limit_auth: str = Field(
        default="5/minute",
        description="Rate limit for auth endpoints (IP-based)",
    )
    rate_limit_plaid: str = Field(
        default="10/minute",
        description="Rate limit for Plaid endpoints (user-based)",
    )
    rate_limit_analytics_write: str = Field(
        default="5/minute",
        description="Rate limit for analytics write endpoints (user-based)",
    )
    rate_limit_default: str = Field(
        default="60/minute",
        description="Default rate limit for authenticated endpoints (user-based)",
    )

    def get_rate_limit_storage_url(self) -> str:
        return self.rate_limit_storage_url or self.redis_url

    def is_development(self) -> bool:
        return self.debug or self.plaid_environment == "sandbox"

    def is_production(self) -> bool:
        return not self.is_development()

    def validate_production_settings(self) -> list[str]:
        errors: list[str] = []

        if self.plaid_environment == "production":
            if self.debug:
                errors.append("DEBUG must be False when PLAID_ENVIRONMENT=production")

            if not self.plaid_webhook_verification_enabled:
                errors.append("PLAID_WEBHOOK_VERIFICATION_ENABLED must be True in production")

            if not self.cors_allowed_origins:
                errors.append("CORS_ALLOWED_ORIGINS must be set when PLAID_ENVIRONMENT=production")

        return errors


@lru_cache
def get_settings() -> Settings:
    return Settings()
