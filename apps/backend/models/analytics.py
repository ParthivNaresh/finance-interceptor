from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from models.enums import ComputationStatus, PeriodType


class SpendingPeriodBase(BaseModel):
    period_type: PeriodType
    period_start: date
    period_end: date
    total_inflow: Decimal = Decimal("0")
    total_outflow: Decimal = Decimal("0")
    net_flow: Decimal = Decimal("0")
    total_inflow_excluding_transfers: Decimal = Decimal("0")
    total_outflow_excluding_transfers: Decimal = Decimal("0")
    net_flow_excluding_transfers: Decimal = Decimal("0")
    transaction_count: int = 0
    is_finalized: bool = False


class SpendingPeriodCreate(SpendingPeriodBase):
    user_id: UUID


class SpendingPeriodUpdate(BaseModel):
    total_inflow: Decimal | None = None
    total_outflow: Decimal | None = None
    net_flow: Decimal | None = None
    total_inflow_excluding_transfers: Decimal | None = None
    total_outflow_excluding_transfers: Decimal | None = None
    net_flow_excluding_transfers: Decimal | None = None
    transaction_count: int | None = None
    is_finalized: bool | None = None


class SpendingPeriodResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    period_type: PeriodType
    period_start: date
    period_end: date
    total_inflow: Decimal
    total_outflow: Decimal
    net_flow: Decimal
    total_inflow_excluding_transfers: Decimal
    total_outflow_excluding_transfers: Decimal
    net_flow_excluding_transfers: Decimal
    transaction_count: int
    is_finalized: bool
    created_at: datetime
    updated_at: datetime


class SpendingPeriodWithDelta(SpendingPeriodResponse):
    previous_period_outflow: Decimal | None = None
    change_amount: Decimal | None = None
    change_percentage: Decimal | None = None


class CategorySpendingBase(BaseModel):
    period_type: PeriodType
    period_start: date
    category_primary: str
    category_detailed: str | None = None
    total_amount: Decimal = Decimal("0")
    transaction_count: int = 0
    average_transaction: Decimal | None = None
    largest_transaction: Decimal | None = None


class CategorySpendingCreate(CategorySpendingBase):
    user_id: UUID


class CategorySpendingUpdate(BaseModel):
    total_amount: Decimal | None = None
    transaction_count: int | None = None
    average_transaction: Decimal | None = None
    largest_transaction: Decimal | None = None


class CategorySpendingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    period_type: PeriodType
    period_start: date
    category_primary: str
    category_detailed: str | None
    total_amount: Decimal
    transaction_count: int
    average_transaction: Decimal | None
    largest_transaction: Decimal | None
    created_at: datetime
    updated_at: datetime


class CategorySpendingSummary(BaseModel):
    category_primary: str
    category_detailed: str | None = None
    total_amount: Decimal
    transaction_count: int
    average_transaction: Decimal | None = None
    percentage_of_total: Decimal | None = None


class MerchantSpendingBase(BaseModel):
    period_type: PeriodType = PeriodType.MONTHLY
    period_start: date
    merchant_name: str
    merchant_id: UUID | None = None
    total_amount: Decimal = Decimal("0")
    transaction_count: int = 0
    average_transaction: Decimal | None = None


class MerchantSpendingCreate(MerchantSpendingBase):
    user_id: UUID


class MerchantSpendingUpdate(BaseModel):
    total_amount: Decimal | None = None
    transaction_count: int | None = None
    average_transaction: Decimal | None = None


class MerchantSpendingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    period_type: PeriodType
    period_start: date
    merchant_name: str
    merchant_id: UUID | None
    total_amount: Decimal
    transaction_count: int
    average_transaction: Decimal | None
    created_at: datetime
    updated_at: datetime


class MerchantSpendingSummary(BaseModel):
    merchant_name: str
    merchant_id: UUID | None = None
    total_amount: Decimal
    transaction_count: int
    average_transaction: Decimal | None = None
    percentage_of_total: Decimal | None = None


class MerchantSpendingHistoryItem(BaseModel):
    merchant_name: str
    merchant_id: UUID | None = None
    period_start: date
    period_end: date
    total_amount: Decimal
    transaction_count: int
    average_transaction: Decimal | None = None


class AnalyticsComputationLogBase(BaseModel):
    computation_type: str
    status: ComputationStatus = ComputationStatus.IN_PROGRESS
    last_transaction_date: date | None = None
    last_transaction_id: UUID | None = None
    computation_duration_ms: int | None = None
    rows_affected: int | None = None
    error_message: str | None = None


class AnalyticsComputationLogCreate(AnalyticsComputationLogBase):
    user_id: UUID


class AnalyticsComputationLogUpdate(BaseModel):
    status: ComputationStatus | None = None
    last_transaction_date: date | None = None
    last_transaction_id: UUID | None = None
    computation_duration_ms: int | None = None
    rows_affected: int | None = None
    error_message: str | None = None
    last_computed_at: datetime | None = None


class AnalyticsComputationLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    computation_type: str
    last_computed_at: datetime
    last_transaction_date: date | None
    last_transaction_id: UUID | None
    computation_duration_ms: int | None
    rows_affected: int | None
    status: ComputationStatus
    error_message: str | None


class SpendingSummaryResponse(BaseModel):
    period_type: PeriodType
    period_start: date
    period_end: date
    total_spending: Decimal
    total_income: Decimal
    net_flow: Decimal
    transaction_count: int
    top_categories: list[CategorySpendingSummary] = Field(default_factory=list)
    month_over_month_change: Decimal | None = None
    rolling_average_3mo: Decimal | None = None
    rolling_average_6mo: Decimal | None = None


class SpendingSummaryListResponse(BaseModel):
    periods: list[SpendingPeriodWithDelta]
    total_periods: int


