from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING, Any
from uuid import UUID

from models.enums import AlertSeverity, AlertType, StreamStatus
from models.recurring import AlertCreate
from services.plaid import PlaidRecurringStream
from services.recurring.price_sensitivity import (
    calculate_change_percentage,
    get_threshold_for_category,
)

if TYPE_CHECKING:
    from repositories.alert import AlertRepository


class AlertDetectionService:
    def __init__(self, alert_repo: AlertRepository) -> None:
        self._alert_repo = alert_repo

    def detect_alerts(
        self,
        user_id: UUID,
        existing: dict[str, Any] | None,
        updated: PlaidRecurringStream,
        stream_id: UUID | None = None,
    ) -> list[AlertCreate]:
        alerts: list[AlertCreate] = []

        if existing is None:
            if updated.status.upper() == "EARLY_DETECTION":
                alert = self._create_new_subscription_alert(user_id, updated, stream_id)
                if alert:
                    alerts.append(alert)
            return alerts

        existing_status = StreamStatus(existing.get("status", "mature"))
        updated_status_str = updated.status.upper()

        if existing_status == StreamStatus.MATURE:
            price_alert = self._detect_price_change(user_id, existing, updated, stream_id)
            if price_alert:
                alerts.append(price_alert)

        is_becoming_inactive = updated_status_str == "TOMBSTONED" or not updated.is_active
        was_active = existing.get("is_active", True)

        if existing_status != StreamStatus.TOMBSTONED and is_becoming_inactive and was_active:
            cancelled_alert = self._create_cancelled_alert(user_id, existing, stream_id)
            if cancelled_alert:
                alerts.append(cancelled_alert)

        return alerts

    def _detect_price_change(
        self,
        user_id: UUID,
        existing: dict[str, Any],
        updated: PlaidRecurringStream,
        stream_id: UUID | None,
    ) -> AlertCreate | None:
        previous_str = existing.get("last_amount")
        if previous_str is None:
            return None

        previous = Decimal(str(previous_str))
        current = updated.last_amount

        if previous == current:
            return None

        category_primary = existing.get("category_primary")
        threshold = get_threshold_for_category(category_primary)
        change_percentage = calculate_change_percentage(previous, current)

        if abs(change_percentage) < threshold * Decimal("100"):
            return None

        if stream_id:
            alert_type = (
                AlertType.PRICE_INCREASE if change_percentage > 0 else AlertType.PRICE_DECREASE
            )
            if self._alert_repo.exists_for_stream_and_type(stream_id, alert_type, since_hours=168):
                return None

        severity = self._determine_severity(change_percentage)
        alert_type = AlertType.PRICE_INCREASE if change_percentage > 0 else AlertType.PRICE_DECREASE
        merchant = existing.get("merchant_name") or existing.get("description", "Unknown")
        change_amount = current - previous

        direction = "increased" if change_percentage > 0 else "decreased"
        title = f"{merchant} price {direction}"
        message = self._format_price_change_message(merchant, previous, current, change_percentage)

        return AlertCreate(
            user_id=user_id,
            recurring_stream_id=stream_id,
            alert_type=alert_type,
            severity=severity,
            title=title,
            message=message,
            data={
                "previous_amount": str(previous),
                "new_amount": str(current),
                "change_amount": str(change_amount),
                "change_percentage": str(change_percentage),
                "category": category_primary,
                "merchant_name": merchant,
            },
        )

    def _create_new_subscription_alert(
        self,
        user_id: UUID,
        stream: PlaidRecurringStream,
        stream_id: UUID | None,
    ) -> AlertCreate | None:
        if stream_id and self._alert_repo.exists_for_stream_and_type(
            stream_id, AlertType.NEW_SUBSCRIPTION, since_hours=168
        ):
            return None

        merchant = stream.merchant_name or stream.description
        frequency = stream.frequency.lower().replace("_", " ")

        message = (
            f"I noticed a new {frequency} charge for '{merchant}' "
            f"of ${stream.last_amount:.2f}. Should I add this to your watch list?"
        )

        return AlertCreate(
            user_id=user_id,
            recurring_stream_id=stream_id,
            alert_type=AlertType.NEW_SUBSCRIPTION,
            severity=AlertSeverity.LOW,
            title="New recurring charge detected",
            message=message,
            data={
                "merchant_name": merchant,
                "description": stream.description,
                "amount": str(stream.last_amount),
                "frequency": stream.frequency,
                "first_date": str(stream.first_date),
            },
        )

    def _create_cancelled_alert(
        self,
        user_id: UUID,
        existing: dict[str, Any],
        stream_id: UUID | None,
    ) -> AlertCreate | None:
        if stream_id and self._alert_repo.exists_for_stream_and_type(
            stream_id, AlertType.CANCELLED_SUBSCRIPTION, since_hours=168
        ):
            return None

        merchant = existing.get("merchant_name") or existing.get("description", "Unknown")
        last_date = existing.get("last_date", "unknown")
        predicted_next = existing.get("predicted_next_date")

        message = (
            f"We haven't seen a charge from {merchant} since {last_date}. "
            "Did you mean to cancel this?"
        )

        return AlertCreate(
            user_id=user_id,
            recurring_stream_id=stream_id,
            alert_type=AlertType.CANCELLED_SUBSCRIPTION,
            severity=AlertSeverity.MEDIUM,
            title="Subscription may have ended",
            message=message,
            data={
                "merchant_name": merchant,
                "last_date": str(last_date),
                "expected_date": str(predicted_next) if predicted_next else None,
            },
        )

    def _determine_severity(self, change_percentage: Decimal) -> AlertSeverity:
        abs_change = abs(change_percentage)
        if abs_change >= Decimal("20"):
            return AlertSeverity.HIGH
        if abs_change >= Decimal("10"):
            return AlertSeverity.MEDIUM
        return AlertSeverity.LOW

    def _format_price_change_message(
        self,
        merchant: str,
        previous: Decimal,
        current: Decimal,
        change_percentage: Decimal,
    ) -> str:
        direction = "increased" if change_percentage > 0 else "decreased"
        abs_percentage = abs(change_percentage)

        return (
            f"{merchant} has {direction} from ${previous:.2f} to ${current:.2f} "
            f"({abs_percentage:.1f}% change)."
        )


class AlertDetectionServiceContainer:
    _instance: AlertDetectionService | None = None

    @classmethod
    def get(cls) -> AlertDetectionService:
        if cls._instance is None:
            from repositories.alert import get_alert_repository

            alert_repo = get_alert_repository()
            cls._instance = AlertDetectionService(alert_repo)
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_alert_detection_service() -> AlertDetectionService:
    return AlertDetectionServiceContainer.get()
