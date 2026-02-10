from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from errors import UnauthorizedError
from models.auth import AuthenticatedUser
from services.auth import AuthService, get_auth_service

_bearer_scheme = HTTPBearer(auto_error=False)

BearerToken = Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)]
AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]


def get_current_user(
    credentials: BearerToken,
    auth_service: AuthServiceDep,
) -> AuthenticatedUser:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return auth_service.validate_token(credentials.credentials)


def get_optional_user(
    credentials: BearerToken,
    auth_service: AuthServiceDep,
) -> AuthenticatedUser | None:
    if credentials is None:
        return None

    try:
        return auth_service.validate_token(credentials.credentials)
    except UnauthorizedError:
        return None
