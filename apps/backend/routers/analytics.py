from datetime import date
from decimal import Decimal
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from middleware.auth import get_current_user
from models.analytics import (
    CategoryBreakdownResponse,
    CategorySpendingSummary,
    ComputationResultResponse,
    MerchantBreakdownResponse,
    MerchantSpendingSummary,
    SpendingPeriodWithDelta,
    SpendingSummaryListResponse,
    SpendingSummaryResponse,
)
from models.auth import AuthenticatedUser
from models.enums import PeriodType
from repositories.category_spending import CategorySpendingRepository, get_category_spending_repository
from repositories.merchant_spending import MerchantSpendingRepository, get_merchant_spending_repository
from repositories.spending_period import SpendingPeriodRepository, get_spending_period_repository
from services.analytics import get_spending_computation_manager
from services.analytics.computation_manager import SpendingComputationManager
from services.analytics.period_calculator import (
    get_current_period_start,
    get_period_bounds,
    get_previous_period_start,
)

router = APIRouter()

CurrentUserDep = Annotated[AuthenticatedUser, Depends(get_current_user)]
SpendingPeriodRepoDep = Annotated[SpendingPeriodRepository, Depends(get_spending_period_repository)]
CategorySpendingRepoDep = Annotated[CategorySpendingRepository, Depends(get_category_spending_repository)]
MerchantSpendingRepoDep = Annotated[MerchantSpendingRepository, Depends(get_merchant_spending_repository)]
ComputationManagerDep = Annotated[SpendingComputationManager, Depends(get_spending_computation_manager)]


@router.get(
    "/spending",
    response_model=SpendingSummaryListResponse,
    summary="Get spending summaries",
    description="Returns spending summaries for multiple periods with month-over-month changes",
)
async def get_spending_summaries(
    current_user: CurrentUserDep,
    spending_period_repo: SpendingPeriodRepoDep,
    period_type: PeriodType = Query(default=PeriodType.MONTHLY, description="Period granularity"),
    periods: int = Query(default=6, ge=1, le=24, description="Number of periods to return"),
) -> SpendingSummaryListResponse:
    periods_data = spending_period_repo.get_periods_for_user(
        user_id=current_user.id,
        period_type=period_type,
        limit=periods + 1,
    )

    result: list[SpendingPeriodWithDelta] = []

    for i, period in enumerate(periods_data[:periods]):
        previous_outflow: Decimal | None = None
        change_amount: Decimal | None = None
        change_percentage: Decimal | None = None

        if i + 1 < len(periods_data):
            previous = periods_data[i + 1]
            previous_outflow = Decimal(str(previous.get("total_outflow_excluding_transfers", 0)))
            current_outflow = Decimal(str(period.get("total_outflow_excluding_transfers", 0)))

            change_amount = current_outflow - previous_outflow
            if previous_outflow > 0:
                change_percentage = (change_amount / previous_outflow) * 100

        result.append(_to_spending_period_with_delta(
            period,
            previous_outflow,
            change_amount,
            change_percentage,
        ))

    return SpendingSummaryListResponse(
        periods=result,
        total_periods=len(result),
    )


@router.get(
    "/spending/current",
    response_model=SpendingSummaryResponse,
    summary="Get current period spending",
    description="Returns detailed spending summary for the current period",
)
async def get_current_spending(
    current_user: CurrentUserDep,
    spending_period_repo: SpendingPeriodRepoDep,
    category_spending_repo: CategorySpendingRepoDep,
    period_type: PeriodType = Query(default=PeriodType.MONTHLY, description="Period granularity"),
) -> SpendingSummaryResponse:
    current_period_start = get_current_period_start(period_type)
    _, period_end = get_period_bounds(current_period_start, period_type)

    period = spending_period_repo.get_by_user_and_period(
        user_id=current_user.id,
        period_type=period_type,
        period_start=current_period_start,
    )

    categories = category_spending_repo.get_top_categories(
        user_id=current_user.id,
        period_type=period_type,
        period_start=current_period_start,
        limit=10,
    )

    total_spending = Decimal(str(period.get("total_outflow_excluding_transfers", 0))) if period else Decimal("0")
    total_income = Decimal(str(period.get("total_inflow_excluding_transfers", 0))) if period else Decimal("0")
    net_flow = Decimal(str(period.get("net_flow_excluding_transfers", 0))) if period else Decimal("0")
    transaction_count = period.get("transaction_count", 0) if period else 0

    top_categories = _build_category_summaries(categories, total_spending)

    previous_period_start = get_previous_period_start(current_period_start, period_type)
    previous_period = spending_period_repo.get_by_user_and_period(
        user_id=current_user.id,
        period_type=period_type,
        period_start=previous_period_start,
    )

    mom_change: Decimal | None = None
    if previous_period:
        prev_spending = Decimal(str(previous_period.get("total_outflow_excluding_transfers", 0)))
        if prev_spending > 0:
            mom_change = ((total_spending - prev_spending) / prev_spending) * 100

    rolling_3mo = spending_period_repo.get_rolling_average(current_user.id, period_type, 3)
    rolling_6mo = spending_period_repo.get_rolling_average(current_user.id, period_type, 6)

    return SpendingSummaryResponse(
        period_type=period_type,
        period_start=current_period_start,
        period_end=period_end,
        total_spending=total_spending,
        total_income=total_income,
        net_flow=net_flow,
        transaction_count=transaction_count,
        top_categories=top_categories,
        month_over_month_change=mom_change,
        rolling_average_3mo=rolling_3mo,
        rolling_average_6mo=rolling_6mo,
    )


