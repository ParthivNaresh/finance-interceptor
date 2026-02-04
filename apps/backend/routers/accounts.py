from decimal import Decimal
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from middleware.auth import get_current_user
from models.auth import AuthenticatedUser
from models.plaid import (
    AccountResponse,
    AccountsListResponse,
    PlaidItemWithAccountsResponse,
    SyncResponse,
)
from repositories.account import AccountRepository, get_account_repository
from repositories.plaid_item import PlaidItemRepository, get_plaid_item_repository
from services.transaction_sync import TransactionSyncService, get_transaction_sync_service

router = APIRouter()

CurrentUserDep = Annotated[AuthenticatedUser, Depends(get_current_user)]
PlaidItemRepoDep = Annotated[PlaidItemRepository, Depends(get_plaid_item_repository)]
AccountRepoDep = Annotated[AccountRepository, Depends(get_account_repository)]
TransactionSyncDep = Annotated[TransactionSyncService, Depends(get_transaction_sync_service)]

LIABILITY_ACCOUNT_TYPES = frozenset({"credit", "loan"})


def calculate_net_worth_contribution(account_type: str, balance: Decimal | None) -> Decimal:
    if balance is None:
        return Decimal("0")

    if account_type in LIABILITY_ACCOUNT_TYPES:
        return -balance

    return balance


@router.get(
    "",
    response_model=AccountsListResponse,
    summary="List all accounts",
    description="Returns all connected accounts grouped by institution",
)
async def list_accounts(
    current_user: CurrentUserDep,
    plaid_item_repo: PlaidItemRepoDep,
    account_repo: AccountRepoDep,
) -> AccountsListResponse:
    plaid_items = plaid_item_repo.get_by_user_id(current_user.id)

    items_with_accounts: list[PlaidItemWithAccountsResponse] = []
    total_balance = Decimal("0")
    account_count = 0

    for item in plaid_items:
        accounts_data = account_repo.get_by_plaid_item_id(UUID(item["id"]))

        accounts = [
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
            for acc in accounts_data
        ]

        for acc in accounts:
            balance = Decimal(str(acc.current_balance)) if acc.current_balance is not None else None
            total_balance += calculate_net_worth_contribution(acc.type, balance)
            account_count += 1

        items_with_accounts.append(
            PlaidItemWithAccountsResponse(
                id=UUID(item["id"]),
                item_id=item["item_id"],
                institution_id=item.get("institution_id"),
                institution_name=item.get("institution_name"),
                status=item["status"],
                error_code=item.get("error_code"),
                error_message=item.get("error_message"),
                last_successful_sync=item.get("last_successful_sync"),
                accounts=accounts,
            )
        )

    return AccountsListResponse(
        plaid_items=items_with_accounts,
        total_balance=total_balance,
        account_count=account_count,
    )


@router.get(
    "/{account_id}",
    response_model=AccountResponse,
    summary="Get account details",
    description="Returns details for a single account",
)
async def get_account(
    account_id: UUID,
    current_user: CurrentUserDep,
    account_repo: AccountRepoDep,
    plaid_item_repo: PlaidItemRepoDep,
) -> AccountResponse:
    account = account_repo.get_by_id(account_id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )

    plaid_item = plaid_item_repo.get_by_id(UUID(account["plaid_item_id"]))
    if not plaid_item or plaid_item["user_id"] != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )

    return AccountResponse(
        id=UUID(account["id"]),
        account_id=account["account_id"],
        name=account["name"],
        official_name=account.get("official_name"),
        type=account["type"],
        subtype=account.get("subtype"),
        mask=account.get("mask"),
        current_balance=account.get("current_balance"),
        available_balance=account.get("available_balance"),
        iso_currency_code=account.get("iso_currency_code", "USD"),
    )


@router.post(
    "/{account_id}/sync",
    response_model=SyncResponse,
    summary="Sync account transactions",
    description="Triggers a transaction sync for the account's plaid item",
)
async def sync_account(
    account_id: UUID,
    current_user: CurrentUserDep,
    account_repo: AccountRepoDep,
    plaid_item_repo: PlaidItemRepoDep,
    sync_service: TransactionSyncDep,
) -> SyncResponse:
    account = account_repo.get_by_id(account_id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )

    plaid_item = plaid_item_repo.get_by_id(UUID(account["plaid_item_id"]))
    if not plaid_item or plaid_item["user_id"] != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )

    try:
        result = sync_service.sync_plaid_item(UUID(plaid_item["id"]))
        return SyncResponse(
            success=True,
            transactions_added=result.added,
            transactions_modified=result.modified,
            transactions_removed=result.removed,
            message="Sync completed successfully",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sync failed: {e}",
        ) from e


@router.delete(
    "/plaid-items/{plaid_item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Disconnect a plaid item",
    description="Removes a plaid item and all its associated accounts and transactions",
)
async def delete_plaid_item(
    plaid_item_id: UUID,
    current_user: CurrentUserDep,
    plaid_item_repo: PlaidItemRepoDep,
) -> None:
    plaid_item = plaid_item_repo.get_by_id(plaid_item_id)
    if not plaid_item or plaid_item["user_id"] != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plaid item not found",
        )

    plaid_item_repo.delete_by_id(plaid_item_id)
