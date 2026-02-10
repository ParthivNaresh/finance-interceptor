import re
from typing import Final

SENSITIVE_KEYS: Final[frozenset[str]] = frozenset(
    {
        "access_token",
        "account_number",
        "api_key",
        "apikey",
        "authorization",
        "card_number",
        "client_secret",
        "credit_card",
        "cvv",
        "encrypted_access_token",
        "encryption_key",
        "password",
        "pin",
        "plaid_secret",
        "private_key",
        "refresh_token",
        "routing_number",
        "secret",
        "secret_key",
        "service_role_key",
        "ssn",
        "social_security",
        "supabase_service_role_key",
        "token",
    }
)

SENSITIVE_PATTERNS: Final[tuple[re.Pattern[str], ...]] = (
    re.compile(r"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}"),
    re.compile(r"sk_live_[A-Za-z0-9]{20,}"),
    re.compile(r"pk_live_[A-Za-z0-9]{20,}"),
    re.compile(r"access-[a-z0-9-]{30,}"),
)

MASKED_VALUE: Final[str] = "[REDACTED]"

THIRD_PARTY_LOGGERS: Final[tuple[str, ...]] = (
    "uvicorn",
    "uvicorn.error",
    "uvicorn.access",
    "httpx",
    "httpcore",
    "supabase",
    "gotrue",
    "postgrest",
    "realtime",
    "storage3",
)