@router.get(
    "/spending/categories",
    response_model=CategoryBreakdownResponse,
    summary="Get category breakdown",
    description="Returns spending breakdown by category for a specific period",
)
async def get_category_breakdown(
    current_user: CurrentUserDep,
    spending_period_repo: SpendingPeriodRepoDep,
    category_spending_repo: CategorySpendingRepoDep,
    period_start: date | None = Query(default=None, description="Period start date (defaults to current)"),
    period_type: PeriodType = Query(default=PeriodType.MONTHLY, description="Period granularity"),
) -> CategoryBreakdownResponse:
    if period_start is None:
        period_start = get_current_period_start(period_type)

    period_start_bound, period_end = get_period_bounds(period_start, period_type)

    period = spending_period_repo.get_by_user_and_period(
        user_id=current_user.id,
        period_type=period_type,
        period_start=period_start_bound,
    )

    categories = category_spending_repo.get_by_user_and_period(
        user_id=current_user.id,
        period_type=period_type,
        period_start=period_start_bound,
    )

    total_spending = Decimal(str(period.get("total_outflow_excluding_transfers", 0))) if period else Decimal("0")
    category_summaries = _build_category_summaries(categories, total_spending)

    return CategoryBreakdownResponse(
        period_type=period_type,
        period_start=period_start_bound,
        period_end=period_end,
        total_spending=total_spending,
        categories=category_summaries,
    )


@router.get(
    "/spending/merchants",
    response_model=MerchantBreakdownResponse,
    summary="Get merchant breakdown",
    description="Returns spending breakdown by merchant for a specific period",
)
async def get_merchant_breakdown(
    current_user: CurrentUserDep,
    spending_period_repo: SpendingPeriodRepoDep,
    merchant_spending_repo: MerchantSpendingRepoDep,
    period_start: date | None = Query(default=None, description="Period start date (defaults to current)"),
    period_type: PeriodType = Query(default=PeriodType.MONTHLY, description="Period granularity"),
    limit: int = Query(default=10, ge=1, le=50, description="Number of merchants to return"),
) -> MerchantBreakdownResponse:
    if period_start is None:
        period_start = get_current_period_start(period_type)

    period_start_bound, period_end = get_period_bounds(period_start, period_type)

    period = spending_period_repo.get_by_user_and_period(
        user_id=current_user.id,
        period_type=period_type,
        period_start=period_start_bound,
    )

    merchants = merchant_spending_repo.get_top_merchants(
        user_id=current_user.id,
        period_type=period_type,
        period_start=period_start_bound,
        limit=limit,
    )

    total_spending = Decimal(str(period.get("total_outflow_excluding_transfers", 0))) if period else Decimal("0")
    merchant_summaries = _build_merchant_summaries(merchants, total_spending)

    return MerchantBreakdownResponse(
        period_type=period_type,
        period_start=period_start_bound,
        period_end=period_end,
        total_spending=total_spending,
        merchants=merchant_summaries,
    )


@router.get(
    "/spending/category/{category}",
    response_model=list[CategorySpendingSummary],
    summary="Get category history",
    description="Returns spending history for a specific category",
)
async def get_category_history(
    category: str,
    current_user: CurrentUserDep,
    category_spending_repo: CategorySpendingRepoDep,
    period_type: PeriodType = Query(default=PeriodType.MONTHLY, description="Period granularity"),
    months: int = Query(default=12, ge=1, le=24, description="Number of months of history"),
) -> list[CategorySpendingSummary]:
    history = category_spending_repo.get_category_history(
        user_id=current_user.id,
        category_primary=category,
        period_type=period_type,
        months=months,
    )

    return [
        CategorySpendingSummary(
            category_primary=item["category_primary"],
            category_detailed=item.get("category_detailed"),
            total_amount=Decimal(str(item["total_amount"])),
            transaction_count=item["transaction_count"],
            average_transaction=Decimal(str(item["average_transaction"])) if item.get("average_transaction") else None,
            percentage_of_total=None,
        )
        for item in history
    ]


