import { useMemo } from 'react';

import { analyticsApi } from '@/services/api';
import type {
  CategorySpendingSummary,
  PeriodType,
  SpendingPeriod,
  SpendingSummaryResponse,
} from '@/types';

import { useAsyncData } from '../useAsyncData';

import type { BaseHookState } from './types';
import { formatPeriodLabel } from './utils';

interface UseSpendingSummaryResult extends BaseHookState {
  data: SpendingSummaryResponse | null;
  refresh: () => Promise<void>;
  totalSpending: number;
  totalIncome: number;
  netFlow: number;
  monthOverMonthChange: number | null;
  topCategories: CategorySpendingSummary[];
}

export function useSpendingSummary(periodType: PeriodType = 'monthly'): UseSpendingSummaryResult {
  const { data, isLoading, isRefreshing, error, refresh } = useAsyncData(
    () => analyticsApi.getCurrentSpending(periodType),
    [periodType]
  );

  const totalSpending = useMemo(
    () => parseFloat(data?.total_spending ?? '0'),
    [data?.total_spending]
  );

  const totalIncome = useMemo(
    () => parseFloat(data?.total_income ?? '0'),
    [data?.total_income]
  );

  const netFlow = useMemo(() => parseFloat(data?.net_flow ?? '0'), [data?.net_flow]);

  const monthOverMonthChange = useMemo(() => {
    const value = data?.month_over_month_change;
    return value !== null && value !== undefined ? parseFloat(value) : null;
  }, [data?.month_over_month_change]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refresh,
    totalSpending,
    totalIncome,
    netFlow,
    monthOverMonthChange,
    topCategories: data?.top_categories ?? [],
  };
}

interface UseSpendingHistoryResult extends BaseHookState {
  periods: SpendingPeriod[];
  refresh: () => Promise<void>;
  chartData: { label: string; value: number; period: SpendingPeriod }[];
}

export function useSpendingHistory(
  periodType: PeriodType = 'monthly',
  periodsCount: number = 6
): UseSpendingHistoryResult {
  const { data, isLoading, isRefreshing, error, refresh } = useAsyncData(
    () => analyticsApi.getSpendingSummaries({ periodType, periods: periodsCount }),
    [periodType, periodsCount]
  );

  const periods = useMemo(() => data?.periods ?? [], [data?.periods]);

  const chartData = useMemo(() => {
    return [...periods].reverse().map((period) => ({
      label: formatPeriodLabel(period.period_start, periodType),
      value: parseFloat(period.total_outflow_excluding_transfers),
      period,
    }));
  }, [periods, periodType]);

  return {
    periods,
    isLoading,
    isRefreshing,
    error,
    refresh,
    chartData,
  };
}
