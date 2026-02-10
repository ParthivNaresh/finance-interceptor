from datetime import date, datetime
from decimal import Decimal
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from middleware.auth import get_current_user
from middleware.rate_limit import get_limiter, get_rate_limits
from models.auth import AuthenticatedUser
from models.enums import FrequencyType, StreamType
from models.recurring import (
    RecurringStreamDetailResponse,
    RecurringStreamListResponse,
    RecurringStreamResponse,
    RecurringSyncResult,
    StreamTransactionResponse,
    UpcomingBillResponse,
    UpcomingBillsListResponse,
)
from repositories.recurring_stream import RecurringStreamRepository, get_recurring_stream_repository
from repositories.transaction import TransactionRepository, get_transaction_repository
from services.cache.invalidation import CacheInvalidator, get_cache_invalidator
from services.cache.recurring_cache import RecurringCache, get_recurring_cache
from services.recurring import RecurringSyncService, get_recurring_sync_service

router = APIRouter()
limiter = get_limiter()
limits = get_rate_limits()

CurrentUserDep = Annotated[AuthenticatedUser, Depends(get_current_user)]
RecurringStreamRepoDep = Annotated[
    RecurringStreamRepository, Depends(get_recurring_stream_repository)
]
TransactionRepoDep = Annotated[TransactionRepository, Depends(get_transaction_repository)]
RecurringSyncServiceDep = Annotated[RecurringSyncService, Depends(get_recurring_sync_service)]
RecurringCacheDep = Annotated[RecurringCache, Depends(get_recurring_cache)]
CacheInvalidatorDep = Annotated[CacheInvalidator, Depends(get_cache_invalidator)]


def _to_stream_response(stream: dict[str, Any]) -> RecurringStreamResponse:
    return RecurringStreamResponse(
        id=UUID(stream["id"]),
        user_id=UUID(stream["user_id"]),
        plaid_item_id=UUID(stream["plaid_item_id"]),
        account_id=UUID(stream["account_id"]),
        stream_id=stream["stream_id"],
        stream_type=StreamType(stream["stream_type"]),
        description=stream["description"],
        merchant_name=stream.get("merchant_name"),
        category_primary=stream.get("category_primary"),
        category_detailed=stream.get("category_detailed"),
        frequency=FrequencyType(stream["frequency"]),
        first_date=stream["first_date"]
        if isinstance(stream["first_date"], date)
        else date.fromisoformat(stream["first_date"]),
        last_date=stream["last_date"]
        if isinstance(stream["last_date"], date)
        else date.fromisoformat(stream["last_date"]),
        predicted_next_date=_parse_date(stream.get("predicted_next_date")),
        average_amount=Decimal(str(stream["average_amount"])),
        last_amount=Decimal(str(stream["last_amount"])),
        iso_currency_code=stream.get("iso_currency_code", "USD"),
        is_active=stream["is_active"],
        status=stream["status"],
        is_user_modified=stream.get("is_user_modified", False),
        transaction_ids=stream.get("transaction_ids") or [],
        last_synced_at=_parse_datetime(stream["last_synced_at"]),
        created_at=_parse_datetime(stream["created_at"]),
        updated_at=_parse_datetime(stream["updated_at"]),
    )


def _to_transaction_response(txn: dict[str, Any]) -> StreamTransactionResponse:
    return StreamTransactionResponse(
        id=UUID(txn["id"]),
        account_id=UUID(txn["account_id"]),
        transaction_id=txn["transaction_id"],
        amount=Decimal(str(txn["amount"])),
        iso_currency_code=txn.get("iso_currency_code", "USD"),
        date=txn["date"] if isinstance(txn["date"], date) else date.fromisoformat(txn["date"]),
        name=txn["name"],
        merchant_name=txn.get("merchant_name"),
        pending=txn["pending"],
        payment_channel=txn.get("payment_channel"),
        category=txn.get("category"),
        personal_finance_category_primary=txn.get("personal_finance_category_primary"),
        personal_finance_category_detailed=txn.get("personal_finance_category_detailed"),
        logo_url=txn.get("logo_url"),
        created_at=_parse_datetime(txn["created_at"]),
        updated_at=_parse_datetime(txn["updated_at"]),
    )


def _parse_date(value: str | date | None) -> date | None:
    if value is None:
        return None
    if isinstance(value, date):
        return value
    return date.fromisoformat(value)


def _parse_datetime(value: str | datetime) -> datetime:
    if isinstance(value, datetime):
        return value
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _calculate_monthly_amount(stream: dict[str, Any]) -> Decimal:
    amount = Decimal(str(stream["last_amount"]))
    frequency = FrequencyType(stream["frequency"])

    multipliers = {
        FrequencyType.WEEKLY: Decimal("4.33"),
        FrequencyType.BIWEEKLY: Decimal("2.17"),
        FrequencyType.SEMI_MONTHLY: Decimal("2"),
        FrequencyType.MONTHLY: Decimal("1"),
        FrequencyType.QUARTERLY: Decimal("0.33"),
        FrequencyType.SEMI_ANNUALLY: Decimal("0.17"),
        FrequencyType.ANNUALLY: Decimal("0.083"),
        FrequencyType.UNKNOWN: Decimal("1"),
    }

    return amount * multipliers.get(frequency, Decimal("1"))


