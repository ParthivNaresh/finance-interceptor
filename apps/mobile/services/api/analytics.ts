import type {
  BaselineLockResponse,
  BaselineUnlockResponse,
  CashFlowComputationResult,
  CashFlowMetrics,
  CashFlowMetricsListResponse,
  CashFlowParams,
  CategoryBreakdownParams,
  CategoryBreakdownResponse,
  CategoryCreepHistoryParams,
  CategoryCreepSummary,
  CategoryDetailResponse,
  CategoryHistoryParams,
  CategorySpendingHistoryItem,
  CategorySpendingSummary,
  ComputationResultResponse,
  IncomeSourceListResponse,
  IncomeSourceParams,
  LifestyleBaselineListResponse,
  LifestyleCreepComputationResult,
  LifestyleCreepComputeParams,
  LifestyleCreepHistoryParams,
  LifestyleCreepListResponse,
  LifestyleCreepParams,
  LifestyleCreepSummary,
  MerchantBreakdownParams,
  MerchantBreakdownResponse,
  MerchantHistoryParams,
  MerchantSpendingHistoryItem,
  MerchantStats,
  MerchantStatsComputationResult,
  MerchantStatsListResponse,
  MerchantStatsParams,
  PacingResponse,
  PeriodType,
  SpendingPeriodParams,
  SpendingSummaryListResponse,
  SpendingSummaryResponse,
  TargetStatusResponse,
  TopMerchantsParams,
} from '@/types';

import { apiClient } from './client';

const DEFAULT_PERIOD_TYPE: PeriodType = 'monthly';
const DEFAULT_PERIODS = 6;
const DEFAULT_MERCHANT_LIMIT = 10;
const DEFAULT_HISTORY_MONTHS = 12;
const DEFAULT_STATS_LIMIT = 50;

export type MerchantTimeRange = 'week' | 'month' | 'year' | 'all';

function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

