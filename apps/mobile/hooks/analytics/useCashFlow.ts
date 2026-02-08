import { useCallback, useEffect, useMemo, useState } from 'react';

import { analyticsApi } from '@/services/api';
import type {
  CashFlowComputationResult,
  CashFlowMetrics,
  CashFlowMetricsListResponse,
  IncomeSource,
  IncomeSourceListResponse,
} from '@/types';

import type { BaseHookState } from './types';
import { formatPeriodLabel, getMonthlyMultiplier } from './utils';

interface UseCashFlowMetricsState extends BaseHookState {
  data: CashFlowMetricsListResponse | null;
}

interface UseCashFlowMetricsResult extends UseCashFlowMetricsState {
  refresh: () => Promise<void>;
  periods: CashFlowMetrics[];
  averageSavingsRate: number | null;
  chartData: { label: string; income: number; expenses: number; netFlow: number }[];
}

export function useCashFlowMetrics(periodsCount: number = 12): UseCashFlowMetricsResult {
  const [state, setState] = useState<UseCashFlowMetricsState>({
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
        const response = await analyticsApi.getCashFlowMetrics({ periods: periodsCount });
        setState({
          data: response,
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load cash flow metrics';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          error: message,
        }));
      }
    },
    [periodsCount]
  );

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const averageSavingsRate = useMemo(() => {
    const value = state.data?.average_savings_rate;
    return value ? parseFloat(value) : null;
  }, [state.data?.average_savings_rate]);

  const chartData = useMemo(() => {
    if (!state.data?.periods) return [];

    return [...state.data.periods].reverse().map((period) => ({
      label: formatPeriodLabel(period.period_start, 'monthly'),
      income: parseFloat(period.total_income),
      expenses: parseFloat(period.total_expenses),
      netFlow: parseFloat(period.net_cash_flow),
    }));
  }, [state.data?.periods]);

  return {
    ...state,
    refresh,
    periods: state.data?.periods ?? [],
    averageSavingsRate,
    chartData,
  };
}

interface UseCurrentCashFlowState extends BaseHookState {
  data: CashFlowMetrics | null;
}

interface UseCurrentCashFlowResult extends UseCurrentCashFlowState {
  refresh: () => Promise<void>;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  savingsRate: number | null;
  recurringExpenses: number;
  discretionaryExpenses: number;
  largestExpenseCategory: string | null;
  largestExpenseAmount: number | null;
}

export function useCurrentCashFlow(): UseCurrentCashFlowResult {
  const [state, setState] = useState<UseCurrentCashFlowState>({
    data: null,
    isLoading: true,
    isRefreshing: false,
    error: null,
  });

  const fetchData = useCallback(async (isRefresh: boolean = false) => {
    setState((prev) => ({
      ...prev,
      isLoading: !isRefresh,
      isRefreshing: isRefresh,
      error: null,
    }));

    try {
      const response = await analyticsApi.getCurrentCashFlow();
      setState({
        data: response,
        isLoading: false,
        isRefreshing: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load current cash flow';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isRefreshing: false,
        error: message,
      }));
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const totalIncome = useMemo(
    () => parseFloat(state.data?.total_income ?? '0'),
    [state.data?.total_income]
  );

  const totalExpenses = useMemo(
    () => parseFloat(state.data?.total_expenses ?? '0'),
    [state.data?.total_expenses]
  );

  const netCashFlow = useMemo(
    () => parseFloat(state.data?.net_cash_flow ?? '0'),
    [state.data?.net_cash_flow]
  );

  const savingsRate = useMemo(() => {
    const value = state.data?.savings_rate;
    return value ? parseFloat(value) : null;
  }, [state.data?.savings_rate]);

  const recurringExpenses = useMemo(
    () => parseFloat(state.data?.recurring_expenses ?? '0'),
    [state.data?.recurring_expenses]
  );

  const discretionaryExpenses = useMemo(
    () => parseFloat(state.data?.discretionary_expenses ?? '0'),
    [state.data?.discretionary_expenses]
  );

  const largestExpenseCategory = state.data?.largest_expense_category ?? null;

  const largestExpenseAmount = useMemo(() => {
    const value = state.data?.largest_expense_amount;
    return value ? parseFloat(value) : null;
  }, [state.data?.largest_expense_amount]);

  return {
    ...state,
    refresh,
    totalIncome,
    totalExpenses,
    netCashFlow,
    savingsRate,
    recurringExpenses,
    discretionaryExpenses,
    largestExpenseCategory,
    largestExpenseAmount,
  };
}

interface UseIncomeSourcesState extends BaseHookState {
  data: IncomeSourceListResponse | null;
}

interface UseIncomeSourcesResult extends UseIncomeSourcesState {
  refresh: () => Promise<void>;
  sources: IncomeSource[];
  highConfidenceCount: number;
  totalMonthlyIncome: number;
}

export function useIncomeSources(activeOnly: boolean = true): UseIncomeSourcesResult {
  const [state, setState] = useState<UseIncomeSourcesState>({
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
        const response = await analyticsApi.getIncomeSources({ activeOnly });
        setState({
          data: response,
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load income sources';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          error: message,
        }));
      }
    },
    [activeOnly]
  );

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const totalMonthlyIncome = useMemo(() => {
    if (!state.data?.sources) return 0;

    return state.data.sources.reduce((total, source) => {
      const amount = parseFloat(source.average_amount);
      const multiplier = getMonthlyMultiplier(source.frequency);
      return total + amount * multiplier;
    }, 0);
  }, [state.data?.sources]);

  return {
    ...state,
    refresh,
    sources: state.data?.sources ?? [],
    highConfidenceCount: state.data?.high_confidence_count ?? 0,
    totalMonthlyIncome,
  };
}

interface UseCashFlowComputationState {
  isComputing: boolean;
  result: CashFlowComputationResult | null;
  error: string | null;
}

interface UseCashFlowComputationResult extends UseCashFlowComputationState {
  compute: (forceFull?: boolean) => Promise<CashFlowComputationResult>;
  reset: () => void;
}

export function useCashFlowComputation(): UseCashFlowComputationResult {
  const [state, setState] = useState<UseCashFlowComputationState>({
    isComputing: false,
    result: null,
    error: null,
  });

  const compute = useCallback(async (forceFull: boolean = false): Promise<CashFlowComputationResult> => {
    setState({ isComputing: true, result: null, error: null });

    try {
      const response = await analyticsApi.triggerCashFlowComputation(forceFull);
      setState({
        isComputing: false,
        result: response,
        error: response.status === 'failed' ? response.error_message : null,
      });
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Cash flow computation failed';
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
