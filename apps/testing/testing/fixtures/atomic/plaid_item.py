from __future__ import annotations

from uuid import UUID

from ...client import TestClient, get_test_client
from ...context import CreatedPlaidItem, TestContext
from ...generators import generate_plaid_item_id


FAKE_ENCRYPTED_TOKEN = "test_encrypted_token_placeholder"


def create_plaid_item(
    context: TestContext,
    institution_name: str = "Test Bank",
    institution_id: str | None = None,
    institution_logo: str | None = None,
    status: str = "active",
    item_id: str | None = None,
    encrypted_access_token: str | None = None,
    client: TestClient | None = None,
) -> TestContext:
    if context.user is None:
        raise ValueError("Context must have a user before creating plaid_item")

    db = client or get_test_client()

    final_item_id = item_id or generate_plaid_item_id()
    final_institution_id = institution_id or f"ins_test_{final_item_id[:8]}"
    final_token = encrypted_access_token or FAKE_ENCRYPTED_TOKEN

    data = {
        "user_id": str(context.user_id),
        "item_id": final_item_id,
        "institution_id": final_institution_id,
        "institution_name": institution_name,
        "institution_logo": institution_logo,
        "encrypted_access_token": final_token,
        "status": status,
    }

    result = db.insert("plaid_items", data)

    created_item = CreatedPlaidItem(
        id=UUID(result["id"]),
        item_id=final_item_id,
        user_id=context.user_id,
        institution_name=institution_name,
    )

    context.add_plaid_item(created_item)

    return context
