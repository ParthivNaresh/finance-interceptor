from functools import lru_cache
from typing import Literal

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

    app_name: str = "Finance Interceptor"
    debug: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
