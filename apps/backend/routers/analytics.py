from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from middleware.auth import get_current_user
from middleware.rate_limit import get_limiter, get_rate_limits
from models.analytics import (
    CashFlowComputationResultResponse,
    CashFlowMetricsListResponse,
    CashFlowMetricsResponse,
    CategoryBreakdownResponse,
    CategoryDetailResponse,
    CategorySpendingHistoryItem,
    CategorySpendingSummary,
    ComputationResultResponse,
    IncomeSourceListResponse,
    IncomeSourceResponse,
    MerchantBreakdownResponse,
    MerchantSpendingHistoryItem,
    MerchantSpendingSummary,
    MerchantStatsComputationResult,
    MerchantStatsListResponse,
    MerchantStatsResponse,
    SpendingPeriodWithDelta,
    SpendingSummaryListResponse,
    SpendingSummaryResponse,
    SubcategorySpendingSummary,
)
from models.auth import AuthenticatedUser
from models.enums import PeriodType
from repositories.cash_flow_metrics import CashFlowMetricsRepository, get_cash_flow_metrics_repository
from repositories.category_spending import CategorySpendingRepository, get_category_spending_repository
from repositories.income_source import IncomeSourceRepository, get_income_source_repository
from repositories.merchant_spending import MerchantSpendingRepository, get_merchant_spending_repository
from repositories.merchant_stats import MerchantStatsRepository, get_merchant_stats_repository
from repositories.spending_period import SpendingPeriodRepository, get_spending_period_repository
from repositories.transaction import TransactionRepository, get_transaction_repository
from services.analytics import get_spending_computation_manager
from services.analytics.cash_flow_aggregator import CashFlowAggregator, get_cash_flow_aggregator
from services.analytics.computation_manager import SpendingComputationManager
from services.analytics.merchant_stats_aggregator import MerchantStatsAggregator, get_merchant_stats_aggregator
from services.analytics.period_calculator import (
    get_current_period_start,
    get_period_bounds,
    get_previous_period_start,
)

router = APIRouter()
limiter = get_limiter()
limits = get_rate_limits()

CurrentUserDep = Annotated[AuthenticatedUser, Depends(get_current_user)]
SpendingPeriodRepoDep = Annotated[SpendingPeriodRepository, Depends(get_spending_period_repository)]
CategorySpendingRepoDep = Annotated[CategorySpendingRepository, Depends(get_category_spending_repository)]
MerchantSpendingRepoDep = Annotated[MerchantSpendingRepository, Depends(get_merchant_spending_repository)]
MerchantStatsRepoDep = Annotated[MerchantStatsRepository, Depends(get_merchant_stats_repository)]
TransactionRepoDep = Annotated[TransactionRepository, Depends(get_transaction_repository)]
ComputationManagerDep = Annotated[SpendingComputationManager, Depends(get_spending_computation_manager)]
MerchantStatsAggregatorDep = Annotated[MerchantStatsAggregator, Depends(get_merchant_stats_aggregator)]
CashFlowRepoDep = Annotated[CashFlowMetricsRepository, Depends(get_cash_flow_metrics_repository)]
IncomeSourceRepoDep = Annotated[IncomeSourceRepository, Depends(get_income_source_repository)]
CashFlowAggregatorDep = Annotated[CashFlowAggregator, Depends(get_cash_flow_aggregator)]