@router.get(
    "/spending/merchant/{merchant_name}",
    response_model=list[MerchantSpendingSummary],
    summary="Get merchant history",
    description="Returns spending history for a specific merchant",
)
async def get_merchant_history(
    merchant_name: str,
    current_user: CurrentUserDep,
    merchant_spending_repo: MerchantSpendingRepoDep,
    period_type: PeriodType = Query(default=PeriodType.MONTHLY, description="Period granularity"),
    months: int = Query(default=12, ge=1, le=24, description="Number of months of history"),
) -> list[MerchantSpendingSummary]:
    history = merchant_spending_repo.get_merchant_history(
        user_id=current_user.id,
        merchant_name=merchant_name,
        period_type=period_type,
        months=months,
    )

    return [
        MerchantSpendingSummary(
            merchant_name=item["merchant_name"],
            merchant_id=UUID(item["merchant_id"]) if item.get("merchant_id") else None,
            total_amount=Decimal(str(item["total_amount"])),
            transaction_count=item["transaction_count"],
            average_transaction=Decimal(str(item["average_transaction"])) if item.get("average_transaction") else None,
            percentage_of_total=None,
        )
        for item in history
    ]


@router.post(
    "/compute",
    response_model=ComputationResultResponse,
    summary="Trigger analytics computation",
    description="Triggers computation of spending analytics for the current user",
)
async def trigger_computation(
    current_user: CurrentUserDep,
    computation_manager: ComputationManagerDep,
    force_full: bool = Query(default=False, description="Force full recomputation"),
) -> ComputationResultResponse:
    result = computation_manager.compute_for_user(
        user_id=current_user.id,
        force_full_recompute=force_full,
    )

    return ComputationResultResponse(
        status=result.status,
        periods_computed=result.periods_computed,
        categories_computed=result.categories_computed,
        merchants_computed=result.merchants_computed,
        transactions_processed=result.transactions_processed,
        computation_time_ms=result.computation_time_ms,
        error_message=result.error_message,
    )


def _to_spending_period_with_delta(
    period: dict,
    previous_period_outflow: Decimal | None,
    change_amount: Decimal | None,
    change_percentage: Decimal | None,
) -> SpendingPeriodWithDelta:
    return SpendingPeriodWithDelta(
        id=UUID(period["id"]),
        user_id=UUID(period["user_id"]),
        period_type=PeriodType(period["period_type"]),
        period_start=_parse_date(period["period_start"]),
        period_end=_parse_date(period["period_end"]),
        total_inflow=Decimal(str(period["total_inflow"])),
        total_outflow=Decimal(str(period["total_outflow"])),
        net_flow=Decimal(str(period["net_flow"])),
        total_inflow_excluding_transfers=Decimal(str(period["total_inflow_excluding_transfers"])),
        total_outflow_excluding_transfers=Decimal(str(period["total_outflow_excluding_transfers"])),
        net_flow_excluding_transfers=Decimal(str(period["net_flow_excluding_transfers"])),
        transaction_count=period["transaction_count"],
        is_finalized=period["is_finalized"],
        created_at=period["created_at"],
        updated_at=period["updated_at"],
        previous_period_outflow=previous_period_outflow,
        change_amount=change_amount,
        change_percentage=change_percentage,
    )


def _build_category_summaries(
    categories: list[dict],
    total_spending: Decimal,
) -> list[CategorySpendingSummary]:
    result: list[CategorySpendingSummary] = []

    for cat in categories:
        amount = Decimal(str(cat["total_amount"]))
        percentage = (amount / total_spending * 100) if total_spending > 0 else None

        result.append(CategorySpendingSummary(
            category_primary=cat["category_primary"],
            category_detailed=cat.get("category_detailed"),
            total_amount=amount,
            transaction_count=cat["transaction_count"],
            average_transaction=Decimal(str(cat["average_transaction"])) if cat.get("average_transaction") else None,
            percentage_of_total=percentage,
        ))

    return result


def _build_merchant_summaries(
    merchants: list[dict],
    total_spending: Decimal,
) -> list[MerchantSpendingSummary]:
    result: list[MerchantSpendingSummary] = []

    for merchant in merchants:
        amount = Decimal(str(merchant["total_amount"]))
        percentage = (amount / total_spending * 100) if total_spending > 0 else None

        result.append(MerchantSpendingSummary(
            merchant_name=merchant["merchant_name"],
            merchant_id=UUID(merchant["merchant_id"]) if merchant.get("merchant_id") else None,
            total_amount=amount,
            transaction_count=merchant["transaction_count"],
            average_transaction=Decimal(str(merchant["average_transaction"])) if merchant.get("average_transaction") else None,
            percentage_of_total=percentage,
        ))

    return result


def _parse_date(value: str | date) -> date:
    if isinstance(value, date):
        return value
    return date.fromisoformat(value)
