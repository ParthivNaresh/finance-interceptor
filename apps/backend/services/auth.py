from __future__ import annotations

from uuid import UUID

from errors import UnauthorizedError
from models.auth import AuthenticatedUser
from observability import bind_context, get_logger
from services.cache.auth_cache import AuthCache, get_auth_cache
from services.database import DatabaseService, get_database_service

logger = get_logger("services.auth")


class AuthService:
    def __init__(
        self,
        database_service: DatabaseService,
        auth_cache: AuthCache,
    ) -> None:
        self._db = database_service
        self._cache = auth_cache

    def validate_token(self, token: str) -> AuthenticatedUser:
        cached_user = self._cache.get(token)
        if cached_user is not None:
            bind_context(user_id=str(cached_user.id))
            return cached_user

        try:
            response = self._db.service_client.auth.get_user(token)

            if response is None or response.user is None:
                logger.warning("auth.token_invalid", reason="no_user_found")
                raise UnauthorizedError(message="Invalid or expired token")

            user = response.user

            authenticated_user = AuthenticatedUser(
                id=UUID(user.id),
                email=user.email,
                role=user.role or "authenticated",
            )

            bind_context(user_id=str(authenticated_user.id))

            logger.debug(
                "auth.token_validated",
                user_id=str(authenticated_user.id),
            )

            self._cache.set(token, authenticated_user)

            return authenticated_user
        except UnauthorizedError:
            raise
        except Exception as e:
            error_message = str(e)
            if "Invalid" in error_message or "expired" in error_message.lower():
                logger.warning(
                    "auth.token_invalid",
                    reason="invalid_or_expired",
                )
                raise UnauthorizedError(message="Invalid or expired token") from e

            logger.exception("auth.validation_failed")
            raise UnauthorizedError(message="Token validation failed") from e


class AuthServiceContainer:
    _instance: AuthService | None = None

    @classmethod
    def get(cls) -> AuthService:
        if cls._instance is None:
            database_service = get_database_service()
            auth_cache = get_auth_cache()
            cls._instance = AuthService(database_service, auth_cache)
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_auth_service() -> AuthService:
    return AuthServiceContainer.get()
