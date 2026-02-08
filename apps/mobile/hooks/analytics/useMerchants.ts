import { useCallback, useEffect, useMemo, useState } from 'react';

import { analyticsApi, type MerchantTimeRange } from '@/services/api';
import type {
  MerchantBreakdownResponse,
  MerchantSpendingHistoryItem,
  MerchantSpendingSummary,
  MerchantStats,
  MerchantStatsComputationResult,
  MerchantStatsSortBy,
  PeriodType,
} from '@/types';

import type { BaseHookState } from './types';
import { formatPeriodLabel } from './utils';

interface UseMerchantBreakdownState extends BaseHookState {
  data: MerchantBreakdownResponse | null;
}

interface UseMerchantBreakdownResult extends UseMerchantBreakdownState {
  refresh: () => Promise<void>;
  merchants: MerchantSpendingSummary[];
  totalSpending: number;
}

export function useMerchantBreakdown(
  periodStart?: string,
  periodType: PeriodType = 'monthly',
  limit: number = 10
): UseMerchantBreakdownResult {
  const [state, setState] = useState<UseMerchantBreakdownState>({
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
        const response = await analyticsApi.getMerchantBreakdown({
          periodStart,
          periodType,
          limit,
        });
        setState({
          data: response,
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load merchant breakdown';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          error: message,
        }));
      }
    },
    [periodStart, periodType, limit]
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

  return {
    ...state,
    refresh,
    merchants: state.data?.merchants ?? [],
    totalSpending,
  };
}

interface UseMerchantBreakdownByRangeState extends BaseHookState {
  data: MerchantBreakdownResponse | null;
}

interface UseMerchantBreakdownByRangeResult extends UseMerchantBreakdownByRangeState {
  refresh: () => Promise<void>;
  merchants: MerchantSpendingSummary[];
  totalSpending: number;
}

export function useMerchantBreakdownByRange(
  timeRange: MerchantTimeRange = 'month',
  limit: number = 10
): UseMerchantBreakdownByRangeResult {
  const [state, setState] = useState<UseMerchantBreakdownByRangeState>({
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
        const response = await analyticsApi.getMerchantBreakdownByRange(timeRange, limit);
        setState({
          data: response,
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load merchant breakdown';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          error: message,
        }));
      }
    },
    [timeRange, limit]
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

  return {
    ...state,
    refresh,
    merchants: state.data?.merchants ?? [],
    totalSpending,
  };
}

interface UseMerchantHistoryState extends BaseHookState {
  history: MerchantSpendingHistoryItem[];
}

interface UseMerchantHistoryResult extends UseMerchantHistoryState {
  refresh: () => Promise<void>;
  chartData: { label: string; value: number; periodStart: string }[];
}

export function useMerchantHistory(
  merchantName: string,
  periodType: PeriodType = 'monthly',
  months: number = 12
): UseMerchantHistoryResult {
  const [state, setState] = useState<UseMerchantHistoryState>({
    history: [],
    isLoading: true,
    isRefreshing: false,
    error: null,
  });

  const fetchData = useCallback(
    async (isRefresh: boolean = false) => {
      if (!merchantName) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      setState((prev) => ({
        ...prev,
        isLoading: !isRefresh,
        isRefreshing: isRefresh,
        error: null,
      }));

      try {
        const response = await analyticsApi.getMerchantHistory({
          merchantName,
          periodType,
          months,
        });
        setState({
          history: response,
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load merchant history';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          error: message,
        }));
      }
    },
    [merchantName, periodType, months]
  );

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const chartData = useMemo(() => {
    return [...state.history].reverse().map((item) => ({
      label: formatPeriodLabel(item.period_start, periodType),
      value: parseFloat(item.total_amount),
      periodStart: item.period_start,
    }));
  }, [state.history, periodType]);

  return {
    ...state,
    refresh,
    chartData,
  };
}

interface UseMerchantStatsState extends BaseHookState {
  merchants: MerchantStats[];
  total: number;
}