@router.get(
    "/spending",
    response_model=SpendingSummaryListResponse,
    summary="Get spending summaries",
    description="Returns spending summaries for multiple periods with month-over-month changes",
)
@limiter.limit(limits.default)
async def get_spending_summaries(
    request: Request,
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
    summary="Get category history (legacy)",
    description="Returns spending history for a specific category (legacy format without period info)",
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
    "/spending/categories/{category_name}/history",
    response_model=list[CategorySpendingHistoryItem],
    summary="Get category spending history",
    description="Returns spending history for a specific category with period information",
)
async def get_category_spending_history(
    category_name: str,
    current_user: CurrentUserDep,
    category_spending_repo: CategorySpendingRepoDep,
    period_type: PeriodType = Query(default=PeriodType.MONTHLY, description="Period granularity"),
    months: int = Query(default=12, ge=1, le=24, description="Number of months of history"),
) -> list[CategorySpendingHistoryItem]:
    history = category_spending_repo.get_category_history(
        user_id=current_user.id,
        category_primary=category_name,
        period_type=period_type,
        months=months,
    )

    result: list[CategorySpendingHistoryItem] = []
    for item in history:
        period_start = _parse_date(item["period_start"])
        _, period_end = get_period_bounds(period_start, period_type)

        result.append(CategorySpendingHistoryItem(
            category_primary=item["category_primary"],
            period_start=period_start,
            period_end=period_end,
            total_amount=Decimal(str(item["total_amount"])),
            transaction_count=item["transaction_count"],
            average_transaction=Decimal(str(item["average_transaction"])) if item.get("average_transaction") else None,
        ))

    return result


@router.get(
    "/spending/merchant/{merchant_name}",
    response_model=list[MerchantSpendingHistoryItem],
    summary="Get merchant history",
    description="Returns spending history for a specific merchant",
)
async def get_merchant_history(
    merchant_name: str,
    current_user: CurrentUserDep,
    merchant_spending_repo: MerchantSpendingRepoDep,
    period_type: PeriodType = Query(default=PeriodType.MONTHLY, description="Period granularity"),
    months: int = Query(default=12, ge=1, le=24, description="Number of months of history"),
) -> list[MerchantSpendingHistoryItem]:
    history = merchant_spending_repo.get_merchant_history(
        user_id=current_user.id,
        merchant_name=merchant_name,
        period_type=period_type,
        months=months,
    )

    result: list[MerchantSpendingHistoryItem] = []
    for item in history:
        period_start = _parse_date(item["period_start"])
        _, period_end = get_period_bounds(period_start, period_type)

        result.append(MerchantSpendingHistoryItem(
            merchant_name=item["merchant_name"],
            merchant_id=UUID(item["merchant_id"]) if item.get("merchant_id") else None,
            period_start=period_start,
            period_end=period_end,
            total_amount=Decimal(str(item["total_amount"])),
            transaction_count=item["transaction_count"],
            average_transaction=Decimal(str(item["average_transaction"])) if item.get("average_transaction") else None,
        ))

    return result


@router.get(
    "/spending/categories/range",
    response_model=CategoryBreakdownResponse,
    summary="Get category breakdown for date range",
    description="Returns spending breakdown by category for a custom date range (computed from transactions)",
)
async def get_category_breakdown_by_range(
    current_user: CurrentUserDep,
    transaction_repo: TransactionRepoDep,
    time_range: Literal["week", "month", "year", "all"] = Query(
        default="month",
        description="Time range: week (this week), month (this month), year (this year), all (all time)",
    ),
    limit: int = Query(default=20, ge=1, le=50, description="Number of categories to return"),
) -> CategoryBreakdownResponse:
    today = date.today()

    if time_range == "week":
        start_date = today - timedelta(days=today.weekday())
        end_date = today
    elif time_range == "month":
        start_date = today.replace(day=1)
        end_date = today
    elif time_range == "year":
        start_date = today.replace(month=1, day=1)
        end_date = today
    else:
        start_date = None
        end_date = None

    transactions, _ = transaction_repo.get_by_user_id(
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        pending=False,
        limit=10000,
        offset=0,
    )

    category_data: dict[str, dict[str, Decimal | int]] = defaultdict(
        lambda: {"total": Decimal("0"), "count": 0}
    )
    total_spending = Decimal("0")

    for txn in transactions:
        amount = Decimal(str(txn.get("amount", 0)))
        if amount <= 0:
            continue

        category = txn.get("personal_finance_category_primary") or "UNCATEGORIZED"
        category_data[category]["total"] += amount
        category_data[category]["count"] += 1
        total_spending += amount

    sorted_categories = sorted(
        category_data.items(),
        key=lambda x: x[1]["total"],
        reverse=True,
    )[:limit]

    categories: list[CategorySpendingSummary] = []
    for category_name, data in sorted_categories:
        amount = data["total"]
        count = int(data["count"])
        percentage = (amount / total_spending * 100) if total_spending > 0 else None
        avg = amount / count if count > 0 else None

        categories.append(CategorySpendingSummary(
            category_primary=category_name,
            category_detailed=None,
            total_amount=amount,
            transaction_count=count,
            average_transaction=avg,
            percentage_of_total=percentage,
        ))

    period_start = start_date or date(2000, 1, 1)
    period_end = end_date or today

    return CategoryBreakdownResponse(
        period_type=PeriodType.MONTHLY,
        period_start=period_start,
        period_end=period_end,
        total_spending=total_spending,
        categories=categories,
    )