@router.get(
    "",
    response_model=RecurringStreamListResponse,
    summary="List recurring transactions",
    description="Returns all recurring transaction streams grouped by inflow/outflow",
)
@limiter.limit(limits.default)
async def list_recurring(
    request: Request,
    current_user: CurrentUserDep,
    recurring_repo: RecurringStreamRepoDep,
    recurring_cache: RecurringCacheDep,
    active_only: bool = Query(default=True, description="Only return active streams"),
) -> RecurringStreamListResponse:
    cached = recurring_cache.get_recurring_list(current_user.id, active_only)
    if cached is not None:
        return cached

    if active_only:
        streams = recurring_repo.get_active_by_user_id(current_user.id)
    else:
        streams = recurring_repo.get_by_user_id(current_user.id)

    inflow_streams: list[RecurringStreamResponse] = []
    outflow_streams: list[RecurringStreamResponse] = []
    total_monthly_inflow = Decimal("0")
    total_monthly_outflow = Decimal("0")
    last_synced: datetime | None = None

    for stream in streams:
        response = _to_stream_response(stream)

        if stream["stream_type"] == StreamType.INFLOW.value:
            inflow_streams.append(response)
            if stream["is_active"]:
                total_monthly_inflow += _calculate_monthly_amount(stream)
        else:
            outflow_streams.append(response)
            if stream["is_active"]:
                total_monthly_outflow += _calculate_monthly_amount(stream)

        stream_synced = _parse_datetime(stream["last_synced_at"])
        if last_synced is None or stream_synced > last_synced:
            last_synced = stream_synced

    list_response = RecurringStreamListResponse(
        inflow_streams=inflow_streams,
        outflow_streams=outflow_streams,
        total_monthly_inflow=total_monthly_inflow,
        total_monthly_outflow=total_monthly_outflow,
        last_synced_at=last_synced,
    )
    recurring_cache.set_recurring_list(current_user.id, active_only, list_response)
    return list_response


@router.get(
    "/upcoming",
    response_model=UpcomingBillsListResponse,
    summary="Get upcoming bills",
    description="Returns bills expected in the next N days",
)
@limiter.limit(limits.default)
async def get_upcoming_bills(
    request: Request,
    current_user: CurrentUserDep,
    recurring_repo: RecurringStreamRepoDep,
    recurring_cache: RecurringCacheDep,
    days: int = Query(default=30, ge=1, le=90, description="Number of days to look ahead"),
) -> UpcomingBillsListResponse:
    cached = recurring_cache.get_upcoming_bills(current_user.id, days)
    if cached is not None:
        return cached

    streams = recurring_repo.get_upcoming(current_user.id, days_ahead=days)
    today = date.today()

    bills: list[UpcomingBillResponse] = []
    total_amount = Decimal("0")

    for stream in streams:
        predicted = _parse_date(stream.get("predicted_next_date"))
        if not predicted:
            continue

        days_until = (predicted - today).days
        amount = Decimal(str(stream["last_amount"]))

        bills.append(
            UpcomingBillResponse(
                stream=_to_stream_response(stream),
                days_until_due=days_until,
                expected_amount=amount,
            )
        )
        total_amount += amount

    response = UpcomingBillsListResponse(
        bills=bills,
        total_amount=total_amount,
        period_days=days,
    )
    recurring_cache.set_upcoming_bills(current_user.id, days, response)
    return response


@router.get(
    "/{stream_id}",
    response_model=RecurringStreamResponse,
    summary="Get recurring stream details",
    description="Returns details for a single recurring stream",
)
@limiter.limit(limits.default)
async def get_recurring_stream(
    request: Request,
    stream_id: UUID,
    current_user: CurrentUserDep,
    recurring_repo: RecurringStreamRepoDep,
) -> RecurringStreamResponse:
    stream = recurring_repo.get_by_id(stream_id)
    if not stream:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring stream not found",
        )

    if stream["user_id"] != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring stream not found",
        )

    return _to_stream_response(stream)


@router.get(
    "/{stream_id}/transactions",
    response_model=RecurringStreamDetailResponse,
    summary="Get recurring stream with transactions",
    description="Returns a recurring stream with all its associated transactions",
)
@limiter.limit(limits.default)
async def get_recurring_stream_transactions(
    request: Request,
    stream_id: UUID,
    current_user: CurrentUserDep,
    recurring_repo: RecurringStreamRepoDep,
    transaction_repo: TransactionRepoDep,
) -> RecurringStreamDetailResponse:
    stream = recurring_repo.get_by_id(stream_id)
    if not stream:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring stream not found",
        )

    if stream["user_id"] != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring stream not found",
        )

    transaction_ids = stream.get("transaction_ids") or []
    transactions_data = transaction_repo.get_by_transaction_ids(transaction_ids)

    transactions = [_to_transaction_response(txn) for txn in transactions_data]

    total_spent = sum(abs(Decimal(str(txn["amount"]))) for txn in transactions_data)

    return RecurringStreamDetailResponse(
        stream=_to_stream_response(stream),
        transactions=transactions,
        total_spent=total_spent,
        occurrence_count=len(transactions),
    )


@router.post(
    "/sync",
    response_model=RecurringSyncResult,
    summary="Sync recurring transactions",
    description="Triggers a sync of recurring transactions from Plaid",
)
@limiter.limit(limits.plaid)
async def sync_recurring(
    request: Request,
    current_user: CurrentUserDep,
    sync_service: RecurringSyncServiceDep,
    cache_invalidator: CacheInvalidatorDep,
) -> RecurringSyncResult:
    results = sync_service.sync_all_for_user(current_user.id)

    cache_invalidator.on_recurring_sync(current_user.id)

    total = RecurringSyncResult(
        streams_synced=0,
        streams_created=0,
        streams_updated=0,
        streams_deactivated=0,
        alerts_created=0,
    )

    for result in results:
        total.streams_synced += result.streams_synced
        total.streams_created += result.streams_created
        total.streams_updated += result.streams_updated
        total.streams_deactivated += result.streams_deactivated
        total.alerts_created += result.alerts_created

    return total
