import { useMemo } from 'react';

import { analyticsApi } from '@/services/api';
import type {
  CashFlowComputationResult,
  CashFlowMetrics,
  CashFlowMetricsListResponse,
  IncomeSource,
  IncomeSourceListResponse,
} from '@/types';

import { useAsyncData, useAsyncMutation } from '../useAsyncData';

import type { BaseHookState } from './types';
import { formatPeriodLabel, getMonthlyMultiplier } from './utils';

interface UseCashFlowMetricsResult extends BaseHookState {
  data: CashFlowMetricsListResponse | null;
  refresh: () => Promise<void>;
  periods: CashFlowMetrics[];
  averageSavingsRate: number | null;
  chartData: { label: string; income: number; expenses: number; netFlow: number }[];
}

export function useCashFlowMetrics(periodsCount: number = 12): UseCashFlowMetricsResult {
  const { data, isLoading, isRefreshing, error, refresh } = useAsyncData(
    () => analyticsApi.getCashFlowMetrics({ periods: periodsCount }),
    [periodsCount]
  );

  const averageSavingsRate = useMemo(() => {
    const value = data?.average_savings_rate;
    return value ? parseFloat(value) : null;
  }, [data?.average_savings_rate]);

  const chartData = useMemo(() => {
    if (!data?.periods) return [];

    return [...data.periods].reverse().map((period) => ({
      label: formatPeriodLabel(period.period_start, 'monthly'),
      income: parseFloat(period.total_income),
      expenses: parseFloat(period.total_expenses),
      netFlow: parseFloat(period.net_cash_flow),
    }));
  }, [data?.periods]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refresh,
    periods: data?.periods ?? [],
    averageSavingsRate,
    chartData,
  };
}

interface UseCurrentCashFlowResult extends BaseHookState {
  data: CashFlowMetrics | null;
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
  const { data, isLoading, isRefreshing, error, refresh } = useAsyncData(
    () => analyticsApi.getCurrentCashFlow(),
    []
  );

  const totalIncome = useMemo(
    () => parseFloat(data?.total_income ?? '0'),
    [data?.total_income]
  );

  const totalExpenses = useMemo(
    () => parseFloat(data?.total_expenses ?? '0'),
    [data?.total_expenses]
  );

  const netCashFlow = useMemo(
    () => parseFloat(data?.net_cash_flow ?? '0'),
    [data?.net_cash_flow]
  );

  const savingsRate = useMemo(() => {
    const value = data?.savings_rate;
    return value ? parseFloat(value) : null;
  }, [data?.savings_rate]);

  const recurringExpenses = useMemo(
    () => parseFloat(data?.recurring_expenses ?? '0'),
    [data?.recurring_expenses]
  );

  const discretionaryExpenses = useMemo(
    () => parseFloat(data?.discretionary_expenses ?? '0'),
    [data?.discretionary_expenses]
  );

  const largestExpenseAmount = useMemo(() => {
    const value = data?.largest_expense_amount;
    return value ? parseFloat(value) : null;
  }, [data?.largest_expense_amount]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refresh,
    totalIncome,
    totalExpenses,
    netCashFlow,
    savingsRate,
    recurringExpenses,
    discretionaryExpenses,
    largestExpenseCategory: data?.largest_expense_category ?? null,
    largestExpenseAmount,
  };
}

interface UseIncomeSourcesResult extends BaseHookState {
  data: IncomeSourceListResponse | null;
  refresh: () => Promise<void>;
  sources: IncomeSource[];
  highConfidenceCount: number;
  totalMonthlyIncome: number;
}

export function useIncomeSources(activeOnly: boolean = true): UseIncomeSourcesResult {
  const { data, isLoading, isRefreshing, error, refresh } = useAsyncData(
    () => analyticsApi.getIncomeSources({ activeOnly }),
    [activeOnly]
  );

  const totalMonthlyIncome = useMemo(() => {
    if (!data?.sources) return 0;

    return data.sources.reduce((total, source) => {
      const amount = parseFloat(source.average_amount);
      const multiplier = getMonthlyMultiplier(source.frequency);
      return total + amount * multiplier;
    }, 0);
  }, [data?.sources]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refresh,
    sources: data?.sources ?? [],
    highConfidenceCount: data?.high_confidence_count ?? 0,
    totalMonthlyIncome,
  };
}

interface UseCashFlowComputationResult {
  isComputing: boolean;
  result: CashFlowComputationResult | null;
  error: string | null;
  compute: (forceFull?: boolean) => Promise<CashFlowComputationResult>;
  reset: () => void;
}

export function useCashFlowComputation(): UseCashFlowComputationResult {
  const { data, isLoading, error, mutate, reset } = useAsyncMutation(
    (forceFull: boolean = false) => analyticsApi.triggerCashFlowComputation(forceFull)
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