@router.get(
    "/spending/categories/{category_name}/detail",
    response_model=CategoryDetailResponse,
    summary="Get category detail",
    description="Returns detailed spending for a category including subcategories and top merchants",
)
async def get_category_detail(
    category_name: str,
    current_user: CurrentUserDep,
    transaction_repo: TransactionRepoDep,
    time_range: Literal["week", "month", "year", "all"] = Query(
        default="month",
        description="Time range: week (this week), month (this month), year (this year), all (all time)",
    ),
    subcategory_limit: int = Query(default=10, ge=1, le=20, description="Number of subcategories to return"),
    merchant_limit: int = Query(default=5, ge=1, le=20, description="Number of top merchants to return"),
) -> CategoryDetailResponse:
    today = date.today()

    if time_range == "week":
        start_date = today - timedelta(days=today.weekday())
        end_date = today
    elif time_range == "month":
        start_date = today.replace(day=1)
        end_date = today
    elif time_range == "year":
        start_date = today.replace(month=1, day=1)
        end_date = today
    else:
        start_date = None
        end_date = None

    transactions, _ = transaction_repo.get_by_user_id(
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        pending=False,
        limit=10000,
        offset=0,
    )

    category_total = Decimal("0")
    category_count = 0
    total_all_spending = Decimal("0")

    subcategory_data: dict[str, dict[str, Decimal | int]] = defaultdict(
        lambda: {"total": Decimal("0"), "count": 0}
    )
    merchant_data: dict[str, dict[str, Decimal | int]] = defaultdict(
        lambda: {"total": Decimal("0"), "count": 0}
    )

    for txn in transactions:
        amount = Decimal(str(txn.get("amount", 0)))
        if amount <= 0:
            continue

        total_all_spending += amount
        primary_cat = txn.get("personal_finance_category_primary") or "UNCATEGORIZED"

        if primary_cat == category_name:
            category_total += amount
            category_count += 1

            detailed_cat = txn.get("personal_finance_category_detailed") or "Other"
            subcategory_data[detailed_cat]["total"] += amount
            subcategory_data[detailed_cat]["count"] += 1

            merchant_name = txn.get("merchant_name") or txn.get("name") or "Unknown"
            merchant_data[merchant_name]["total"] += amount
            merchant_data[merchant_name]["count"] += 1

    sorted_subcategories = sorted(
        subcategory_data.items(),
        key=lambda x: x[1]["total"],
        reverse=True,
    )[:subcategory_limit]

    subcategories: list[SubcategorySpendingSummary] = []
    for subcat_name, data in sorted_subcategories:
        amount = data["total"]
        count = int(data["count"])
        percentage = (amount / category_total * 100) if category_total > 0 else None
        avg = amount / count if count > 0 else None

        subcategories.append(SubcategorySpendingSummary(
            category_detailed=subcat_name,
            total_amount=amount,
            transaction_count=count,
            average_transaction=avg,
            percentage_of_category=percentage,
        ))

    sorted_merchants = sorted(
        merchant_data.items(),
        key=lambda x: x[1]["total"],
        reverse=True,
    )[:merchant_limit]

    top_merchants: list[MerchantSpendingSummary] = []
    for merchant_name, data in sorted_merchants:
        amount = data["total"]
        count = int(data["count"])
        percentage = (amount / category_total * 100) if category_total > 0 else None
        avg = amount / count if count > 0 else None

        top_merchants.append(MerchantSpendingSummary(
            merchant_name=merchant_name,
            merchant_id=None,
            total_amount=amount,
            transaction_count=count,
            average_transaction=avg,
            percentage_of_total=percentage,
        ))

    period_start = start_date or date(2000, 1, 1)
    period_end = end_date or today
    avg_transaction = category_total / category_count if category_count > 0 else None
    percentage_of_total = (category_total / total_all_spending * 100) if total_all_spending > 0 else None

    return CategoryDetailResponse(
        category_primary=category_name,
        period_start=period_start,
        period_end=period_end,
        total_amount=category_total,
        transaction_count=category_count,
        average_transaction=avg_transaction,
        percentage_of_total_spending=percentage_of_total,
        subcategories=subcategories,
        top_merchants=top_merchants,
    )