interface UseMerchantStatsResult extends UseMerchantStatsState {
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

export function useMerchantStats(
  sortBy: MerchantStatsSortBy = 'spend',
  limit: number = 50
): UseMerchantStatsResult {
  const [state, setState] = useState<UseMerchantStatsState>({
    merchants: [],
    total: 0,
    isLoading: true,
    isRefreshing: false,
    error: null,
  });
  const [offset, setOffset] = useState(0);

  const fetchData = useCallback(
    async (isRefresh: boolean = false, currentOffset: number = 0) => {
      setState((prev) => ({
        ...prev,
        isLoading: !isRefresh && currentOffset === 0,
        isRefreshing: isRefresh,
        error: null,
      }));

      try {
        const response = await analyticsApi.getMerchantStats({
          sortBy,
          limit,
          offset: currentOffset,
        });

        setState((prev) => ({
          merchants: currentOffset === 0 ? response.merchants : [...prev.merchants, ...response.merchants],
          total: response.total,
          isLoading: false,
          isRefreshing: false,
          error: null,
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load merchant stats';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          error: message,
        }));
      }
    },
    [sortBy, limit]
  );

  const refresh = useCallback(async () => {
    setOffset(0);
    await fetchData(true, 0);
  }, [fetchData]);

  const loadMore = useCallback(async () => {
    if (state.merchants.length >= state.total) return;
    const newOffset = offset + limit;
    setOffset(newOffset);
    await fetchData(false, newOffset);
  }, [fetchData, offset, limit, state.merchants.length, state.total]);

  useEffect(() => {
    void fetchData(false, 0);
  }, [fetchData]);

  const hasMore = state.merchants.length < state.total;

  return {
    ...state,
    refresh,
    loadMore,
    hasMore,
  };
}

interface UseTopMerchantStatsState extends BaseHookState {
  merchants: MerchantStats[];
}

interface UseTopMerchantStatsResult extends UseTopMerchantStatsState {
  refresh: () => Promise<void>;
}

export function useTopMerchantStats(
  sortBy: 'spend' | 'frequency' = 'spend',
  limit: number = 10
): UseTopMerchantStatsResult {
  const [state, setState] = useState<UseTopMerchantStatsState>({
    merchants: [],
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
        const response = await analyticsApi.getTopMerchantStats({ sortBy, limit });
        setState({
          merchants: response.merchants,
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load top merchants';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          error: message,
        }));
      }
    },
    [sortBy, limit]
  );

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return {
    ...state,
    refresh,
  };
}

interface UseMerchantStatsDetailState extends BaseHookState {
  merchant: MerchantStats | null;
}

interface UseMerchantStatsDetailResult extends UseMerchantStatsDetailState {
  refresh: () => Promise<void>;
  lifetimeSpend: number;
  averageTransaction: number | null;
  medianTransaction: number | null;
  daysBetweenTransactions: number | null;
  dayOfWeekLabel: string | null;
  hourLabel: string | null;
}

export function useMerchantStatsDetail(merchantName: string): UseMerchantStatsDetailResult {
  const [state, setState] = useState<UseMerchantStatsDetailState>({
    merchant: null,
    isLoading: true,
    isRefreshing: false,
    error: null,
  });

  const fetchData = useCallback(
    async (isRefresh: boolean = false) => {
      if (!merchantName) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      setState((prev) => ({
        ...prev,
        isLoading: !isRefresh,
        isRefreshing: isRefresh,
        error: null,
      }));

      try {
        const response = await analyticsApi.getMerchantStatsDetail(merchantName);
        setState({
          merchant: response,
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load merchant details';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          error: message,
        }));
      }
    },
    [merchantName]
  );

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const lifetimeSpend = useMemo(
    () => parseFloat(state.merchant?.total_lifetime_spend ?? '0'),
    [state.merchant?.total_lifetime_spend]
  );

  const averageTransaction = useMemo(() => {
    const value = state.merchant?.average_transaction_amount;
    return value ? parseFloat(value) : null;
  }, [state.merchant?.average_transaction_amount]);

  const medianTransaction = useMemo(() => {
    const value = state.merchant?.median_transaction_amount;
    return value ? parseFloat(value) : null;
  }, [state.merchant?.median_transaction_amount]);

  const daysBetweenTransactions = useMemo(() => {
    const value = state.merchant?.average_days_between_transactions;
    return value ? parseFloat(value) : null;
  }, [state.merchant?.average_days_between_transactions]);

  const dayOfWeekLabel = useMemo(() => {
    const dow = state.merchant?.most_frequent_day_of_week;
    if (dow === null || dow === undefined) return null;
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dow] ?? null;
  }, [state.merchant?.most_frequent_day_of_week]);

  const hourLabel = useMemo(() => {
    const hour = state.merchant?.most_frequent_hour_of_day;
    if (hour === null || hour === undefined) return null;
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${period}`;
  }, [state.merchant?.most_frequent_hour_of_day]);

  return {
    ...state,
    refresh,
    lifetimeSpend,
    averageTransaction,
    medianTransaction,
    daysBetweenTransactions,
    dayOfWeekLabel,
    hourLabel,
  };
}

interface UseMerchantStatsComputationState {
  isComputing: boolean;
  result: MerchantStatsComputationResult | null;
  error: string | null;
}

interface UseMerchantStatsComputationResult extends UseMerchantStatsComputationState {
  compute: (forceFull?: boolean) => Promise<MerchantStatsComputationResult>;
  reset: () => void;
}

export function useMerchantStatsComputation(): UseMerchantStatsComputationResult {
  const [state, setState] = useState<UseMerchantStatsComputationState>({
    isComputing: false,
    result: null,
    error: null,
  });

  const compute = useCallback(async (forceFull: boolean = false): Promise<MerchantStatsComputationResult> => {
    setState({ isComputing: true, result: null, error: null });

    try {
      const response = await analyticsApi.triggerMerchantStatsComputation(forceFull);
      setState({
        isComputing: false,
        result: response,
        error: response.status === 'failed' ? response.error_message : null,
      });
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Computation failed';
      setState({
        isComputing: false,
        result: null,
        error: message,
      });
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isComputing: false,
      result: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    compute,
    reset,
  };
}
