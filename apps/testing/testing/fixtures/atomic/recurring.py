from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Literal
from uuid import UUID

from ...client import TestClient, get_test_client
from ...context import CreatedRecurringStream, TestContext
from ...generators import generate_plaid_stream_id


StreamType = Literal["inflow", "outflow"]
Frequency = Literal[
    "weekly", "biweekly", "semi_monthly", "monthly", "quarterly", "semi_annually", "annually"
]
StreamStatus = Literal["mature", "early_detection", "tombstoned"]


def create_recurring_stream(
    context: TestContext,
    stream_type: StreamType,
    description: str,
    average_amount: Decimal,
    frequency: Frequency = "monthly",
    merchant_name: str | None = None,
    category_primary: str | None = None,
    category_detailed: str | None = None,
    first_date: date | None = None,
    last_date: date | None = None,
    predicted_next_date: date | None = None,
    is_active: bool = True,
    status: StreamStatus = "mature",
    account_id: UUID | None = None,
    account_key: str | None = None,
    plaid_item_id: UUID | None = None,
    stream_id: str | None = None,
    transaction_ids: list[str] | None = None,
    client: TestClient | None = None,
) -> TestContext:
    if context.user is None:
        raise ValueError("Context must have a user")

    db = client or get_test_client()

    final_account_id = _resolve_account_id(context, account_id, account_key)
    final_plaid_item_id = plaid_item_id or context.primary_plaid_item_id
    final_stream_id = stream_id or generate_plaid_stream_id()

    today = date.today()
    final_first_date = first_date or _calculate_first_date(today, frequency, 6)
    final_last_date = last_date or today
    final_predicted_next = predicted_next_date or _calculate_next_date(final_last_date, frequency)

    final_category_primary = category_primary
    final_category_detailed = category_detailed

    if not final_category_primary:
        if stream_type == "inflow":
            final_category_primary = "INCOME"
            final_category_detailed = "INCOME_WAGES"
        else:
            final_category_primary = "GENERAL_SERVICES"
            final_category_detailed = "GENERAL_SERVICES_OTHER"

    data = {
        "user_id": str(context.user_id),
        "plaid_item_id": str(final_plaid_item_id),
        "account_id": str(final_account_id),
        "stream_id": final_stream_id,
        "stream_type": stream_type,
        "description": description,
        "merchant_name": merchant_name,
        "category_primary": final_category_primary,
        "category_detailed": final_category_detailed,
        "frequency": frequency,
        "first_date": final_first_date.isoformat(),
        "last_date": final_last_date.isoformat(),
        "predicted_next_date": final_predicted_next.isoformat() if final_predicted_next else None,
        "average_amount": str(average_amount),
        "last_amount": str(average_amount),
        "iso_currency_code": "USD",
        "is_active": is_active,
        "status": status,
        "is_user_modified": False,
        "transaction_ids": transaction_ids or [],
    }

    result = db.insert("recurring_streams", data)

    created_stream = CreatedRecurringStream(
        id=UUID(result["id"]),
        stream_id=final_stream_id,
        user_id=context.user_id,
        plaid_item_id=final_plaid_item_id,
        account_id=final_account_id,
        merchant_name=merchant_name,
        average_amount=average_amount,
        frequency=frequency,
    )

    context.add_recurring_stream(created_stream)

    return context


def _resolve_account_id(
    context: TestContext,
    account_id: UUID | None,
    account_key: str | None,
) -> UUID:
    if account_id:
        return account_id

    if account_key:
        return context.get_account(account_key).id

    if "checking" in context.accounts:
        return context.checking_account_id

    if context.accounts:
        first_key = next(iter(context.accounts))
        return context.accounts[first_key].id

    raise ValueError("No account available in context")


def _calculate_first_date(reference: date, frequency: Frequency, occurrences: int) -> date:
    from datetime import timedelta

    if frequency == "weekly":
        return reference - timedelta(weeks=occurrences)
    elif frequency == "biweekly":
        return reference - timedelta(weeks=occurrences * 2)
    elif frequency == "monthly" or frequency == "semi_monthly":
        return _subtract_months(reference, occurrences)
    elif frequency == "quarterly":
        return _subtract_months(reference, occurrences * 3)
    elif frequency == "semi_annually":
        return _subtract_months(reference, occurrences * 6)
    elif frequency == "annually":
        return _subtract_months(reference, occurrences * 12)
    else:
        return reference - timedelta(days=occurrences * 30)


def _calculate_next_date(last_date: date, frequency: Frequency) -> date:
    from datetime import timedelta

    if frequency == "weekly":
        return last_date + timedelta(weeks=1)
    elif frequency == "biweekly":
        return last_date + timedelta(weeks=2)
    elif frequency == "monthly":
        return _add_months(last_date, 1)
    elif frequency == "semi_monthly":
        return last_date + timedelta(days=15)
    elif frequency == "quarterly":
        return _add_months(last_date, 3)
    elif frequency == "semi_annually":
        return _add_months(last_date, 6)
    elif frequency == "annually":
        return _add_months(last_date, 12)
    else:
        return last_date + timedelta(days=30)


def _add_months(d: date, months: int) -> date:
    year = d.year
    month = d.month + months

    while month > 12:
        month -= 12
        year += 1

    day = min(d.day, _days_in_month(year, month))
    return date(year, month, day)


def _subtract_months(d: date, months: int) -> date:
    year = d.year
    month = d.month - months

    while month <= 0:
        month += 12
        year -= 1

    day = min(d.day, _days_in_month(year, month))
    return date(year, month, day)


def _days_in_month(year: int, month: int) -> int:
    if month == 12:
        next_month = date(year + 1, 1, 1)
    else:
        next_month = date(year, month + 1, 1)
    return (next_month - date(year, month, 1)).days


def create_subscription_stream(
    context: TestContext,
    merchant_name: str,
    amount: Decimal,
    frequency: Frequency = "monthly",
    category_primary: str = "ENTERTAINMENT",
    category_detailed: str = "ENTERTAINMENT_STREAMING",
    **kwargs: object,
) -> TestContext:
    return create_recurring_stream(
        context=context,
        stream_type="outflow",
        description=f"{merchant_name} Subscription",
        merchant_name=merchant_name,
        average_amount=amount,
        frequency=frequency,
        category_primary=category_primary,
        category_detailed=category_detailed,
        **kwargs,  # type: ignore[arg-type]
    )


def create_income_stream(
    context: TestContext,
    source_name: str,
    amount: Decimal,
    frequency: Frequency = "biweekly",
    **kwargs: object,
) -> TestContext:
    return create_recurring_stream(
        context=context,
        stream_type="inflow",
        description=f"Income from {source_name}",
        merchant_name=source_name,
        average_amount=amount,
        frequency=frequency,
        category_primary="INCOME",
        category_detailed="INCOME_WAGES",
        **kwargs,  # type: ignore[arg-type]
    )
