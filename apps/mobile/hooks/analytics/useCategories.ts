import { useMemo } from 'react';

import { analyticsApi, type MerchantTimeRange } from '@/services/api';
import type {
  CategoryBreakdownResponse,
  CategoryDetailResponse,
  CategorySpendingHistoryItem,
  CategorySpendingSummary,
  MerchantSpendingSummary,
  PeriodType,
  SubcategorySpendingSummary,
} from '@/types';

import { useAsyncData } from '../useAsyncData';

import type { BaseHookState } from './types';
import { formatPeriodLabel } from './utils';

interface UseCategoryBreakdownResult extends BaseHookState {
  data: CategoryBreakdownResponse | null;
  refresh: () => Promise<void>;
  categories: CategorySpendingSummary[];
  totalSpending: number;
}

export function useCategoryBreakdown(
  periodStart?: string,
  periodType: PeriodType = 'monthly'
): UseCategoryBreakdownResult {
  const { data, isLoading, isRefreshing, error, refresh } = useAsyncData(
    () => analyticsApi.getCategoryBreakdown({ periodStart, periodType }),
    [periodStart, periodType]
  );

  const totalSpending = useMemo(
    () => parseFloat(data?.total_spending ?? '0'),
    [data?.total_spending]
  );

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refresh,
    categories: data?.categories ?? [],
    totalSpending,
  };
}

interface UseCategoryBreakdownByRangeResult extends BaseHookState {
  data: CategoryBreakdownResponse | null;
  refresh: () => Promise<void>;
  categories: CategorySpendingSummary[];
  totalSpending: number;
}

export function useCategoryBreakdownByRange(
  timeRange: MerchantTimeRange = 'month',
  limit: number = 20
): UseCategoryBreakdownByRangeResult {
  const { data, isLoading, isRefreshing, error, refresh } = useAsyncData(
    () => analyticsApi.getCategoryBreakdownByRange(timeRange, limit),
    [timeRange, limit]
  );

  const totalSpending = useMemo(
    () => parseFloat(data?.total_spending ?? '0'),
    [data?.total_spending]
  );

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refresh,
    categories: data?.categories ?? [],
    totalSpending,
  };
}

interface UseCategoryHistoryResult extends BaseHookState {
  history: CategorySpendingSummary[];
  refresh: () => Promise<void>;
  chartData: { label: string; value: number }[];
}

export function useCategoryHistory(
  category: string,
  periodType: PeriodType = 'monthly',
  months: number = 12
): UseCategoryHistoryResult {
  const { data, isLoading, isRefreshing, error, refresh } = useAsyncData(
    () => analyticsApi.getCategoryHistory({ category, periodType, months }),
    [category, periodType, months],
    { enabled: Boolean(category) }
  );

  const history = useMemo(() => data ?? [], [data]);

  const chartData = useMemo(() => {
    return [...history].reverse().map((item, index) => ({
      label: `M${index + 1}`,
      value: parseFloat(item.total_amount),
    }));
  }, [history]);

  return {
    history,
    isLoading,
    isRefreshing,
    error,
    refresh,
    chartData,
  };
}

interface UseCategoryDetailResult extends BaseHookState {
  data: CategoryDetailResponse | null;
  refresh: () => Promise<void>;
  totalAmount: number;
  averageTransaction: number | null;
  percentageOfTotal: number | null;
  subcategories: SubcategorySpendingSummary[];
  topMerchants: MerchantSpendingSummary[];
}

export function useCategoryDetail(
  categoryName: string,
  timeRange: MerchantTimeRange = 'month'
): UseCategoryDetailResult {
  const { data, isLoading, isRefreshing, error, refresh } = useAsyncData(
    () => analyticsApi.getCategoryDetail(categoryName, timeRange),
    [categoryName, timeRange],
    { enabled: Boolean(categoryName) }
  );

  const totalAmount = useMemo(
    () => parseFloat(data?.total_amount ?? '0'),
    [data?.total_amount]
  );

  const averageTransaction = useMemo(() => {
    const value = data?.average_transaction;
    return value ? parseFloat(value) : null;
  }, [data?.average_transaction]);

  const percentageOfTotal = useMemo(() => {
    const value = data?.percentage_of_total_spending;
    return value ? parseFloat(value) : null;
  }, [data?.percentage_of_total_spending]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refresh,
    totalAmount,
    averageTransaction,
    percentageOfTotal,
    subcategories: data?.subcategories ?? [],
    topMerchants: data?.top_merchants ?? [],
  };
}

interface UseCategorySpendingHistoryResult extends BaseHookState {
  history: CategorySpendingHistoryItem[];
  refresh: () => Promise<void>;
  chartData: { label: string; value: number; periodStart: string }[];
}

export function useCategorySpendingHistory(
  categoryName: string,
  periodType: PeriodType = 'monthly',
  months: number = 6
): UseCategorySpendingHistoryResult {
  const { data, isLoading, isRefreshing, error, refresh } = useAsyncData(
    () => analyticsApi.getCategorySpendingHistory(categoryName, periodType, months),
    [categoryName, periodType, months],
    { enabled: Boolean(categoryName) }
  );

  const history = useMemo(() => data ?? [], [data]);

  const chartData = useMemo(() => {
    return [...history].reverse().map((item) => ({
      label: formatPeriodLabel(item.period_start, periodType),
      value: parseFloat(item.total_amount),
      periodStart: item.period_start,
    }));
  }, [history, periodType]);

  return {
    history,
    isLoading,
    isRefreshing,
    error,
    refresh,
    chartData,
  };
}
