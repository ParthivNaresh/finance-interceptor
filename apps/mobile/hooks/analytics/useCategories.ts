import { useCallback, useEffect, useMemo, useState } from 'react';

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

import type { BaseHookState } from './types';
import { formatPeriodLabel } from './utils';

interface UseCategoryBreakdownState extends BaseHookState {
  data: CategoryBreakdownResponse | null;
}

interface UseCategoryBreakdownResult extends UseCategoryBreakdownState {
  refresh: () => Promise<void>;
  categories: CategorySpendingSummary[];
  totalSpending: number;
}

export function useCategoryBreakdown(
  periodStart?: string,
  periodType: PeriodType = 'monthly'
): UseCategoryBreakdownResult {
  const [state, setState] = useState<UseCategoryBreakdownState>({
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
        const response = await analyticsApi.getCategoryBreakdown({
          periodStart,
          periodType,
        });
        setState({
          data: response,
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load category breakdown';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          error: message,
        }));
      }
    },
    [periodStart, periodType]
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
    categories: state.data?.categories ?? [],
    totalSpending,
  };
}

interface UseCategoryBreakdownByRangeState extends BaseHookState {
  data: CategoryBreakdownResponse | null;
}

interface UseCategoryBreakdownByRangeResult extends UseCategoryBreakdownByRangeState {
  refresh: () => Promise<void>;
  categories: CategorySpendingSummary[];
  totalSpending: number;
}

export function useCategoryBreakdownByRange(
  timeRange: MerchantTimeRange = 'month',
  limit: number = 20
): UseCategoryBreakdownByRangeResult {
  const [state, setState] = useState<UseCategoryBreakdownByRangeState>({
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
        const response = await analyticsApi.getCategoryBreakdownByRange(timeRange, limit);
        setState({
          data: response,
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load category breakdown';
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
    categories: state.data?.categories ?? [],
    totalSpending,
  };
}

interface UseCategoryHistoryState extends BaseHookState {
  history: CategorySpendingSummary[];
}

interface UseCategoryHistoryResult extends UseCategoryHistoryState {
  refresh: () => Promise<void>;
  chartData: { label: string; value: number }[];
}

export function useCategoryHistory(
  category: string,
  periodType: PeriodType = 'monthly',
  months: number = 12
): UseCategoryHistoryResult {
  const [state, setState] = useState<UseCategoryHistoryState>({
    history: [],
    isLoading: true,
    isRefreshing: false,
    error: null,
  });

  const fetchData = useCallback(
    async (isRefresh: boolean = false) => {
      if (!category) {
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
        const response = await analyticsApi.getCategoryHistory({
          category,
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
        const message = err instanceof Error ? err.message : 'Failed to load category history';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          error: message,
        }));
      }
    },
    [category, periodType, months]
  );

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const chartData = useMemo(() => {
    return [...state.history].reverse().map((item, index) => ({
      label: `M${index + 1}`,
      value: parseFloat(item.total_amount),
    }));
  }, [state.history]);

  return {
    ...state,
    refresh,
    chartData,
  };
}

interface UseCategoryDetailState extends BaseHookState {
  data: CategoryDetailResponse | null;
}

interface UseCategoryDetailResult extends UseCategoryDetailState {
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
  const [state, setState] = useState<UseCategoryDetailState>({
    data: null,
    isLoading: true,
    isRefreshing: false,
    error: null,
  });

  const fetchData = useCallback(
    async (isRefresh: boolean = false) => {
      if (!categoryName) {
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
        const response = await analyticsApi.getCategoryDetail(categoryName, timeRange);
        setState({
          data: response,
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load category details';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          error: message,
        }));
      }
    },
    [categoryName, timeRange]
  );

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const totalAmount = useMemo(
    () => parseFloat(state.data?.total_amount ?? '0'),
    [state.data?.total_amount]
  );

  const averageTransaction = useMemo(() => {
    const value = state.data?.average_transaction;
    return value ? parseFloat(value) : null;
  }, [state.data?.average_transaction]);

  const percentageOfTotal = useMemo(() => {
    const value = state.data?.percentage_of_total_spending;
    return value ? parseFloat(value) : null;
  }, [state.data?.percentage_of_total_spending]);

  return {
    ...state,
    refresh,
    totalAmount,
    averageTransaction,
    percentageOfTotal,
    subcategories: state.data?.subcategories ?? [],
    topMerchants: state.data?.top_merchants ?? [],
  };
}

interface UseCategorySpendingHistoryState extends BaseHookState {
  history: CategorySpendingHistoryItem[];
}

interface UseCategorySpendingHistoryResult extends UseCategorySpendingHistoryState {
  refresh: () => Promise<void>;
  chartData: { label: string; value: number; periodStart: string }[];
}

export function useCategorySpendingHistory(
  categoryName: string,
  periodType: PeriodType = 'monthly',
  months: number = 6
): UseCategorySpendingHistoryResult {
  const [state, setState] = useState<UseCategorySpendingHistoryState>({
    history: [],
    isLoading: true,
    isRefreshing: false,
    error: null,
  });

  const fetchData = useCallback(
    async (isRefresh: boolean = false) => {
      if (!categoryName) {
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
        const response = await analyticsApi.getCategorySpendingHistory(categoryName, periodType, months);
        setState({
          history: response,
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load category history';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          error: message,
        }));
      }
    },
    [categoryName, periodType, months]
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