@router.get(
    "/spending/merchants/range",
    response_model=MerchantBreakdownResponse,
    summary="Get merchant breakdown for date range",
    description="Returns spending breakdown by merchant for a custom date range (computed from transactions)",
)
async def get_merchant_breakdown_by_range(
    current_user: CurrentUserDep,
    transaction_repo: TransactionRepoDep,
    time_range: Literal["week", "month", "year", "all"] = Query(
        default="month",
        description="Time range: week (this week), month (this month), year (this year), all (all time)",
    ),
    limit: int = Query(default=10, ge=1, le=50, description="Number of merchants to return"),
) -> MerchantBreakdownResponse:
    today = date.today()

    if time_range == "week":
        start_date = today - timedelta(days=today.weekday())
        end_date = today
    elif time_range == "month":
        start_date = today.replace(day=1)
        end_date = today
    elif time_range == "year":
        start_date = today.replace(month=1, day=1)
        end_date = today
    else:
        start_date = None
        end_date = None

    transactions, _ = transaction_repo.get_by_user_id(
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        pending=False,
        limit=10000,
        offset=0,
    )

    merchant_data: dict[str, dict[str, Decimal | int]] = defaultdict(
        lambda: {"total": Decimal("0"), "count": 0}
    )
    total_spending = Decimal("0")

    for txn in transactions:
        amount = Decimal(str(txn.get("amount", 0)))
        if amount <= 0:
            continue

        merchant_name = txn.get("merchant_name") or txn.get("name") or "Unknown"
        merchant_data[merchant_name]["total"] += amount
        merchant_data[merchant_name]["count"] += 1
        total_spending += amount

    sorted_merchants = sorted(
        merchant_data.items(),
        key=lambda x: x[1]["total"],
        reverse=True,
    )[:limit]

    merchants: list[MerchantSpendingSummary] = []
    for merchant_name, data in sorted_merchants:
        amount = data["total"]
        count = int(data["count"])
        percentage = (amount / total_spending * 100) if total_spending > 0 else None
        avg = amount / count if count > 0 else None

        merchants.append(MerchantSpendingSummary(
            merchant_name=merchant_name,
            merchant_id=None,
            total_amount=amount,
            transaction_count=count,
            average_transaction=avg,
            percentage_of_total=percentage,
        ))

    period_start = start_date or date(2000, 1, 1)
    period_end = end_date or today

    return MerchantBreakdownResponse(
        period_type=PeriodType.MONTHLY,
        period_start=period_start,
        period_end=period_end,
        total_spending=total_spending,
        merchants=merchants,
    )


