from typing import Any

from supabase import Client, create_client

from config import Settings, get_settings


class DatabaseService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client: Client | None = None
        self._service_client: Client | None = None

    @property
    def client(self) -> Client:
        if self._client is None:
            self._client = create_client(
                self._settings.supabase_url,
                self._settings.supabase_anon_key,
            )
        return self._client

    @property
    def service_client(self) -> Client:
        if self._service_client is None:
            self._service_client = create_client(
                self._settings.supabase_url,
                self._settings.supabase_service_role_key,
            )
        return self._service_client

    def with_user_token(self, access_token: str) -> Client:
        return create_client(
            self._settings.supabase_url,
            self._settings.supabase_anon_key,
            options={"headers": {"Authorization": f"Bearer {access_token}"}},
        )

    def table(self, name: str) -> Any:
        return self.service_client.table(name)


class DatabaseServiceContainer:
    _instance: DatabaseService | None = None

    @classmethod
    def get(cls) -> DatabaseService:
        if cls._instance is None:
            settings = get_settings()
            cls._instance = DatabaseService(settings)
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_database_service() -> DatabaseService:
    return DatabaseServiceContainer.get()