class CategoryBreakdownResponse(BaseModel):
    period_type: PeriodType
    period_start: date
    period_end: date
    total_spending: Decimal
    categories: list[CategorySpendingSummary]


class MerchantBreakdownResponse(BaseModel):
    period_type: PeriodType
    period_start: date
    period_end: date
    total_spending: Decimal
    merchants: list[MerchantSpendingSummary]


class ComputationResultResponse(BaseModel):
    status: ComputationStatus
    periods_computed: int
    categories_computed: int
    merchants_computed: int
    transactions_processed: int
    computation_time_ms: int
    error_message: str | None = None


class MerchantStatsBase(BaseModel):
    merchant_name: str
    merchant_id: UUID | None = None
    first_transaction_date: date
    last_transaction_date: date
    total_lifetime_spend: Decimal = Decimal("0")
    total_transaction_count: int = 0
    average_transaction_amount: Decimal | None = None
    median_transaction_amount: Decimal | None = None
    max_transaction_amount: Decimal | None = None
    min_transaction_amount: Decimal | None = None
    average_days_between_transactions: Decimal | None = None
    most_frequent_day_of_week: int | None = None
    most_frequent_hour_of_day: int | None = None
    is_recurring: bool = False
    recurring_stream_id: UUID | None = None
    primary_category: str | None = None


class MerchantStatsCreate(MerchantStatsBase):
    user_id: UUID


class MerchantStatsUpdate(BaseModel):
    first_transaction_date: date | None = None
    last_transaction_date: date | None = None
    total_lifetime_spend: Decimal | None = None
    total_transaction_count: int | None = None
    average_transaction_amount: Decimal | None = None
    median_transaction_amount: Decimal | None = None
    max_transaction_amount: Decimal | None = None
    min_transaction_amount: Decimal | None = None
    average_days_between_transactions: Decimal | None = None
    most_frequent_day_of_week: int | None = None
    most_frequent_hour_of_day: int | None = None
    is_recurring: bool | None = None
    recurring_stream_id: UUID | None = None
    primary_category: str | None = None


class MerchantStatsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    merchant_name: str
    merchant_id: UUID | None
    first_transaction_date: date
    last_transaction_date: date
    total_lifetime_spend: Decimal
    total_transaction_count: int
    average_transaction_amount: Decimal | None
    median_transaction_amount: Decimal | None
    max_transaction_amount: Decimal | None
    min_transaction_amount: Decimal | None
    average_days_between_transactions: Decimal | None
    most_frequent_day_of_week: int | None
    most_frequent_hour_of_day: int | None
    is_recurring: bool
    recurring_stream_id: UUID | None
    primary_category: str | None
    created_at: datetime
    updated_at: datetime


class MerchantStatsSummary(BaseModel):
    merchant_name: str
    merchant_id: UUID | None = None
    total_lifetime_spend: Decimal
    total_transaction_count: int
    average_transaction_amount: Decimal | None = None
    first_transaction_date: date
    last_transaction_date: date
    is_recurring: bool = False
    primary_category: str | None = None


class MerchantStatsListResponse(BaseModel):
    merchants: list[MerchantStatsResponse]
    total: int


class MerchantStatsComputationResult(BaseModel):
    status: ComputationStatus
    merchants_computed: int
    transactions_processed: int
    computation_time_ms: int
    error_message: str | None = None


class SubcategorySpendingSummary(BaseModel):
    category_detailed: str
    total_amount: Decimal
    transaction_count: int
    average_transaction: Decimal | None = None
    percentage_of_category: Decimal | None = None


class CategoryDetailResponse(BaseModel):
    category_primary: str
    period_start: date
    period_end: date
    total_amount: Decimal
    transaction_count: int
    average_transaction: Decimal | None = None
    percentage_of_total_spending: Decimal | None = None
    subcategories: list[SubcategorySpendingSummary] = Field(default_factory=list)
    top_merchants: list[MerchantSpendingSummary] = Field(default_factory=list)


class CategorySpendingHistoryItem(BaseModel):
    category_primary: str
    period_start: date
    period_end: date
    total_amount: Decimal
    transaction_count: int
    average_transaction: Decimal | None = None


class CashFlowMetricsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    period_start: date
    total_income: Decimal
    total_expenses: Decimal
    net_cash_flow: Decimal
    savings_rate: Decimal | None
    recurring_expenses: Decimal
    discretionary_expenses: Decimal
    income_sources_count: int
    expense_categories_count: int
    largest_expense_category: str | None
    largest_expense_amount: Decimal | None
    created_at: datetime
    updated_at: datetime


class CashFlowMetricsSummary(BaseModel):
    period_start: date
    total_income: Decimal
    total_expenses: Decimal
    net_cash_flow: Decimal
    savings_rate: Decimal | None
    recurring_expenses: Decimal
    discretionary_expenses: Decimal


class CashFlowMetricsListResponse(BaseModel):
    periods: list[CashFlowMetricsResponse]
    total_periods: int
    average_savings_rate: Decimal | None = None


class IncomeSourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    source_name: str
    source_type: str
    frequency: str
    average_amount: Decimal
    last_amount: Decimal
    first_date: date
    last_date: date
    next_expected_date: date | None
    transaction_count: int
    confidence_score: Decimal
    is_active: bool
    account_id: UUID | None
    created_at: datetime
    updated_at: datetime


class IncomeSourceListResponse(BaseModel):
    sources: list[IncomeSourceResponse]
    total: int
    high_confidence_count: int


class CashFlowComputationResultResponse(BaseModel):
    status: ComputationStatus
    periods_computed: int
    income_sources_detected: int
    transactions_processed: int
    computation_time_ms: int
    error_message: str | None = None