@router.post(
    "/compute",
    response_model=ComputationResultResponse,
    summary="Trigger analytics computation",
    description="Triggers computation of spending analytics for the current user",
)
@limiter.limit(limits.analytics_write)
async def trigger_computation(
    request: Request,
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


@router.get(
    "/merchants/stats",
    response_model=MerchantStatsListResponse,
    summary="Get merchant lifetime statistics",
    description="Returns lifetime statistics for all merchants",
)
async def get_merchant_stats(
    current_user: CurrentUserDep,
    merchant_stats_repo: MerchantStatsRepoDep,
    sort_by: Literal["spend", "frequency", "recent"] = Query(
        default="spend",
        description="Sort by: spend (lifetime), frequency (transaction count), or recent (last transaction)",
    ),
    limit: int = Query(default=50, ge=1, le=200, description="Number of merchants to return"),
    offset: int = Query(default=0, ge=0, description="Offset for pagination"),
) -> MerchantStatsListResponse:
    sort_field_map = {
        "spend": "total_lifetime_spend",
        "frequency": "total_transaction_count",
        "recent": "last_transaction_date",
    }
    sort_field = sort_field_map[sort_by]

    merchants = merchant_stats_repo.get_all_for_user(
        user_id=current_user.id,
        limit=limit,
        offset=offset,
        sort_by=sort_field,
        descending=True,
    )

    total = merchant_stats_repo.count_for_user(current_user.id)

    return MerchantStatsListResponse(
        merchants=[_to_merchant_stats_response(m) for m in merchants],
        total=total,
    )


@router.get(
    "/merchants/stats/top",
    response_model=MerchantStatsListResponse,
    summary="Get top merchants",
    description="Returns top merchants by spend or frequency",
)
async def get_top_merchants(
    current_user: CurrentUserDep,
    merchant_stats_repo: MerchantStatsRepoDep,
    sort_by: Literal["spend", "frequency"] = Query(
        default="spend",
        description="Sort by: spend (lifetime) or frequency (transaction count)",
    ),
    limit: int = Query(default=10, ge=1, le=50, description="Number of merchants to return"),
) -> MerchantStatsListResponse:
    if sort_by == "spend":
        merchants = merchant_stats_repo.get_top_by_spend(current_user.id, limit)
    else:
        merchants = merchant_stats_repo.get_top_by_frequency(current_user.id, limit)

    return MerchantStatsListResponse(
        merchants=[_to_merchant_stats_response(m) for m in merchants],
        total=len(merchants),
    )


@router.get(
    "/merchants/stats/recurring",
    response_model=MerchantStatsListResponse,
    summary="Get recurring merchants",
    description="Returns merchants linked to recurring streams (subscriptions)",
)
async def get_recurring_merchants(
    current_user: CurrentUserDep,
    merchant_stats_repo: MerchantStatsRepoDep,
    limit: int = Query(default=50, ge=1, le=100, description="Number of merchants to return"),
) -> MerchantStatsListResponse:
    merchants = merchant_stats_repo.get_recurring_merchants(current_user.id, limit)

    return MerchantStatsListResponse(
        merchants=[_to_merchant_stats_response(m) for m in merchants],
        total=len(merchants),
    )


@router.get(
    "/merchants/stats/{merchant_name}",
    response_model=MerchantStatsResponse,
    summary="Get merchant detail",
    description="Returns detailed lifetime statistics for a specific merchant",
)
async def get_merchant_detail(
    merchant_name: str,
    current_user: CurrentUserDep,
    merchant_stats_repo: MerchantStatsRepoDep,
) -> MerchantStatsResponse:
    merchant = merchant_stats_repo.get_by_merchant_name(current_user.id, merchant_name)

    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Merchant '{merchant_name}' not found",
        )

    return _to_merchant_stats_response(merchant)


