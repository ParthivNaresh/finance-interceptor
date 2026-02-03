from typing import Any
from uuid import UUID

from models.plaid import AccountCreate, AccountResponse
from repositories.base import BaseRepository
from services.database import DatabaseService, get_database_service


class AccountRepository(BaseRepository[AccountResponse, AccountCreate]):
    def __init__(self, database_service: DatabaseService) -> None:
        super().__init__(database_service, "accounts")

    def get_by_plaid_item_id(self, plaid_item_id: UUID) -> list[dict[str, Any]]:
        result = self._get_table().select("*").eq("plaid_item_id", str(plaid_item_id)).execute()
        return [dict(item) for item in result.data] if result.data else []

    def get_by_account_id(self, account_id: str) -> dict[str, Any] | None:
        result = self._get_table().select("*").eq("account_id", account_id).execute()
        if not result.data:
            return None
        return dict(result.data[0])

    def create_many(self, accounts: list[AccountCreate]) -> list[dict[str, Any]]:
        if not accounts:
            return []
        data = [account.model_dump(mode="json") for account in accounts]
        result = self._get_table().insert(data).execute()
        return [dict(item) for item in result.data] if result.data else []

    def delete_by_plaid_item_id(self, plaid_item_id: UUID) -> int:
        result = self._get_table().delete().eq("plaid_item_id", str(plaid_item_id)).execute()
        return len(result.data) if result.data else 0


class AccountRepositoryContainer:
    _instance: AccountRepository | None = None

    @classmethod
    def get(cls) -> AccountRepository:
        if cls._instance is None:
            database_service = get_database_service()
            cls._instance = AccountRepository(database_service)
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_account_repository() -> AccountRepository:
    return AccountRepositoryContainer.get()
