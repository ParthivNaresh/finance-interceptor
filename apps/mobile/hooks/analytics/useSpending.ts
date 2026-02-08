import { useCallback, useEffect, useMemo, useState } from 'react';

import { analyticsApi } from '@/services/api';
import type {
  CategorySpendingSummary,
  PeriodType,
  SpendingPeriod,
  SpendingSummaryResponse,
} from '@/types';

import type { BaseHookState } from './types';
import { formatPeriodLabel } from './utils';

interface UseSpendingSummaryState extends BaseHookState {
  data: SpendingSummaryResponse | null;
}

interface UseSpendingSummaryResult extends UseSpendingSummaryState {
  refresh: () => Promise<void>;
  totalSpending: number;
  totalIncome: number;
  netFlow: number;
  monthOverMonthChange: number | null;
  topCategories: CategorySpendingSummary[];
}

export function useSpendingSummary(periodType: PeriodType = 'monthly'): UseSpendingSummaryResult {
  const [state, setState] = useState<UseSpendingSummaryState>({
    data: null,
    isLoading: true,
    isRefreshing: false,
    error: null,
  });

  const fetchData = useCallback(
    async (isRefresh: boolean = false) => {
      setState((prev) => ({
        ...prev,
        isLoading: !isRefresh,
        isRefreshing: isRefresh,
        error: null,
      }));

      try {
        const response = await analyticsApi.getCurrentSpending(periodType);
        setState({
          data: response,
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load spending summary';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          error: message,
        }));
      }
    },
    [periodType]
  );

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const totalSpending = useMemo(
    () => parseFloat(state.data?.total_spending ?? '0'),
    [state.data?.total_spending]
  );

  const totalIncome = useMemo(
    () => parseFloat(state.data?.total_income ?? '0'),
    [state.data?.total_income]
  );

  const netFlow = useMemo(() => parseFloat(state.data?.net_flow ?? '0'), [state.data?.net_flow]);

  const monthOverMonthChange = useMemo(() => {
    const value = state.data?.month_over_month_change;
    return value !== null && value !== undefined ? parseFloat(value) : null;
  }, [state.data?.month_over_month_change]);

  return {
    ...state,
    refresh,
    totalSpending,
    totalIncome,
    netFlow,
    monthOverMonthChange,
    topCategories: state.data?.top_categories ?? [],
  };
}

interface UseSpendingHistoryState extends BaseHookState {
  periods: SpendingPeriod[];
}

interface UseSpendingHistoryResult extends UseSpendingHistoryState {
  refresh: () => Promise<void>;
  chartData: { label: string; value: number; period: SpendingPeriod }[];
}

export function useSpendingHistory(
  periodType: PeriodType = 'monthly',
  periodsCount: number = 6
): UseSpendingHistoryResult {
  const [state, setState] = useState<UseSpendingHistoryState>({
    periods: [],
    isLoading: true,
    isRefreshing: false,
    error: null,
  });

  const fetchData = useCallback(
    async (isRefresh: boolean = false) => {
      setState((prev) => ({
        ...prev,
        isLoading: !isRefresh,
        isRefreshing: isRefresh,
        error: null,
      }));

      try {
        const response = await analyticsApi.getSpendingSummaries({
          periodType,
          periods: periodsCount,
        });
        setState({
          periods: response.periods,
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load spending history';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          error: message,
        }));
      }
    },
    [periodType, periodsCount]
  );

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const chartData = useMemo(() => {
    return [...state.periods].reverse().map((period) => ({
      label: formatPeriodLabel(period.period_start, periodType),
      value: parseFloat(period.total_outflow_excluding_transfers),
      period,
    }));
  }, [state.periods, periodType]);

  return {
    ...state,
    refresh,
    chartData,
  };
}