@router.post(
    "/merchants/stats/compute",
    response_model=MerchantStatsComputationResult,
    summary="Trigger merchant stats computation",
    description="Triggers computation of merchant lifetime statistics",
)
@limiter.limit(limits.analytics_write)
async def trigger_merchant_stats_computation(
    request: Request,
    current_user: CurrentUserDep,
    merchant_stats_aggregator: MerchantStatsAggregatorDep,
    force_full: bool = Query(default=False, description="Force full recomputation"),
) -> MerchantStatsComputationResult:
    return merchant_stats_aggregator.compute_for_user(
        user_id=current_user.id,
        full_recompute=force_full,
    )


@router.get(
    "/cash-flow",
    response_model=CashFlowMetricsListResponse,
    summary="Get cash flow metrics",
    description="Returns cash flow metrics for multiple periods with savings rate",
)
async def get_cash_flow_metrics(
    current_user: CurrentUserDep,
    cash_flow_repo: CashFlowRepoDep,
    periods: int = Query(default=12, ge=1, le=24, description="Number of periods to return"),
) -> CashFlowMetricsListResponse:
    periods_data = cash_flow_repo.get_periods_for_user(
        user_id=current_user.id,
        limit=periods,
    )

    avg_savings_rate = cash_flow_repo.get_average_savings_rate(current_user.id, months=6)

    return CashFlowMetricsListResponse(
        periods=[_to_cash_flow_response(p) for p in periods_data],
        total_periods=len(periods_data),
        average_savings_rate=Decimal(str(avg_savings_rate)) if avg_savings_rate is not None else None,
    )


@router.get(
    "/cash-flow/current",
    response_model=CashFlowMetricsResponse,
    summary="Get current month cash flow",
    description="Returns cash flow metrics for the current month",
)
async def get_current_cash_flow(
    current_user: CurrentUserDep,
    cash_flow_repo: CashFlowRepoDep,
) -> CashFlowMetricsResponse:
    current_period_start = get_current_period_start(PeriodType.MONTHLY)

    metrics = cash_flow_repo.get_by_user_and_period(
        user_id=current_user.id,
        period_start=current_period_start,
    )

    if not metrics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cash flow metrics not found for current period",
        )

    return _to_cash_flow_response(metrics)


@router.get(
    "/income-sources",
    response_model=IncomeSourceListResponse,
    summary="Get detected income sources",
    description="Returns all detected income sources for the user",
)
async def get_income_sources(
    current_user: CurrentUserDep,
    income_source_repo: IncomeSourceRepoDep,
    active_only: bool = Query(default=True, description="Only return active income sources"),
) -> IncomeSourceListResponse:
    sources = income_source_repo.get_by_user_id(
        user_id=current_user.id,
        active_only=active_only,
    )

    high_confidence = income_source_repo.get_high_confidence(current_user.id)

    return IncomeSourceListResponse(
        sources=[_to_income_source_response(s) for s in sources],
        total=len(sources),
        high_confidence_count=len(high_confidence),
    )


@router.post(
    "/cash-flow/compute",
    response_model=CashFlowComputationResultResponse,
    summary="Trigger cash flow computation",
    description="Triggers computation of cash flow metrics and income detection",
)
@limiter.limit(limits.analytics_write)
async def trigger_cash_flow_computation(
    request: Request,
    current_user: CurrentUserDep,
    cash_flow_aggregator: CashFlowAggregatorDep,
    force_full: bool = Query(default=False, description="Force full recomputation"),
) -> CashFlowComputationResultResponse:
    result = cash_flow_aggregator.compute_for_user(
        user_id=current_user.id,
        force_full_recompute=force_full,
    )

    return CashFlowComputationResultResponse(
        status=result.status,
        periods_computed=result.periods_computed,
        income_sources_detected=result.income_sources_detected,
        transactions_processed=result.transactions_processed,
        computation_time_ms=result.computation_time_ms,
        error_message=result.error_message,
    )


