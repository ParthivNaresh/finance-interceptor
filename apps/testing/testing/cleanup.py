from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from .client import TestClient, get_test_client, is_test_email

if TYPE_CHECKING:
    from .context import TestContext


CLEANUP_ORDER = [
    "lifestyle_creep_scores",
    "lifestyle_baselines",
    "transaction_anomalies",
    "income_sources",
    "cash_flow_metrics",
    "merchant_stats",
    "merchant_spending",
    "category_spending",
    "spending_periods",
    "analytics_computation_log",
    "alerts",
    "recurring_streams",
    "transactions",
    "accounts",
    "webhook_events",
    "sync_jobs",
    "plaid_items",
    "notification_preferences",
    "push_tokens",
    "agent_decisions",
    "user_agent_permissions",
    "users",
]


def cleanup_test_user(user_id: UUID, delete_auth: bool = True) -> CleanupResult:
    client = get_test_client()
    result = CleanupResult(user_id=user_id)

    if delete_auth:
        try:
            client.delete_auth_user(user_id)
            result.auth_deleted = True
            result.tables_cleaned["auth.users"] = 1
        except Exception as e:
            result.errors.append(f"auth.users: {e}")
            _fallback_cleanup(client, user_id, result)
    else:
        _fallback_cleanup(client, user_id, result)

    return result


def _fallback_cleanup(client: TestClient, user_id: UUID, result: CleanupResult) -> None:
    for table in CLEANUP_ORDER:
        if table == "users":
            continue

        try:
            deleted = client.delete(table, {"user_id": str(user_id)})
            result.tables_cleaned[table] = deleted
        except Exception as e:
            result.errors.append(f"{table}: {e}")

    try:
        deleted = client.delete("users", {"id": str(user_id)})
        result.tables_cleaned["users"] = deleted
    except Exception as e:
        result.errors.append(f"users: {e}")


def cleanup_context(context: TestContext) -> CleanupResult:
    if context.user is None:
        return CleanupResult(user_id=UUID("00000000-0000-0000-0000-000000000000"))

    for callback in context.get_cleanup_callbacks():
        try:
            callback()
        except Exception:
            pass

    return cleanup_test_user(context.user.id)


def cleanup_all_test_users() -> list[CleanupResult]:
    client = get_test_client()
    results: list[CleanupResult] = []

    test_users = client.list_test_users()

    for user in test_users:
        user_id = UUID(user["id"])
        result = cleanup_test_user(user_id)
        results.append(result)

    return results


def cleanup_stale_test_data(max_age_hours: int = 24) -> list[CleanupResult]:
    from datetime import datetime, timedelta, timezone

    client = get_test_client()
    results: list[CleanupResult] = []

    cutoff = datetime.now(timezone.utc) - timedelta(hours=max_age_hours)
    cutoff_str = cutoff.isoformat()

    test_users = client.list_test_users()

    for user in test_users:
        created_at = user.get("created_at")
        if created_at and created_at < cutoff_str:
            user_id = UUID(user["id"])
            result = cleanup_test_user(user_id)
            results.append(result)

    return results


class CleanupResult:
    def __init__(self, user_id: UUID) -> None:
        self.user_id = user_id
        self.tables_cleaned: dict[str, int] = {}
        self.auth_deleted: bool = False
        self.errors: list[str] = []

    @property
    def success(self) -> bool:
        return len(self.errors) == 0

    @property
    def total_rows_deleted(self) -> int:
        return sum(self.tables_cleaned.values())

    def __repr__(self) -> str:
        status = "success" if self.success else f"failed ({len(self.errors)} errors)"
        return f"CleanupResult(user_id={self.user_id}, rows={self.total_rows_deleted}, {status})"
