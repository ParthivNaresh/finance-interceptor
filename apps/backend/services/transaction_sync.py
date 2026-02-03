from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import TYPE_CHECKING, Any
from uuid import UUID

from models.transaction import PlaidTransactionData, TransactionCreate, TransactionSyncResult

if TYPE_CHECKING:
    from repositories.account import AccountRepository
    from repositories.plaid_item import PlaidItemRepository
    from repositories.transaction import TransactionRepository
    from services.encryption import EncryptionService
    from services.plaid import PlaidService


class TransactionSyncError(Exception):
    def __init__(self, message: str = "Transaction sync failed") -> None:
        self.message = message
        super().__init__(self.message)


class TransactionSyncService:
    def __init__(
        self,
        plaid_service: PlaidService,
        encryption_service: EncryptionService,
        plaid_item_repo: PlaidItemRepository,
        account_repo: AccountRepository,
        transaction_repo: TransactionRepository,
    ) -> None:
        self._plaid_service = plaid_service
        self._encryption_service = encryption_service
        self._plaid_item_repo = plaid_item_repo
        self._account_repo = account_repo
        self._transaction_repo = transaction_repo

    def sync_item(self, item_id: str) -> TransactionSyncResult:
        plaid_item = self._plaid_item_repo.get_by_item_id(item_id)
        if not plaid_item:
            raise TransactionSyncError(f"Plaid item not found: {item_id}")

        return self.sync_plaid_item(UUID(plaid_item["id"]))

    def sync_plaid_item(self, plaid_item_id: UUID) -> TransactionSyncResult:
        plaid_item = self._plaid_item_repo.get_by_id(plaid_item_id)
        if not plaid_item:
            raise TransactionSyncError(f"Plaid item not found: {plaid_item_id}")

        encrypted_token = plaid_item.get("encrypted_access_token")
        if not encrypted_token:
            raise TransactionSyncError(f"No access token for plaid item: {plaid_item_id}")

        access_token = self._encryption_service.decrypt(encrypted_token)
        cursor = plaid_item.get("sync_cursor")

        accounts = self._account_repo.get_by_plaid_item_id(plaid_item_id)
        account_map = {acc["account_id"]: UUID(acc["id"]) for acc in accounts}

        total_added = 0
        total_modified = 0
        total_removed = 0
        has_more = True

        while has_more:
            added, modified, removed, new_cursor, has_more = self._plaid_service.sync_transactions(
                access_token, cursor
            )

            if added:
                self._process_added_transactions(added, account_map)
                total_added += len(added)

            if modified:
                self._process_modified_transactions(modified, account_map)
                total_modified += len(modified)

            if removed:
                self._process_removed_transactions(removed)
                total_removed += len(removed)

            cursor = new_cursor
            self._plaid_item_repo.update_sync_cursor(plaid_item_id, cursor)

        self._plaid_item_repo.update_last_sync(plaid_item_id)

        return TransactionSyncResult(
            added=total_added,
            modified=total_modified,
            removed=total_removed,
            cursor=cursor or "",
            has_more=False,
        )

    def _process_added_transactions(
        self,
        transactions: list[PlaidTransactionData],
        account_map: dict[str, UUID],
    ) -> None:
        creates = []
        for txn in transactions:
            internal_account_id = account_map.get(txn.account_id)
            if not internal_account_id:
                continue

            creates.append(self._to_transaction_create(txn, internal_account_id))

        if creates:
            self._transaction_repo.upsert_many(creates)

    def _process_modified_transactions(
        self,
        transactions: list[PlaidTransactionData],
        account_map: dict[str, UUID],
    ) -> None:
        creates = []
        for txn in transactions:
            internal_account_id = account_map.get(txn.account_id)
            if not internal_account_id:
                continue

            creates.append(self._to_transaction_create(txn, internal_account_id))

        if creates:
            self._transaction_repo.upsert_many(creates)

    def _process_removed_transactions(self, transaction_ids: list[str]) -> None:
        if transaction_ids:
            self._transaction_repo.delete_many_by_transaction_ids(transaction_ids)

    def _to_transaction_create(
        self,
        txn: PlaidTransactionData,
        account_id: UUID,
    ) -> TransactionCreate:
        location = txn.location or {}
        pfc = txn.personal_finance_category or {}

        return TransactionCreate(
            account_id=account_id,
            transaction_id=txn.transaction_id,
            amount=txn.amount,
            iso_currency_code=txn.iso_currency_code or "USD",
            date=txn.date,
            datetime=txn.datetime_field,
            authorized_date=txn.authorized_date,
            authorized_datetime=txn.authorized_datetime,
            name=txn.name,
            merchant_name=txn.merchant_name,
            payment_channel=txn.payment_channel,
            pending=txn.pending,
            pending_transaction_id=txn.pending_transaction_id,
            category_id=txn.category_id,
            category=txn.category,
            personal_finance_category_primary=pfc.get("primary"),
            personal_finance_category_detailed=pfc.get("detailed"),
            personal_finance_category_confidence=pfc.get("confidence_level"),
            location_address=location.get("address"),
            location_city=location.get("city"),
            location_region=location.get("region"),
            location_postal_code=location.get("postal_code"),
            location_country=location.get("country"),
            location_lat=Decimal(str(location["lat"])) if location.get("lat") else None,
            location_lon=Decimal(str(location["lon"])) if location.get("lon") else None,
            logo_url=txn.logo_url,
            website=txn.website,
            check_number=txn.check_number,
        )


class TransactionSyncServiceContainer:
    _instance: TransactionSyncService | None = None

    @classmethod
    def get(cls) -> TransactionSyncService:
        if cls._instance is None:
            from repositories.account import get_account_repository
            from repositories.plaid_item import get_plaid_item_repository
            from repositories.transaction import get_transaction_repository
            from services.encryption import get_encryption_service
            from services.plaid import get_plaid_service

            cls._instance = TransactionSyncService(
                plaid_service=get_plaid_service(),
                encryption_service=get_encryption_service(),
                plaid_item_repo=get_plaid_item_repository(),
                account_repo=get_account_repository(),
                transaction_repo=get_transaction_repository(),
            )
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_transaction_sync_service() -> TransactionSyncService:
    return TransactionSyncServiceContainer.get()
