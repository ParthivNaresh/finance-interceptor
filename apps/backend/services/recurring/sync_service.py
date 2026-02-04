from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from models.enums import FrequencyType, StreamStatus, StreamType
from models.recurring import AlertCreate, RecurringStreamCreate, RecurringSyncResult
from services.plaid import PlaidRecurringStream

if TYPE_CHECKING:
    from repositories.account import AccountRepository
    from repositories.alert import AlertRepository
    from repositories.plaid_item import PlaidItemRepository
    from repositories.recurring_stream import RecurringStreamRepository
    from services.encryption import EncryptionService
    from services.plaid import PlaidService
    from services.recurring.alert_detection import AlertDetectionService


class RecurringSyncError(Exception):
    def __init__(self, message: str = "Recurring sync failed") -> None:
        self.message = message
        super().__init__(self.message)


class RecurringSyncService:
    def __init__(
        self,
        plaid_service: PlaidService,
        encryption_service: EncryptionService,
        plaid_item_repo: PlaidItemRepository,
        account_repo: AccountRepository,
        recurring_stream_repo: RecurringStreamRepository,
        alert_repo: AlertRepository,
        alert_detection_service: AlertDetectionService,
    ) -> None:
        self._plaid_service = plaid_service
        self._encryption_service = encryption_service
        self._plaid_item_repo = plaid_item_repo
        self._account_repo = account_repo
        self._recurring_stream_repo = recurring_stream_repo
        self._alert_repo = alert_repo
        self._alert_detection_service = alert_detection_service

    def sync_for_plaid_item(self, plaid_item_id: UUID) -> RecurringSyncResult:
        plaid_item = self._plaid_item_repo.get_by_id(plaid_item_id)
        if not plaid_item:
            raise RecurringSyncError(f"Plaid item not found: {plaid_item_id}")

        user_id = UUID(plaid_item["user_id"])
        access_token = self._encryption_service.decrypt(plaid_item["encrypted_access_token"])

        accounts = self._account_repo.get_by_plaid_item_id(plaid_item_id)
        account_id_map = {acc["account_id"]: UUID(acc["id"]) for acc in accounts}

        response = self._plaid_service.get_recurring_transactions(access_token)

        streams_created = 0
        streams_updated = 0
        alerts_created = 0
        active_stream_ids: set[str] = set()
        all_alerts: list[AlertCreate] = []

        for stream in response.inflow_streams:
            result = self._process_stream(
                stream=stream,
                stream_type=StreamType.INFLOW,
                user_id=user_id,
                plaid_item_id=plaid_item_id,
                account_id_map=account_id_map,
            )
            active_stream_ids.add(stream.stream_id)
            if result["created"]:
                streams_created += 1
            else:
                streams_updated += 1
            all_alerts.extend(result["alerts"])

        for stream in response.outflow_streams:
            result = self._process_stream(
                stream=stream,
                stream_type=StreamType.OUTFLOW,
                user_id=user_id,
                plaid_item_id=plaid_item_id,
                account_id_map=account_id_map,
            )
            active_stream_ids.add(stream.stream_id)
            if result["created"]:
                streams_created += 1
            else:
                streams_updated += 1
            all_alerts.extend(result["alerts"])

        deactivated = self._recurring_stream_repo.deactivate_missing(
            plaid_item_id, active_stream_ids
        )

        for deactivated_stream in deactivated:
            stream_id = UUID(deactivated_stream["id"])
            cancelled_alert = AlertCreate(
                user_id=user_id,
                recurring_stream_id=stream_id,
                alert_type="cancelled_subscription",
                severity="medium",
                title="Subscription may have ended",
                message=f"We haven't seen a charge from {deactivated_stream.get('merchant_name') or deactivated_stream.get('description', 'Unknown')} recently.",
                data={
                    "merchant_name": deactivated_stream.get("merchant_name"),
                    "last_date": str(deactivated_stream.get("last_date")),
                },
            )
            all_alerts.append(cancelled_alert)

        for alert in all_alerts:
            self._alert_repo.create(alert)
            alerts_created += 1

        return RecurringSyncResult(
            streams_synced=streams_created + streams_updated,
            streams_created=streams_created,
            streams_updated=streams_updated,
            streams_deactivated=len(deactivated),
            alerts_created=alerts_created,
        )

    def _process_stream(
        self,
        stream: PlaidRecurringStream,
        stream_type: StreamType,
        user_id: UUID,
        plaid_item_id: UUID,
        account_id_map: dict[str, UUID],
    ) -> dict:
        account_id = account_id_map.get(stream.account_id)
        if not account_id:
            return {"created": False, "alerts": []}

        existing = self._recurring_stream_repo.get_by_stream_id(plaid_item_id, stream.stream_id)

        stream_data = RecurringStreamCreate(
            user_id=user_id,
            plaid_item_id=plaid_item_id,
            account_id=account_id,
            stream_id=stream.stream_id,
            stream_type=stream_type,
            description=stream.description,
            merchant_name=stream.merchant_name,
            category_primary=stream.category_primary,
            category_detailed=stream.category_detailed,
            frequency=FrequencyType.from_plaid(stream.frequency),
            first_date=stream.first_date,
            last_date=stream.last_date,
            predicted_next_date=stream.predicted_next_date,
            average_amount=stream.average_amount,
            last_amount=stream.last_amount,
            iso_currency_code=stream.iso_currency_code,
            is_active=stream.is_active,
            status=StreamStatus.from_plaid(stream.status),
            is_user_modified=stream.is_user_modified,
            transaction_ids=stream.transaction_ids,
            plaid_raw=stream.raw_data,
        )

        result = self._recurring_stream_repo.upsert(stream_data)
        stream_uuid = UUID(result["id"])

        alerts = self._alert_detection_service.detect_alerts(
            user_id=user_id,
            existing=existing,
            updated=stream,
            stream_id=stream_uuid,
        )

        return {
            "created": existing is None,
            "alerts": alerts,
        }

    def sync_all_for_user(self, user_id: UUID) -> list[RecurringSyncResult]:
        plaid_items = self._plaid_item_repo.get_by_user_id(user_id)
        results = []

        for item in plaid_items:
            if item.get("status") != "active":
                continue

            try:
                result = self.sync_for_plaid_item(UUID(item["id"]))
                results.append(result)
            except RecurringSyncError:
                continue

        return results


class RecurringSyncServiceContainer:
    _instance: RecurringSyncService | None = None

    @classmethod
    def get(cls) -> RecurringSyncService:
        if cls._instance is None:
            from repositories.account import get_account_repository
            from repositories.alert import get_alert_repository
            from repositories.plaid_item import get_plaid_item_repository
            from repositories.recurring_stream import get_recurring_stream_repository
            from services.encryption import get_encryption_service
            from services.plaid import get_plaid_service
            from services.recurring.alert_detection import get_alert_detection_service

            cls._instance = RecurringSyncService(
                plaid_service=get_plaid_service(),
                encryption_service=get_encryption_service(),
                plaid_item_repo=get_plaid_item_repository(),
                account_repo=get_account_repository(),
                recurring_stream_repo=get_recurring_stream_repository(),
                alert_repo=get_alert_repository(),
                alert_detection_service=get_alert_detection_service(),
            )
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_recurring_sync_service() -> RecurringSyncService:
    return RecurringSyncServiceContainer.get()
