import { useCallback, useMemo, useState } from 'react';

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

import { useAsyncData, useAsyncMutation } from '../useAsyncData';

import type { BaseHookState } from './types';
import { formatPeriodLabel } from './utils';

interface UseMerchantBreakdownResult extends BaseHookState {
  data: MerchantBreakdownResponse | null;
  refresh: () => Promise<void>;
  merchants: MerchantSpendingSummary[];
  totalSpending: number;
}

export function useMerchantBreakdown(
  periodStart?: string,
  periodType: PeriodType = 'monthly',
  limit: number = 10
): UseMerchantBreakdownResult {
  const { data, isLoading, isRefreshing, error, refresh } = useAsyncData(
    () => analyticsApi.getMerchantBreakdown({ periodStart, periodType, limit }),
    [periodStart, periodType, limit]
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
    merchants: data?.merchants ?? [],
    totalSpending,
  };
}

interface UseMerchantBreakdownByRangeResult extends BaseHookState {
  data: MerchantBreakdownResponse | null;
  refresh: () => Promise<void>;
  merchants: MerchantSpendingSummary[];
  totalSpending: number;
}

export function useMerchantBreakdownByRange(
  timeRange: MerchantTimeRange = 'month',
  limit: number = 10
): UseMerchantBreakdownByRangeResult {
  const { data, isLoading, isRefreshing, error, refresh } = useAsyncData(
    () => analyticsApi.getMerchantBreakdownByRange(timeRange, limit),
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
    merchants: data?.merchants ?? [],
    totalSpending,
  };
}

interface UseMerchantHistoryResult extends BaseHookState {
  history: MerchantSpendingHistoryItem[];
  refresh: () => Promise<void>;
  chartData: { label: string; value: number; periodStart: string }[];
}

export function useMerchantHistory(
  merchantName: string,
  periodType: PeriodType = 'monthly',
  months: number = 12
): UseMerchantHistoryResult {
  const { data, isLoading, isRefreshing, error, refresh } = useAsyncData(
    () => analyticsApi.getMerchantHistory({ merchantName, periodType, months }),
    [merchantName, periodType, months],
    { enabled: Boolean(merchantName) }
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

interface UseMerchantStatsResult extends BaseHookState {
  merchants: MerchantStats[];
  total: number;
  refresh: () => Promise<void>;
  loadMore: () => void;
  hasMore: boolean;
}

export function useMerchantStats(
  sortBy: MerchantStatsSortBy = 'spend',
  limit: number = 50
): UseMerchantStatsResult {
  const [offset, setOffset] = useState(0);
  const [allMerchants, setAllMerchants] = useState<MerchantStats[]>([]);

  const { data, isLoading, isRefreshing, error, refresh: baseRefresh } = useAsyncData(
    () => analyticsApi.getMerchantStats({ sortBy, limit, offset }),
    [sortBy, limit, offset]
  );

  const total = data?.total ?? 0;

  const merchants = useMemo(() => {
    if (offset === 0 && data?.merchants) {
      return data.merchants;
    }
    if (data?.merchants) {
      const combined = [...allMerchants, ...data.merchants];
      const seen = new Set<string>();
      return combined.filter((m) => {
        if (seen.has(m.merchant_name)) return false;
        seen.add(m.merchant_name);
        return true;
      });
    }
    return allMerchants;
  }, [data?.merchants, allMerchants, offset]);

  const refresh = useCallback(async () => {
    setOffset(0);
    setAllMerchants([]);
    await baseRefresh();
  }, [baseRefresh]);

  const loadMore = useCallback(() => {
    if (merchants.length >= total) return;
    setAllMerchants(merchants);
    setOffset((prev) => prev + limit);
  }, [merchants, total, limit]);

  const hasMore = merchants.length < total;

  return {
    merchants,
    total,
    isLoading: isLoading && offset === 0,
    isRefreshing,
    error,
    refresh,
    loadMore,
    hasMore,
  };
}

interface UseTopMerchantStatsResult extends BaseHookState {
  merchants: MerchantStats[];
  refresh: () => Promise<void>;
}

export function useTopMerchantStats(
  sortBy: 'spend' | 'frequency' = 'spend',
  limit: number = 10
): UseTopMerchantStatsResult {
  const { data, isLoading, isRefreshing, error, refresh } = useAsyncData(
    () => analyticsApi.getTopMerchantStats({ sortBy, limit }),
    [sortBy, limit]
  );

  return {
    merchants: data?.merchants ?? [],
    isLoading,
    isRefreshing,
    error,
    refresh,
  };
}

interface UseMerchantStatsDetailResult extends BaseHookState {
  merchant: MerchantStats | null;
  refresh: () => Promise<void>;
  lifetimeSpend: number;
  averageTransaction: number | null;
  medianTransaction: number | null;
  daysBetweenTransactions: number | null;
  dayOfWeekLabel: string | null;
  hourLabel: string | null;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function useMerchantStatsDetail(merchantName: string): UseMerchantStatsDetailResult {
  const { data, isLoading, isRefreshing, error, refresh } = useAsyncData(
    () => analyticsApi.getMerchantStatsDetail(merchantName),
    [merchantName],
    { enabled: Boolean(merchantName) }
  );

  const lifetimeSpend = useMemo(
    () => parseFloat(data?.total_lifetime_spend ?? '0'),
    [data?.total_lifetime_spend]
  );

  const averageTransaction = useMemo(() => {
    const value = data?.average_transaction_amount;
    return value ? parseFloat(value) : null;
  }, [data?.average_transaction_amount]);

  const medianTransaction = useMemo(() => {
    const value = data?.median_transaction_amount;
    return value ? parseFloat(value) : null;
  }, [data?.median_transaction_amount]);

  const daysBetweenTransactions = useMemo(() => {
    const value = data?.average_days_between_transactions;
    return value ? parseFloat(value) : null;
  }, [data?.average_days_between_transactions]);

  const dayOfWeekLabel = useMemo(() => {
    const dow = data?.most_frequent_day_of_week;
    if (dow === null || dow === undefined) return null;
    return DAYS_OF_WEEK[dow] ?? null;
  }, [data?.most_frequent_day_of_week]);

  const hourLabel = useMemo(() => {
    const hour = data?.most_frequent_hour_of_day;
    if (hour === null || hour === undefined) return null;
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${period}`;
  }, [data?.most_frequent_hour_of_day]);

  return {
    merchant: data ?? null,
    isLoading,
    isRefreshing,
    error,
    refresh,
    lifetimeSpend,
    averageTransaction,
    medianTransaction,
    daysBetweenTransactions,
    dayOfWeekLabel,
    hourLabel,
  };
}

interface UseMerchantStatsComputationResult {
  isComputing: boolean;
  result: MerchantStatsComputationResult | null;
  error: string | null;
  compute: (forceFull?: boolean) => Promise<MerchantStatsComputationResult>;
  reset: () => void;
}

export function useMerchantStatsComputation(): UseMerchantStatsComputationResult {
  const { data, isLoading, error, mutate, reset } = useAsyncMutation(
    (forceFull: boolean = false) => analyticsApi.triggerMerchantStatsComputation(forceFull)
  );

  const computationError = useMemo(() => {
    if (error) return error;
    if (data?.status === 'failed') return data.error_message ?? 'Computation failed';
    return null;
  }, [error, data]);

  return {
    isComputing: isLoading,
    result: data,
    error: computationError,
    compute: mutate,
    reset,
  };
}
