from __future__ import annotations

from typing import Any, Literal
from uuid import UUID

from ...client import TestClient, get_test_client
from ...context import CreatedAlert, TestContext


AlertType = Literal[
    "price_increase",
    "price_decrease",
    "new_subscription",
    "cancelled_subscription",
    "missed_payment",
]
AlertSeverity = Literal["low", "medium", "high"]
AlertStatus = Literal["unread", "read", "dismissed", "actioned"]


def create_alert(
    context: TestContext,
    alert_type: AlertType,
    title: str,
    message: str,
    severity: AlertSeverity = "medium",
    status: AlertStatus = "unread",
    recurring_stream_id: UUID | None = None,
    data: dict[str, Any] | None = None,
    client: TestClient | None = None,
) -> TestContext:
    if context.user is None:
        raise ValueError("Context must have a user")

    db = client or get_test_client()

    db_data: dict[str, Any] = {
        "user_id": str(context.user_id),
        "alert_type": alert_type,
        "severity": severity,
        "title": title,
        "message": message,
        "status": status,
    }

    if recurring_stream_id:
        db_data["recurring_stream_id"] = str(recurring_stream_id)

    if data:
        db_data["data"] = data

    result = db.insert("alerts", db_data)

    created_alert = CreatedAlert(
        id=UUID(result["id"]),
        user_id=context.user_id,
        alert_type=alert_type,
        severity=severity,
        title=title,
    )

    context.add_alert(created_alert)

    return context


def create_price_increase_alert(
    context: TestContext,
    merchant_name: str,
    old_amount: float,
    new_amount: float,
    recurring_stream_id: UUID | None = None,
    severity: AlertSeverity = "medium",
    client: TestClient | None = None,
) -> TestContext:
    percentage_change = ((new_amount - old_amount) / old_amount) * 100

    return create_alert(
        context=context,
        alert_type="price_increase",
        title=f"{merchant_name} price increased",
        message=f"Your {merchant_name} subscription increased from ${old_amount:.2f} to ${new_amount:.2f} ({percentage_change:.1f}% increase)",
        severity=severity,
        recurring_stream_id=recurring_stream_id,
        data={
            "merchant_name": merchant_name,
            "old_amount": old_amount,
            "new_amount": new_amount,
            "percentage_change": percentage_change,
        },
        client=client,
    )


def create_new_subscription_alert(
    context: TestContext,
    merchant_name: str,
    amount: float,
    frequency: str = "monthly",
    recurring_stream_id: UUID | None = None,
    client: TestClient | None = None,
) -> TestContext:
    return create_alert(
        context=context,
        alert_type="new_subscription",
        title=f"New subscription detected: {merchant_name}",
        message=f"We detected a new {frequency} subscription to {merchant_name} for ${amount:.2f}",
        severity="low",
        recurring_stream_id=recurring_stream_id,
        data={
            "merchant_name": merchant_name,
            "amount": amount,
            "frequency": frequency,
        },
        client=client,
    )
