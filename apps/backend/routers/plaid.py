import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from models import (
    ExchangeTokenRequest,
    ExchangeTokenResponse,
    LinkTokenResponse,
)
from services.plaid import PlaidService, get_plaid_service

router = APIRouter()

PlaidServiceDep = Annotated[PlaidService, Depends(get_plaid_service)]


@router.post(
    "/link-token",
    response_model=LinkTokenResponse,
    summary="Create a Plaid Link token",
    description="Creates a link token for initializing Plaid Link in the mobile app",
)
async def create_link_token(plaid_service: PlaidServiceDep) -> LinkTokenResponse:
    try:
        user_id = str(uuid.uuid4())
        result = plaid_service.create_link_token(user_id)
        return LinkTokenResponse(
            link_token=result["link_token"],
            expiration=result["expiration"],
            request_id=result["request_id"],
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        ) from e


@router.post(
    "/exchange-token",
    response_model=ExchangeTokenResponse,
    summary="Exchange a public token for an access token",
    description="Exchanges the public token from Plaid Link for a permanent access token",
)
async def exchange_public_token(
    request: ExchangeTokenRequest,
    plaid_service: PlaidServiceDep,
) -> ExchangeTokenResponse:
    try:
        result = plaid_service.exchange_public_token(request.public_token)
        return ExchangeTokenResponse(item_id=result["item_id"])
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
