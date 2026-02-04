from datetime import date, datetime
from decimal import Decimal
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from middleware.auth import get_current_user
from models.auth import AuthenticatedUser
from models.enums import FrequencyType, StreamType
from models.recurring import (
    RecurringStreamListResponse,
    RecurringStreamResponse,
    RecurringSyncResult,
    UpcomingBillResponse,
    UpcomingBillsListResponse,
)
from repositories.recurring_stream import RecurringStreamRepository, get_recurring_stream_repository
from services.recurring import RecurringSyncService, get_recurring_sync_service

router = APIRouter()

CurrentUserDep = Annotated[AuthenticatedUser, Depends(get_current_user)]
RecurringStreamRepoDep = Annotated[RecurringStreamRepository, Depends(get_recurring_stream_repository)]
RecurringSyncServiceDep = Annotated[RecurringSyncService, Depends(get_recurring_sync_service)]


def _to_stream_response(stream: dict) -> RecurringStreamResponse:
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
        first_date=stream["first_date"] if isinstance(stream["first_date"], date) else date.fromisoformat(stream["first_date"]),
        last_date=stream["last_date"] if isinstance(stream["last_date"], date) else date.fromisoformat(stream["last_date"]),
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


def _calculate_monthly_amount(stream: dict) -> Decimal:
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
async def list_recurring(
    current_user: CurrentUserDep,
    recurring_repo: RecurringStreamRepoDep,
    active_only: bool = Query(default=True, description="Only return active streams"),
) -> RecurringStreamListResponse:
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

    return RecurringStreamListResponse(
        inflow_streams=inflow_streams,
        outflow_streams=outflow_streams,
        total_monthly_inflow=total_monthly_inflow,
        total_monthly_outflow=total_monthly_outflow,
        last_synced_at=last_synced,
    )


@router.get(
    "/upcoming",
    response_model=UpcomingBillsListResponse,
    summary="Get upcoming bills",
    description="Returns bills expected in the next N days",
)
async def get_upcoming_bills(
    current_user: CurrentUserDep,
    recurring_repo: RecurringStreamRepoDep,
    days: int = Query(default=30, ge=1, le=90, description="Number of days to look ahead"),
) -> UpcomingBillsListResponse:
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

    return UpcomingBillsListResponse(
        bills=bills,
        total_amount=total_amount,
        period_days=days,
    )


@router.get(
    "/{stream_id}",
    response_model=RecurringStreamResponse,
    summary="Get recurring stream details",
    description="Returns details for a single recurring stream",
)
async def get_recurring_stream(
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


@router.post(
    "/sync",
    response_model=RecurringSyncResult,
    summary="Sync recurring transactions",
    description="Triggers a sync of recurring transactions from Plaid",
)
async def sync_recurring(
    current_user: CurrentUserDep,
    sync_service: RecurringSyncServiceDep,
) -> RecurringSyncResult:
    results = sync_service.sync_all_for_user(current_user.id)

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
