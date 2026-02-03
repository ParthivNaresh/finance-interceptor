from typing import Any, Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel

from services.database import DatabaseService

T = TypeVar("T", bound=BaseModel)
CreateT = TypeVar("CreateT", bound=BaseModel)


class BaseRepository(Generic[T, CreateT]):
    def __init__(self, database_service: DatabaseService, table_name: str) -> None:
        self._db = database_service
        self._table_name = table_name

    def _get_table(self) -> Any:
        return self._db.service_client.table(self._table_name)

    def create(self, data: CreateT) -> dict[str, Any]:
        result = self._get_table().insert(data.model_dump(mode="json")).execute()
        if not result.data:
            raise ValueError(f"Failed to create {self._table_name} record")
        return dict(result.data[0])

    def get_by_id(self, record_id: UUID) -> dict[str, Any] | None:
        result = self._get_table().select("*").eq("id", str(record_id)).execute()
        if not result.data:
            return None
        return dict(result.data[0])

    def delete_by_id(self, record_id: UUID) -> bool:
        result = self._get_table().delete().eq("id", str(record_id)).execute()
        return bool(result.data)