export const analyticsApi = {
  getSpendingSummaries: ({
    periodType = DEFAULT_PERIOD_TYPE,
    periods = DEFAULT_PERIODS,
  }: SpendingPeriodParams = {}): Promise<SpendingSummaryListResponse> => {
    const query = buildQueryString({
      period_type: periodType,
      periods,
    });
    return apiClient.get<SpendingSummaryListResponse>(`/api/analytics/spending${query}`);
  },

  getCurrentSpending: (periodType: PeriodType = DEFAULT_PERIOD_TYPE): Promise<SpendingSummaryResponse> => {
    const query = buildQueryString({ period_type: periodType });
    return apiClient.get<SpendingSummaryResponse>(`/api/analytics/spending/current${query}`);
  },

  getCategoryBreakdown: ({
    periodStart,
    periodType = DEFAULT_PERIOD_TYPE,
  }: CategoryBreakdownParams = {}): Promise<CategoryBreakdownResponse> => {
    const query = buildQueryString({
      period_start: periodStart,
      period_type: periodType,
    });
    return apiClient.get<CategoryBreakdownResponse>(`/api/analytics/spending/categories${query}`);
  },

  getMerchantBreakdown: ({
    periodStart,
    periodType = DEFAULT_PERIOD_TYPE,
    limit = DEFAULT_MERCHANT_LIMIT,
  }: MerchantBreakdownParams = {}): Promise<MerchantBreakdownResponse> => {
    const query = buildQueryString({
      period_start: periodStart,
      period_type: periodType,
      limit,
    });
    return apiClient.get<MerchantBreakdownResponse>(`/api/analytics/spending/merchants${query}`);
  },

  getCategoryHistory: ({
    category,
    periodType = DEFAULT_PERIOD_TYPE,
    months = DEFAULT_HISTORY_MONTHS,
  }: CategoryHistoryParams): Promise<CategorySpendingSummary[]> => {
    const encodedCategory = encodeURIComponent(category);
    const query = buildQueryString({
      period_type: periodType,
      months,
    });
    return apiClient.get<CategorySpendingSummary[]>(
      `/api/analytics/spending/category/${encodedCategory}${query}`
    );
  },

  getMerchantHistory: ({
    merchantName,
    periodType = DEFAULT_PERIOD_TYPE,
    months = DEFAULT_HISTORY_MONTHS,
  }: MerchantHistoryParams): Promise<MerchantSpendingHistoryItem[]> => {
    const encodedMerchant = encodeURIComponent(merchantName);
    const query = buildQueryString({
      period_type: periodType,
      months,
    });
    return apiClient.get<MerchantSpendingHistoryItem[]>(
      `/api/analytics/spending/merchant/${encodedMerchant}${query}`
    );
  },

  triggerComputation: (forceFull: boolean = false): Promise<ComputationResultResponse> => {
    const query = buildQueryString({ force_full: forceFull });
    return apiClient.post<ComputationResultResponse>(`/api/analytics/compute${query}`, {});
  },

  getMerchantStats: ({
    sortBy = 'spend',
    limit = DEFAULT_STATS_LIMIT,
    offset = 0,
  }: MerchantStatsParams = {}): Promise<MerchantStatsListResponse> => {
    const query = buildQueryString({
      sort_by: sortBy,
      limit,
      offset,
    });
    return apiClient.get<MerchantStatsListResponse>(`/api/analytics/merchants/stats${query}`);
  },

  getTopMerchantStats: ({
    sortBy = 'spend',
    limit = DEFAULT_MERCHANT_LIMIT,
  }: TopMerchantsParams = {}): Promise<MerchantStatsListResponse> => {
    const query = buildQueryString({
      sort_by: sortBy,
      limit,
    });
    return apiClient.get<MerchantStatsListResponse>(`/api/analytics/merchants/stats/top${query}`);
  },

  getRecurringMerchantStats: (limit: number = DEFAULT_STATS_LIMIT): Promise<MerchantStatsListResponse> => {
    const query = buildQueryString({ limit });
    return apiClient.get<MerchantStatsListResponse>(`/api/analytics/merchants/stats/recurring${query}`);
  },

  getMerchantStatsDetail: (merchantName: string): Promise<MerchantStats> => {
    const encodedMerchant = encodeURIComponent(merchantName);
    return apiClient.get<MerchantStats>(`/api/analytics/merchants/stats/${encodedMerchant}`);
  },

  triggerMerchantStatsComputation: (forceFull: boolean = false): Promise<MerchantStatsComputationResult> => {
    const query = buildQueryString({ force_full: forceFull });
    return apiClient.post<MerchantStatsComputationResult>(`/api/analytics/merchants/stats/compute${query}`, {});
  },

  getMerchantBreakdownByRange: (
    timeRange: MerchantTimeRange = 'month',
    limit: number = DEFAULT_MERCHANT_LIMIT
  ): Promise<MerchantBreakdownResponse> => {
    const query = buildQueryString({
      time_range: timeRange,
      limit,
    });
    return apiClient.get<MerchantBreakdownResponse>(`/api/analytics/spending/merchants/range${query}`);
  },

  getCategoryBreakdownByRange: (
    timeRange: MerchantTimeRange = 'month',
    limit: number = 20
  ): Promise<CategoryBreakdownResponse> => {
    const query = buildQueryString({
      time_range: timeRange,
      limit,
    });
    return apiClient.get<CategoryBreakdownResponse>(`/api/analytics/spending/categories/range${query}`);
  },

  getCategoryDetail: (
    categoryName: string,
    timeRange: MerchantTimeRange = 'month',
    subcategoryLimit: number = 10,
    merchantLimit: number = 5
  ): Promise<CategoryDetailResponse> => {
    const encodedCategory = encodeURIComponent(categoryName);
    const query = buildQueryString({
      time_range: timeRange,
      subcategory_limit: subcategoryLimit,
      merchant_limit: merchantLimit,
    });
    return apiClient.get<CategoryDetailResponse>(
      `/api/analytics/spending/categories/${encodedCategory}/detail${query}`
    );
  },

  getCategorySpendingHistory: (
    categoryName: string,
    periodType: PeriodType = DEFAULT_PERIOD_TYPE,
    months: number = DEFAULT_HISTORY_MONTHS
  ): Promise<CategorySpendingHistoryItem[]> => {
    const encodedCategory = encodeURIComponent(categoryName);
    const query = buildQueryString({
      period_type: periodType,
      months,
    });
    return apiClient.get<CategorySpendingHistoryItem[]>(
      `/api/analytics/spending/categories/${encodedCategory}/history${query}`
    );
  },

  getCashFlowMetrics: ({
    periods = DEFAULT_HISTORY_MONTHS,
  }: CashFlowParams = {}): Promise<CashFlowMetricsListResponse> => {
    const query = buildQueryString({ periods });
    return apiClient.get<CashFlowMetricsListResponse>(`/api/analytics/cash-flow${query}`);
  },

  getCurrentCashFlow: (): Promise<CashFlowMetrics> => {
    return apiClient.get<CashFlowMetrics>('/api/analytics/cash-flow/current');
  },

  getIncomeSources: ({
    activeOnly = true,
  }: IncomeSourceParams = {}): Promise<IncomeSourceListResponse> => {
    const query = buildQueryString({ active_only: activeOnly });
    return apiClient.get<IncomeSourceListResponse>(`/api/analytics/income-sources${query}`);
  },

  triggerCashFlowComputation: (forceFull: boolean = false): Promise<CashFlowComputationResult> => {
    const query = buildQueryString({ force_full: forceFull });
    return apiClient.post<CashFlowComputationResult>(`/api/analytics/cash-flow/compute${query}`, {});
  },

  getLifestyleBaselines: (): Promise<LifestyleBaselineListResponse> => {
    return apiClient.get<LifestyleBaselineListResponse>('/api/analytics/lifestyle-creep/baselines');
  },

  computeLifestyleBaselines: (forceRecompute: boolean = false): Promise<LifestyleCreepComputationResult> => {
    const query = buildQueryString({ force_recompute: forceRecompute });
    return apiClient.post<LifestyleCreepComputationResult>(
      `/api/analytics/lifestyle-creep/baselines/compute${query}`,
      {}
    );
  },

  lockLifestyleBaselines: (): Promise<BaselineLockResponse> => {
    return apiClient.post<BaselineLockResponse>('/api/analytics/lifestyle-creep/baselines/lock', {});
  },

  unlockLifestyleBaselines: (): Promise<BaselineUnlockResponse> => {
    return apiClient.post<BaselineUnlockResponse>('/api/analytics/lifestyle-creep/baselines/unlock', {});
  },

  resetLifestyleBaselines: (): Promise<LifestyleCreepComputationResult> => {
    return apiClient.post<LifestyleCreepComputationResult>(
      '/api/analytics/lifestyle-creep/baselines/reset',
      {}
    );
  },

  getLifestyleCreepSummary: ({
    periodStart,
  }: LifestyleCreepParams = {}): Promise<LifestyleCreepSummary> => {
    const query = buildQueryString({ period_start: periodStart });
    return apiClient.get<LifestyleCreepSummary>(`/api/analytics/lifestyle-creep/summary${query}`);
  },

  getLifestyleCreepHistory: ({
    periods = DEFAULT_HISTORY_MONTHS,
  }: LifestyleCreepHistoryParams = {}): Promise<LifestyleCreepListResponse> => {
    const query = buildQueryString({ periods });
    return apiClient.get<LifestyleCreepListResponse>(`/api/analytics/lifestyle-creep/history${query}`);
  },

  getCategoryCreepHistory: ({
    categoryName,
    periods = DEFAULT_HISTORY_MONTHS,
  }: CategoryCreepHistoryParams): Promise<CategoryCreepSummary[]> => {
    const encodedCategory = encodeURIComponent(categoryName);
    const query = buildQueryString({ periods });
    return apiClient.get<CategoryCreepSummary[]>(
      `/api/analytics/lifestyle-creep/category/${encodedCategory}${query}`
    );
  },

  computeLifestyleCreep: ({
    periods = DEFAULT_PERIODS,
    forceRecompute = false,
  }: LifestyleCreepComputeParams = {}): Promise<LifestyleCreepComputationResult> => {
    const query = buildQueryString({
      periods,
      force_recompute: forceRecompute,
    });
    return apiClient.post<LifestyleCreepComputationResult>(`/api/analytics/lifestyle-creep/compute${query}`, {});
  },

  computeCurrentLifestyleCreep: (): Promise<LifestyleCreepComputationResult> => {
    return apiClient.post<LifestyleCreepComputationResult>(
      '/api/analytics/lifestyle-creep/compute/current',
      {}
    );
  },

  getTargetStatus: (): Promise<TargetStatusResponse> => {
    return apiClient.get<TargetStatusResponse>('/api/analytics/lifestyle-creep/target-status');
  },

  getPacing: (): Promise<PacingResponse> => {
    return apiClient.get<PacingResponse>('/api/analytics/lifestyle-creep/pacing');
  },
};
