from __future__ import annotations

from decimal import Decimal
from typing import Literal
from uuid import UUID

from ...client import TestClient, get_test_client
from ...context import CreatedAccount, TestContext
from ...generators import generate_plaid_account_id


AccountType = Literal["depository", "credit", "loan", "investment", "other"]
DepositorySubtype = Literal["checking", "savings", "money market", "cd", "paypal"]
CreditSubtype = Literal["credit card", "paypal"]


def create_account(
    context: TestContext,
    account_key: str,
    name: str | None = None,
    account_type: AccountType = "depository",
    subtype: str | None = "checking",
    current_balance: Decimal = Decimal("5000.00"),
    available_balance: Decimal | None = None,
    limit_amount: Decimal | None = None,
    mask: str | None = None,
    plaid_item_id: UUID | None = None,
    account_id: str | None = None,
    client: TestClient | None = None,
) -> TestContext:
    if not context.plaid_items and plaid_item_id is None:
        raise ValueError("Context must have a plaid_item or plaid_item_id must be provided")

    db = client or get_test_client()

    final_plaid_item_id = plaid_item_id or context.primary_plaid_item_id
    final_account_id = account_id or generate_plaid_account_id()
    final_name = name or _generate_account_name(account_type, subtype)
    final_mask = mask or final_account_id[-4:]
    final_available = available_balance if available_balance is not None else current_balance

    data = {
        "plaid_item_id": str(final_plaid_item_id),
        "account_id": final_account_id,
        "name": final_name,
        "type": account_type,
        "subtype": subtype,
        "mask": final_mask,
        "current_balance": str(current_balance),
        "available_balance": str(final_available),
        "iso_currency_code": "USD",
        "is_active": True,
    }

    if limit_amount is not None:
        data["limit_amount"] = str(limit_amount)

    result = db.insert("accounts", data)

    created_account = CreatedAccount(
        id=UUID(result["id"]),
        account_id=final_account_id,
        plaid_item_id=final_plaid_item_id,
        name=final_name,
        type=account_type,
        subtype=subtype,
        current_balance=current_balance,
    )

    context.add_account(account_key, created_account)

    return context


def _generate_account_name(account_type: str, subtype: str | None) -> str:
    if subtype:
        return f"Test {subtype.title()} Account"
    return f"Test {account_type.title()} Account"


def create_checking_account(
    context: TestContext,
    balance: Decimal = Decimal("5000.00"),
    name: str = "Test Checking",
    client: TestClient | None = None,
) -> TestContext:
    return create_account(
        context=context,
        account_key="checking",
        name=name,
        account_type="depository",
        subtype="checking",
        current_balance=balance,
        client=client,
    )


def create_savings_account(
    context: TestContext,
    balance: Decimal = Decimal("10000.00"),
    name: str = "Test Savings",
    client: TestClient | None = None,
) -> TestContext:
    return create_account(
        context=context,
        account_key="savings",
        name=name,
        account_type="depository",
        subtype="savings",
        current_balance=balance,
        client=client,
    )


def create_credit_card_account(
    context: TestContext,
    balance: Decimal = Decimal("1500.00"),
    limit: Decimal = Decimal("10000.00"),
    name: str = "Test Credit Card",
    client: TestClient | None = None,
) -> TestContext:
    return create_account(
        context=context,
        account_key="credit",
        name=name,
        account_type="credit",
        subtype="credit card",
        current_balance=balance,
        limit_amount=limit,
        client=client,
    )
