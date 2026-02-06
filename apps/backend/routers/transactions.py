from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from middleware.auth import get_current_user
from middleware.rate_limit import get_limiter, get_rate_limits
from models.auth import AuthenticatedUser
from models.transaction import (
    TransactionDetailResponse,
    TransactionResponse,
    TransactionsListResponse,
)
from repositories.account import AccountRepository, get_account_repository
from repositories.plaid_item import PlaidItemRepository, get_plaid_item_repository
from repositories.transaction import TransactionRepository, get_transaction_repository

router = APIRouter()
limiter = get_limiter()
limits = get_rate_limits()

CurrentUserDep = Annotated[AuthenticatedUser, Depends(get_current_user)]
TransactionRepoDep = Annotated[TransactionRepository, Depends(get_transaction_repository)]
AccountRepoDep = Annotated[AccountRepository, Depends(get_account_repository)]
PlaidItemRepoDep = Annotated[PlaidItemRepository, Depends(get_plaid_item_repository)]


@router.get(
    "",
    response_model=TransactionsListResponse,
    summary="List transactions",
    description="Returns paginated list of transactions with optional filters",
)
@limiter.limit(limits.default)
async def list_transactions(
    request: Request,
    current_user: CurrentUserDep,
    transaction_repo: TransactionRepoDep,
    account_id: UUID | None = Query(default=None, description="Filter by account ID"),
    start_date: date | None = Query(default=None, description="Filter from date (inclusive)"),
    end_date: date | None = Query(default=None, description="Filter to date (inclusive)"),
    category: str | None = Query(default=None, description="Filter by primary category"),
    search: str | None = Query(default=None, description="Search in name or merchant_name"),
    pending: bool | None = Query(default=None, description="Filter by pending status"),
    limit: int = Query(default=50, ge=1, le=200, description="Number of results"),
    offset: int = Query(default=0, ge=0, description="Offset for pagination"),
) -> TransactionsListResponse:
    transactions_data, total = transaction_repo.get_by_user_id(
        user_id=current_user.id,
        account_id=account_id,
        start_date=start_date,
        end_date=end_date,
        category=category,
        search=search,
        pending=pending,
        limit=limit,
        offset=offset,
    )

    transactions = [
        TransactionResponse(
            id=UUID(txn["id"]),
            account_id=UUID(txn["account_id"]),
            transaction_id=txn["transaction_id"],
            amount=txn["amount"],
            iso_currency_code=txn.get("iso_currency_code", "USD"),
            date=txn["date"],
            name=txn["name"],
            merchant_name=txn.get("merchant_name"),
            pending=txn["pending"],
            payment_channel=txn.get("payment_channel"),
            category=txn.get("category"),
            personal_finance_category_primary=txn.get("personal_finance_category_primary"),
            personal_finance_category_detailed=txn.get("personal_finance_category_detailed"),
            logo_url=txn.get("logo_url"),
            created_at=txn["created_at"],
            updated_at=txn["updated_at"],
        )
        for txn in transactions_data
    ]

    return TransactionsListResponse(
        transactions=transactions,
        total=total,
        limit=limit,
        offset=offset,
        has_more=(offset + limit) < total,
    )


@router.get(
    "/{transaction_id}",
    response_model=TransactionDetailResponse,
    summary="Get transaction details",
    description="Returns full details for a single transaction",
)
@limiter.limit(limits.default)
async def get_transaction(
    request: Request,
    transaction_id: UUID,
    current_user: CurrentUserDep,
    transaction_repo: TransactionRepoDep,
    account_repo: AccountRepoDep,
    plaid_item_repo: PlaidItemRepoDep,
) -> TransactionDetailResponse:
    transaction = transaction_repo.get_by_id(transaction_id)
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )

    account = account_repo.get_by_id(UUID(transaction["account_id"]))
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )

    plaid_item = plaid_item_repo.get_by_id(UUID(account["plaid_item_id"]))
    if not plaid_item or plaid_item["user_id"] != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )

    return TransactionDetailResponse(
        id=UUID(transaction["id"]),
        account_id=UUID(transaction["account_id"]),
        transaction_id=transaction["transaction_id"],
        amount=transaction["amount"],
        iso_currency_code=transaction.get("iso_currency_code", "USD"),
        date=transaction["date"],
        authorized_date=transaction.get("authorized_date"),
        name=transaction["name"],
        merchant_name=transaction.get("merchant_name"),
        pending=transaction["pending"],
        payment_channel=transaction.get("payment_channel"),
        category=transaction.get("category"),
        personal_finance_category_primary=transaction.get("personal_finance_category_primary"),
        personal_finance_category_detailed=transaction.get("personal_finance_category_detailed"),
        location_address=transaction.get("location_address"),
        location_city=transaction.get("location_city"),
        location_region=transaction.get("location_region"),
        location_postal_code=transaction.get("location_postal_code"),
        location_country=transaction.get("location_country"),
        logo_url=transaction.get("logo_url"),
        website=transaction.get("website"),
        created_at=transaction["created_at"],
        updated_at=transaction["updated_at"],
    )
