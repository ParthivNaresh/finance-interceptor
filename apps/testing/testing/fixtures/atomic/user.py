from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from ...client import TestClient, generate_test_email, get_test_client
from ...context import CreatedUser, TestContext


def create_user(
    context: TestContext | None = None,
    email: str | None = None,
    display_name: str | None = None,
    timezone_str: str = "America/New_York",
    client: TestClient | None = None,
) -> TestContext:
    ctx = context or TestContext()
    db = client or get_test_client()

    final_email = email or generate_test_email("user")
    final_display_name = display_name or f"Test User {final_email.split('@')[0]}"

    auth_user = db.create_auth_user(final_email)
    user_id = UUID(auth_user["id"])

    existing_user = db.select_one("users", filters={"id": str(user_id)})

    if existing_user:
        db.supabase.table("users").update(
            {
                "display_name": final_display_name,
                "timezone": timezone_str,
            }
        ).eq("id", str(user_id)).execute()
    else:
        db.insert(
            "users",
            {
                "id": str(user_id),
                "email": final_email,
                "display_name": final_display_name,
                "timezone": timezone_str,
            },
        )

    created_at_str = auth_user.get("created_at")
    if created_at_str:
        if isinstance(created_at_str, str):
            created_at = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
        else:
            created_at = created_at_str
    else:
        created_at = datetime.now(timezone.utc)

    ctx.user = CreatedUser(
        id=user_id,
        email=final_email,
        display_name=final_display_name,
        created_at=created_at,
    )

    def cleanup_user() -> None:
        db.delete_auth_user(user_id)

    ctx.register_cleanup(priority=0, callback=cleanup_user)

    return ctx
