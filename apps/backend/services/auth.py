from uuid import UUID

from models.auth import AuthenticatedUser
from services.database import DatabaseService, get_database_service


class AuthenticationError(Exception):
    def __init__(self, message: str = "Authentication failed") -> None:
        self.message = message
        super().__init__(self.message)


class AuthService:
    def __init__(self, database_service: DatabaseService) -> None:
        self._db = database_service

    def validate_token(self, token: str) -> AuthenticatedUser:
        try:
            response = self._db.service_client.auth.get_user(token)
            user = response.user

            if user is None:
                raise AuthenticationError("Invalid token: no user found")

            return AuthenticatedUser(
                id=UUID(user.id),
                email=user.email,
                role=user.role or "authenticated",
            )
        except AuthenticationError:
            raise
        except Exception as e:
            error_message = str(e)
            if "Invalid" in error_message or "expired" in error_message.lower():
                raise AuthenticationError(f"Invalid token: {error_message}") from e
            raise AuthenticationError(f"Token validation failed: {error_message}") from e


class AuthServiceContainer:
    _instance: AuthService | None = None

    @classmethod
    def get(cls) -> AuthService:
        if cls._instance is None:
            database_service = get_database_service()
            cls._instance = AuthService(database_service)
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def get_auth_service() -> AuthService:
    return AuthServiceContainer.get()
