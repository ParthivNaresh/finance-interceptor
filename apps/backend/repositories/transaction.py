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
