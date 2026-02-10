from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from typing import Any, cast
from uuid import UUID, uuid4

from dotenv import load_dotenv
from supabase import Client, create_client


TEST_EMAIL_PREFIX = "test_fixture_"
TEST_EMAIL_DOMAIN = "@testfixture.internal"

ALLOWED_ENVIRONMENTS = frozenset({"sandbox", "development", "test", "local"})


@dataclass
class TestClient:
    supabase: Client
    _service_role: bool = False

    def table(self, name: str) -> Any:
        return self.supabase.table(name)

    def insert(self, table: str, data: dict[str, Any]) -> dict[str, Any]:
        response = self.supabase.table(table).insert(data).execute()
        if not response.data:
            raise RuntimeError(f"Insert into {table} returned no data")
        return cast(dict[str, Any], response.data[0])

    def insert_many(self, table: str, data: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not data:
            return []
        response = self.supabase.table(table).insert(data).execute()
        return cast(list[dict[str, Any]], response.data or [])

    def upsert(
        self, table: str, data: dict[str, Any], on_conflict: str | None = None
    ) -> dict[str, Any]:
        query = self.supabase.table(table).upsert(data, on_conflict=on_conflict or "")
        response = query.execute()
        if not response.data:
            raise RuntimeError(f"Upsert into {table} returned no data")
        return cast(dict[str, Any], response.data[0])

    def select(
        self,
        table: str,
        columns: str = "*",
        filters: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        query = self.supabase.table(table).select(columns)
        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)
        response = query.execute()
        return cast(list[dict[str, Any]], response.data or [])

    def select_one(
        self,
        table: str,
        columns: str = "*",
        filters: dict[str, Any] | None = None,
    ) -> dict[str, Any] | None:
        results = self.select(table, columns, filters)
        return results[0] if results else None

    def delete(self, table: str, filters: dict[str, Any]) -> int:
        query = self.supabase.table(table).delete()
        for key, value in filters.items():
            query = query.eq(key, value)
        response = query.execute()
        return len(response.data) if response.data else 0

    def delete_by_id(self, table: str, id: UUID) -> bool:
        return self.delete(table, {"id": str(id)}) > 0

    def create_auth_user(self, email: str, password: str = "TestPassword123!") -> dict[str, Any]:
        response = self.supabase.auth.admin.create_user(
            {
                "email": email,
                "password": password,
                "email_confirm": True,
            }
        )
        return {
            "id": response.user.id,
            "email": response.user.email,
            "created_at": response.user.created_at,
        }

    def delete_auth_user(self, user_id: UUID) -> bool:
        try:
            self.supabase.auth.admin.delete_user(str(user_id))
            return True
        except Exception:
            return False

    def list_test_users(self) -> list[dict[str, Any]]:
        response = self.supabase.auth.admin.list_users()
        test_users = []
        for user in response:
            if user.email and (
                user.email.startswith(TEST_EMAIL_PREFIX)
                or user.email.endswith(TEST_EMAIL_DOMAIN)
            ):
                test_users.append(
                    {
                        "id": user.id,
                        "email": user.email,
                        "created_at": user.created_at,
                    }
                )
        return test_users

    def execute_sql(self, sql: str, params: dict[str, Any] | None = None) -> Any:
        return self.supabase.rpc("exec_sql", {"query": sql, "params": params or {}}).execute()


def _load_env() -> None:
    backend_env = os.path.join(
        os.path.dirname(__file__), "..", "..", "backend", ".env"
    )
    if os.path.exists(backend_env):
        load_dotenv(backend_env)
    else:
        load_dotenv()


def _get_current_environment() -> str:
    return os.environ.get("PLAID_ENVIRONMENT", "").lower()


def _is_safe_environment() -> bool:
    env = _get_current_environment()
    return env in ALLOWED_ENVIRONMENTS


def _assert_safe_environment() -> None:
    env = _get_current_environment()
    if not env:
        raise EnvironmentSafetyError(
            "PLAID_ENVIRONMENT is not set. "
            "Test fixtures require an explicit environment setting. "
            f"Allowed environments: {', '.join(sorted(ALLOWED_ENVIRONMENTS))}"
        )

    if env not in ALLOWED_ENVIRONMENTS:
        raise EnvironmentSafetyError(
            f"Test fixtures cannot run in '{env}' environment. "
            f"Allowed environments: {', '.join(sorted(ALLOWED_ENVIRONMENTS))}. "
            "This is a safety measure to prevent accidental data modification in production."
        )


class EnvironmentSafetyError(Exception):
    pass


@lru_cache(maxsize=1)
def get_test_client() -> TestClient:
    _load_env()
    _assert_safe_environment()

    supabase_url = os.environ.get("SUPABASE_URL")
    service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url:
        raise RuntimeError("SUPABASE_URL environment variable not set")
    if not service_role_key:
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY environment variable not set")

    client = create_client(supabase_url, service_role_key)
    return TestClient(supabase=client, _service_role=True)


def is_test_email(email: str) -> bool:
    return email.startswith(TEST_EMAIL_PREFIX) or email.endswith(TEST_EMAIL_DOMAIN)


def generate_test_email(identifier: str) -> str:
    safe_identifier = identifier.replace("@", "_").replace(".", "_")
    unique_suffix = uuid4().hex[:8]
    return f"{TEST_EMAIL_PREFIX}{safe_identifier}_{unique_suffix}{TEST_EMAIL_DOMAIN}"
