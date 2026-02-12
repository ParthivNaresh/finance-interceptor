import type { FrequencyType } from './recurring';

export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type ComputationStatus = 'success' | 'failed' | 'in_progress';

export type MerchantStatsSortBy = 'spend' | 'frequency' | 'recent';

export interface SpendingPeriod {
  id: string;
  user_id: string;
  period_type: PeriodType;
  period_start: string;
  period_end: string;
  total_inflow: string;
  total_outflow: string;
  net_flow: string;
  total_inflow_excluding_transfers: string;
  total_outflow_excluding_transfers: string;
  net_flow_excluding_transfers: string;
  transaction_count: number;
  is_finalized: boolean;
  created_at: string;
  updated_at: string;
  previous_period_outflow: string | null;
  change_amount: string | null;
  change_percentage: string | null;
}

export interface CategorySpendingSummary {
  category_primary: string;
  category_detailed: string | null;
  total_amount: string;
  transaction_count: number;
  average_transaction: string | null;
  percentage_of_total: string | null;
}

export interface MerchantSpendingSummary {
  merchant_name: string;
  merchant_id: string | null;
  total_amount: string;
  transaction_count: number;
  average_transaction: string | null;
  percentage_of_total: string | null;
}

export interface MerchantSpendingHistoryItem {
  merchant_name: string;
  merchant_id: string | null;
  period_start: string;
  period_end: string;
  total_amount: string;
  transaction_count: number;
  average_transaction: string | null;
}

export interface MerchantStats {
  id: string;
  user_id: string;
  merchant_name: string;
  merchant_id: string | null;
  first_transaction_date: string;
  last_transaction_date: string;
  total_lifetime_spend: string;
  total_transaction_count: number;
  average_transaction_amount: string | null;
  median_transaction_amount: string | null;
  max_transaction_amount: string | null;
  min_transaction_amount: string | null;
  average_days_between_transactions: string | null;
  most_frequent_day_of_week: number | null;
  most_frequent_hour_of_day: number | null;
  is_recurring: boolean;
  recurring_stream_id: string | null;
  primary_category: string | null;
  created_at: string;
  updated_at: string;
}

export interface SpendingSummaryListResponse {
  periods: SpendingPeriod[];
  total_periods: number;
}

export interface SpendingSummaryResponse {
  period_type: PeriodType;
  period_start: string;
  period_end: string;
  total_spending: string;
  total_income: string;
  net_flow: string;
  transaction_count: number;
  top_categories: CategorySpendingSummary[];
  month_over_month_change: string | null;
  rolling_average_3mo: string | null;
  rolling_average_6mo: string | null;
}

export interface CategoryBreakdownResponse {
  period_type: PeriodType;
  period_start: string;
  period_end: string;
  total_spending: string;
  categories: CategorySpendingSummary[];
}

export interface MerchantBreakdownResponse {
  period_type: PeriodType;
  period_start: string;
  period_end: string;
  total_spending: string;
  merchants: MerchantSpendingSummary[];
}

export interface MerchantStatsListResponse {
  merchants: MerchantStats[];
  total: number;
}

export interface MerchantStatsComputationResult {
  status: ComputationStatus;
  merchants_computed: number;
  transactions_processed: number;
  computation_time_ms: number;
  error_message: string | null;
}

export interface ComputationResultResponse {
  status: ComputationStatus;
  periods_computed: number;
  categories_computed: number;
  merchants_computed: number;
  transactions_processed: number;
  computation_time_ms: number;
  error_message: string | null;
}

export interface SpendingPeriodParams {
  periodType?: PeriodType;
  periods?: number;
}

export interface CategoryBreakdownParams {
  periodStart?: string;
  periodType?: PeriodType;
}

export interface MerchantBreakdownParams {
  periodStart?: string;
  periodType?: PeriodType;
  limit?: number;
}

export interface CategoryHistoryParams {
  category: string;
  periodType?: PeriodType;
  months?: number;
}

export interface MerchantHistoryParams {
  merchantName: string;
  periodType?: PeriodType;
  months?: number;
}

export interface MerchantStatsParams {
  sortBy?: MerchantStatsSortBy;
  limit?: number;
  offset?: number;
}

export interface TopMerchantsParams {
  sortBy?: 'spend' | 'frequency';
  limit?: number;
}

export interface SubcategorySpendingSummary {
  category_detailed: string;
  total_amount: string;
  transaction_count: number;
  average_transaction: string | null;
  percentage_of_category: string | null;
}

export interface CategoryDetailResponse {
  category_primary: string;
  period_start: string;
  period_end: string;
  total_amount: string;
  transaction_count: number;
  average_transaction: string | null;
  percentage_of_total_spending: string | null;
  subcategories: SubcategorySpendingSummary[];
  top_merchants: MerchantSpendingSummary[];
}

export interface CategorySpendingHistoryItem {
  category_primary: string;
  period_start: string;
  period_end: string;
  total_amount: string;
  transaction_count: number;
  average_transaction: string | null;
}