def _to_cash_flow_response(metrics: dict) -> CashFlowMetricsResponse:
    return CashFlowMetricsResponse(
        id=UUID(metrics["id"]),
        user_id=UUID(metrics["user_id"]),
        period_start=_parse_date(metrics["period_start"]),
        total_income=Decimal(str(metrics["total_income"])),
        total_expenses=Decimal(str(metrics["total_expenses"])),
        net_cash_flow=Decimal(str(metrics["net_cash_flow"])),
        savings_rate=Decimal(str(metrics["savings_rate"])) if metrics.get("savings_rate") else None,
        recurring_expenses=Decimal(str(metrics["recurring_expenses"])),
        discretionary_expenses=Decimal(str(metrics["discretionary_expenses"])),
        income_sources_count=metrics["income_sources_count"],
        expense_categories_count=metrics["expense_categories_count"],
        largest_expense_category=metrics.get("largest_expense_category"),
        largest_expense_amount=(
            Decimal(str(metrics["largest_expense_amount"]))
            if metrics.get("largest_expense_amount") else None
        ),
        created_at=metrics["created_at"],
        updated_at=metrics["updated_at"],
    )


def _to_income_source_response(source: dict) -> IncomeSourceResponse:
    return IncomeSourceResponse(
        id=UUID(source["id"]),
        user_id=UUID(source["user_id"]),
        source_name=source["source_name"],
        source_type=source["source_type"],
        frequency=source["frequency"],
        average_amount=Decimal(str(source["average_amount"])),
        last_amount=Decimal(str(source["last_amount"])),
        first_date=_parse_date(source["first_date"]),
        last_date=_parse_date(source["last_date"]),
        next_expected_date=_parse_date(source["next_expected_date"]) if source.get("next_expected_date") else None,
        transaction_count=source["transaction_count"],
        confidence_score=Decimal(str(source["confidence_score"])),
        is_active=source["is_active"],
        account_id=UUID(source["account_id"]) if source.get("account_id") else None,
        created_at=source["created_at"],
        updated_at=source["updated_at"],
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


def _to_merchant_stats_response(merchant: dict) -> MerchantStatsResponse:
    return MerchantStatsResponse(
        id=UUID(merchant["id"]),
        user_id=UUID(merchant["user_id"]),
        merchant_name=merchant["merchant_name"],
        merchant_id=UUID(merchant["merchant_id"]) if merchant.get("merchant_id") else None,
        first_transaction_date=_parse_date(merchant["first_transaction_date"]),
        last_transaction_date=_parse_date(merchant["last_transaction_date"]),
        total_lifetime_spend=Decimal(str(merchant["total_lifetime_spend"])),
        total_transaction_count=merchant["total_transaction_count"],
        average_transaction_amount=Decimal(str(merchant["average_transaction_amount"])) if merchant.get("average_transaction_amount") else None,
        median_transaction_amount=Decimal(str(merchant["median_transaction_amount"])) if merchant.get("median_transaction_amount") else None,
        max_transaction_amount=Decimal(str(merchant["max_transaction_amount"])) if merchant.get("max_transaction_amount") else None,
        min_transaction_amount=Decimal(str(merchant["min_transaction_amount"])) if merchant.get("min_transaction_amount") else None,
        average_days_between_transactions=Decimal(str(merchant["average_days_between_transactions"])) if merchant.get("average_days_between_transactions") else None,
        most_frequent_day_of_week=merchant.get("most_frequent_day_of_week"),
        most_frequent_hour_of_day=merchant.get("most_frequent_hour_of_day"),
        is_recurring=merchant.get("is_recurring", False),
        recurring_stream_id=UUID(merchant["recurring_stream_id"]) if merchant.get("recurring_stream_id") else None,
        primary_category=merchant.get("primary_category"),
        created_at=merchant["created_at"],
        updated_at=merchant["updated_at"],
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
