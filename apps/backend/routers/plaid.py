from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from middleware.auth import get_current_user
from models.auth import AuthenticatedUser
from models.plaid import (
    AccountCreate,
    AccountResponse,
    ExchangeTokenRequest,
    ExchangeTokenResponse,
    LinkTokenResponse,
    PlaidItemCreate,
    PlaidItemResponse,
)
from repositories.account import AccountRepository, get_account_repository
from repositories.plaid_item import PlaidItemRepository, get_plaid_item_repository
from services.encryption import EncryptionService, get_encryption_service
from services.plaid import PlaidService, get_plaid_service

router = APIRouter()

PlaidServiceDep = Annotated[PlaidService, Depends(get_plaid_service)]
EncryptionServiceDep = Annotated[EncryptionService, Depends(get_encryption_service)]
PlaidItemRepoDep = Annotated[PlaidItemRepository, Depends(get_plaid_item_repository)]
AccountRepoDep = Annotated[AccountRepository, Depends(get_account_repository)]
CurrentUserDep = Annotated[AuthenticatedUser, Depends(get_current_user)]


@router.post(
    "/link-token",
    response_model=LinkTokenResponse,
    summary="Create a Plaid Link token",
    description="Creates a link token for initializing Plaid Link in the mobile app",
)
async def create_link_token(
    current_user: CurrentUserDep,
    plaid_service: PlaidServiceDep,
) -> LinkTokenResponse:
    try:
        result = plaid_service.create_link_token(str(current_user.id))
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
    description="Exchanges the public token from Plaid Link, stores credentials securely, and returns connected accounts",
)
async def exchange_public_token(
    request: ExchangeTokenRequest,
    current_user: CurrentUserDep,
    plaid_service: PlaidServiceDep,
    encryption_service: EncryptionServiceDep,
    plaid_item_repo: PlaidItemRepoDep,
    account_repo: AccountRepoDep,
) -> ExchangeTokenResponse:
    try:
        exchange_result = plaid_service.exchange_public_token(request.public_token)
        access_token = exchange_result["access_token"]
        item_id = exchange_result["item_id"]

        existing_item = plaid_item_repo.get_by_item_id(item_id)

        if existing_item:
            if existing_item["user_id"] != str(current_user.id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This bank account is already connected to another user",
                )

            plaid_item_id = UUID(existing_item["id"])

            encrypted_token = encryption_service.encrypt(access_token)
            plaid_item_repo.update_access_token(plaid_item_id, encrypted_token)
            plaid_item_repo.update_status(plaid_item_id, "active")

            plaid_accounts = plaid_service.get_accounts(access_token)
            _sync_accounts(account_repo, plaid_item_id, plaid_accounts)

            updated_accounts = account_repo.get_by_plaid_item_id(plaid_item_id)
            account_responses = [
                AccountResponse(
                    id=UUID(acc["id"]),
                    account_id=acc["account_id"],
                    name=acc["name"],
                    official_name=acc.get("official_name"),
                    type=acc["type"],
                    subtype=acc.get("subtype"),
                    mask=acc.get("mask"),
                    current_balance=acc.get("current_balance"),
                    available_balance=acc.get("available_balance"),
                    iso_currency_code=acc.get("iso_currency_code", "USD"),
                )
                for acc in updated_accounts
            ]

            item_info = plaid_service.get_item(access_token)

            plaid_item_response = PlaidItemResponse(
                id=plaid_item_id,
                item_id=item_id,
                institution_id=item_info.get("institution_id"),
                institution_name=existing_item.get("institution_name"),
                status="active",
                accounts=account_responses,
            )

            return ExchangeTokenResponse(
                item_id=item_id,
                plaid_item=plaid_item_response,
                status="success",
            )

        item_info = plaid_service.get_item(access_token)
        encrypted_token = encryption_service.encrypt(access_token)

        plaid_item_data = PlaidItemCreate(
            user_id=current_user.id,
            item_id=item_id,
            institution_id=item_info.get("institution_id"),
            institution_name=None,
            encrypted_access_token=encrypted_token,
        )
        created_item = plaid_item_repo.create(plaid_item_data)
        plaid_item_id = UUID(created_item["id"])

        plaid_accounts = plaid_service.get_accounts(access_token)

        account_creates = [
            AccountCreate(
                plaid_item_id=plaid_item_id,
                account_id=acc["account_id"],
                name=acc["name"],
                official_name=acc["official_name"],
                type=acc["type"],
                subtype=acc["subtype"],
                mask=acc["mask"],
                current_balance=acc["current_balance"],
                available_balance=acc["available_balance"],
                iso_currency_code=acc["iso_currency_code"],
            )
            for acc in plaid_accounts
        ]
        created_accounts = account_repo.create_many(account_creates)

        account_responses = [
            AccountResponse(
                id=UUID(acc["id"]),
                account_id=acc["account_id"],
                name=acc["name"],
                official_name=acc.get("official_name"),
                type=acc["type"],
                subtype=acc.get("subtype"),
                mask=acc.get("mask"),
                current_balance=acc.get("current_balance"),
                available_balance=acc.get("available_balance"),
                iso_currency_code=acc.get("iso_currency_code", "USD"),
            )
            for acc in created_accounts
        ]

        plaid_item_response = PlaidItemResponse(
            id=plaid_item_id,
            item_id=item_id,
            institution_id=item_info.get("institution_id"),
            institution_name=None,
            status="active",
            accounts=account_responses,
        )

        return ExchangeTokenResponse(
            item_id=item_id,
            plaid_item=plaid_item_response,
            status="success",
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e


def _sync_accounts(
    account_repo: AccountRepository,
    plaid_item_id: UUID,
    plaid_accounts: list[dict],
) -> None:
    existing_accounts = account_repo.get_by_plaid_item_id(plaid_item_id)
    existing_account_ids = {acc["account_id"] for acc in existing_accounts}
    plaid_account_ids = {acc["account_id"] for acc in plaid_accounts}

    accounts_to_create = [
        AccountCreate(
            plaid_item_id=plaid_item_id,
            account_id=acc["account_id"],
            name=acc["name"],
            official_name=acc["official_name"],
            type=acc["type"],
            subtype=acc["subtype"],
            mask=acc["mask"],
            current_balance=acc["current_balance"],
            available_balance=acc["available_balance"],
            iso_currency_code=acc["iso_currency_code"],
        )
        for acc in plaid_accounts
        if acc["account_id"] not in existing_account_ids
    ]

    if accounts_to_create:
        account_repo.create_many(accounts_to_create)

    for acc in plaid_accounts:
        if acc["account_id"] in existing_account_ids:
            existing = next(e for e in existing_accounts if e["account_id"] == acc["account_id"])
            account_repo.update_balance(
                UUID(existing["id"]),
                acc["current_balance"],
                acc["available_balance"],
            )

    accounts_to_deactivate = existing_account_ids - plaid_account_ids
    for existing in existing_accounts:
        if existing["account_id"] in accounts_to_deactivate:
            account_repo.deactivate(UUID(existing["id"]))