export type IncomeSourceType = 'salary' | 'freelance' | 'investment' | 'transfer' | 'refund' | 'other';

export interface CashFlowMetrics {
  id: string;
  user_id: string;
  period_start: string;
  total_income: string;
  total_expenses: string;
  net_cash_flow: string;
  savings_rate: string | null;
  recurring_expenses: string;
  discretionary_expenses: string;
  income_sources_count: number;
  expense_categories_count: number;
  largest_expense_category: string | null;
  largest_expense_amount: string | null;
  created_at: string;
  updated_at: string;
}

export interface CashFlowMetricsListResponse {
  periods: CashFlowMetrics[];
  total_periods: number;
  average_savings_rate: string | null;
}

export interface IncomeSource {
  id: string;
  user_id: string;
  source_name: string;
  source_type: IncomeSourceType;
  frequency: FrequencyType;
  average_amount: string;
  last_amount: string;
  first_date: string;
  last_date: string;
  next_expected_date: string | null;
  transaction_count: number;
  confidence_score: string;
  is_active: boolean;
  account_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncomeSourceListResponse {
  sources: IncomeSource[];
  total: number;
  high_confidence_count: number;
}

export interface CashFlowComputationResult {
  status: ComputationStatus;
  periods_computed: number;
  income_sources_detected: number;
  transactions_processed: number;
  computation_time_ms: number;
  error_message: string | null;
}

export interface CashFlowParams {
  periods?: number;
}

export interface IncomeSourceParams {
  activeOnly?: boolean;
}

export type BaselineType = 'rolling_3mo' | 'rolling_6mo' | 'fixed';

export type CreepSeverity = 'none' | 'low' | 'medium' | 'high';

export interface LifestyleBaseline {
  id: string;
  user_id: string;
  category_primary: string;
  baseline_type: BaselineType;
  baseline_monthly_amount: string;
  baseline_transaction_count: number;
  baseline_period_start: string;
  baseline_period_end: string;
  baseline_months_count: number;
  baseline_std_deviation: string | null;
  seasonal_adjustment_factor: string | null;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface LifestyleBaselineListResponse {
  baselines: LifestyleBaseline[];
  total: number;
  is_locked: boolean;
}

export interface CategoryCreepSummary {
  category_primary: string;
  baseline_amount: string;
  current_amount: string;
  absolute_change: string;
  percentage_change: string;
  severity: CreepSeverity;
  is_seasonal: boolean;
  seasonal_months: number[] | null;
  trend_direction: string | null;
  consecutive_months_elevated: number;
  z_score: string | null;
}

export interface LifestyleCreepSummary {
  period_start: string;
  total_baseline_discretionary: string;
  total_current_discretionary: string;
  overall_creep_percentage: string;
  overall_severity: CreepSeverity;
  discretionary_ratio: string | null;
  income_for_period: string | null;
  categories_with_sustained_creep: number;
  income_growth_percentage: string | null;
  income_adjusted_creep_percentage: string | null;
  top_creeping_categories: CategoryCreepSummary[];
  improving_categories: CategoryCreepSummary[];
}

export interface LifestyleCreepListResponse {
  periods: LifestyleCreepSummary[];
  total: number;
}

export interface LifestyleCreepComputationResult {
  status: ComputationStatus;
  baselines_computed: number;
  creep_scores_computed: number;
  categories_analyzed: number;
  computation_time_ms: number;
  error_message: string | null;
}

export interface BaselineLockResponse {
  locked_count: number;
  message: string;
}

export interface BaselineUnlockResponse {
  unlocked_count: number;
  message: string;
}

export interface LifestyleCreepParams {
  periodStart?: string;
}

export interface LifestyleCreepHistoryParams {
  periods?: number;
}

export interface CategoryCreepHistoryParams {
  categoryName: string;
  periods?: number;
}

export interface LifestyleCreepComputeParams {
  periods?: number;
  forceRecompute?: boolean;
}

export type TargetStatusType = 'building' | 'established';

export interface TargetStatusResponse {
  status: TargetStatusType;
  months_available: number;
  months_required: number;
  established_at: string | null;
  target_period_start: string | null;
  target_period_end: string | null;
  categories_count: number;
  next_review_at: string | null;
}

export type PacingStatus = 'on_track' | 'ahead' | 'behind';

export type PacingMode = 'kickoff' | 'pacing' | 'stability';

export interface PacingResponse {
  mode: PacingMode;
  period_start: string;
  period_end: string;
  days_into_period: number;
  total_days_in_period: number;
  target_amount: string;
  current_discretionary_spend: string;
  pacing_percentage: string;
  expected_pacing_percentage: string;
  pacing_status: PacingStatus;
  pacing_difference: string;
  stability_score: number | null;
  overall_severity: CreepSeverity | null;
  top_drifting_category: CategoryCreepSummary | null;
}
