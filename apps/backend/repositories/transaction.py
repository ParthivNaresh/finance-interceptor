from __future__ import annotations

from datetime import date as date_type
from typing import Any
from uuid import UUID

from models.transaction import TransactionCreate, TransactionResponse, TransactionUpdate
from repositories.base import BaseRepository
from services.database import DatabaseService, get_database_service


class TransactionRepository(BaseRepository[TransactionResponse, TransactionCreate]):
    def __init__(self, database_service: DatabaseService) -> None:
        super().__init__(database_service, "transactions")

    def get_by_transaction_id(self, transaction_id: str) -> dict[str, Any] | None:
        result = self._get_table().select("*").eq("transaction_id", transaction_id).execute()
        if not result.data:
            return None
        return dict(result.data[0])

    def get_by_account_id(
        self,
        account_id: UUID,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        result = (
            self._get_table()
            .select("*")
            .eq("account_id", str(account_id))
            .order("date", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def get_by_user_id(
        self,
        user_id: UUID,
        account_id: UUID | None = None,
        start_date: date_type | None = None,
        end_date: date_type | None = None,
        category: str | None = None,
        search: str | None = None,
        pending: bool | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[dict[str, Any]], int]:
        query = (
            self._get_table()
            .select("*, accounts!inner(plaid_item_id, plaid_items!inner(user_id))", count="exact")
            .eq("accounts.plaid_items.user_id", str(user_id))
        )

        if account_id:
            query = query.eq("account_id", str(account_id))

        if start_date:
            query = query.gte("date", start_date.isoformat())

        if end_date:
            query = query.lte("date", end_date.isoformat())

        if category:
            query = query.eq("personal_finance_category_primary", category)

        if search:
            query = query.or_(f"name.ilike.%{search}%,merchant_name.ilike.%{search}%")

        if pending is not None:
            query = query.eq("pending", pending)

        query = query.order("date", desc=True).range(offset, offset + limit - 1)

        result = query.execute()
        transactions = [dict(item) for item in result.data] if result.data else []
        total = result.count or 0

        return transactions, total

    def count_by_user_id(self, user_id: UUID) -> int:
        result = (
            self._get_table()
            .select("id", count="exact", head=True)
            .eq("accounts.plaid_items.user_id", str(user_id))
            .execute()
        )
        return result.count or 0

    def upsert(self, data: TransactionCreate) -> dict[str, Any]:
        dump = data.model_dump(mode="json", by_alias=True, exclude_none=True)
        if "datetime" in dump:
            dump["datetime"] = dump.pop("datetime")

        result = (
            self._get_table()
            .upsert(dump, on_conflict="transaction_id")
            .execute()
        )
        if not result.data:
            raise ValueError("Failed to upsert transaction")
        return dict(result.data[0])

    def upsert_many(self, transactions: list[TransactionCreate]) -> list[dict[str, Any]]:
        if not transactions:
            return []

        data = []
        for txn in transactions:
            dump = txn.model_dump(mode="json", by_alias=True, exclude_none=True)
            if "datetime" in dump:
                dump["datetime"] = dump.pop("datetime")
            data.append(dump)

        result = (
            self._get_table()
            .upsert(data, on_conflict="transaction_id")
            .execute()
        )
        return [dict(item) for item in result.data] if result.data else []

    def update_by_transaction_id(
        self,
        transaction_id: str,
        data: TransactionUpdate,
    ) -> dict[str, Any] | None:
        update_data = data.model_dump(mode="json", exclude_none=True)
        if not update_data:
            return self.get_by_transaction_id(transaction_id)

        result = (
            self._get_table()
            .update(update_data)
            .eq("transaction_id", transaction_id)
            .execute()
        )
        if not result.data:
            return None
        return dict(result.data[0])

    def delete_by_transaction_id(self, transaction_id: str) -> bool:
        result = self._get_table().delete().eq("transaction_id", transaction_id).execute()
        return bool(result.data)

    def delete_many_by_transaction_ids(self, transaction_ids: list[str]) -> int:
        if not transaction_ids:
            return 0

        result = (
            self._get_table()
            .delete()
            .in_("transaction_id", transaction_ids)
            .execute()
        )
        return len(result.data) if result.data else 0


class TransactionRepositoryContainer:
    _instance: TransactionRepository | None = None

    @classmethod
    def get(cls) -> TransactionRepository:
        if cls._instance is None:
            database_service = get_database_service()
            cls._instance = TransactionRepository(database_service)
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_transaction_repository() -> TransactionRepository:
    return TransactionRepositoryContainer.get()
