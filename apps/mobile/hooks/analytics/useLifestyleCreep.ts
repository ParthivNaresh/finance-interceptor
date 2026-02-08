import { useCallback, useEffect, useMemo, useState } from 'react';

import { analyticsApi } from '@/services/api';
import type {
  CategoryCreepSummary,
  CreepSeverity,
  LifestyleBaseline,
  LifestyleBaselineListResponse,
  LifestyleCreepComputationResult,
  LifestyleCreepListResponse,
  LifestyleCreepSummary,
} from '@/types';

import type { BaseHookState } from './types';
import { formatPeriodLabel } from './utils';

interface UseLifestyleBaselinesState extends BaseHookState {
  data: LifestyleBaselineListResponse | null;
}

interface UseLifestyleBaselinesResult extends UseLifestyleBaselinesState {
  refresh: () => Promise<void>;
  baselines: LifestyleBaseline[];
  isLocked: boolean;
  totalBaselineAmount: number;
  hasBaselines: boolean;
}

export function useLifestyleBaselines(): UseLifestyleBaselinesResult {
  const [state, setState] = useState<UseLifestyleBaselinesState>({
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
      const response = await analyticsApi.getLifestyleBaselines();
      setState({
        data: response,
        isLoading: false,
        isRefreshing: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load lifestyle baselines';
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

  const totalBaselineAmount = useMemo(() => {
    if (!state.data?.baselines) return 0;
    return state.data.baselines.reduce(
      (total, baseline) => total + parseFloat(baseline.baseline_monthly_amount),
      0
    );
  }, [state.data?.baselines]);

  return {
    ...state,
    refresh,
    baselines: state.data?.baselines ?? [],
    isLocked: state.data?.is_locked ?? false,
    totalBaselineAmount,
    hasBaselines: (state.data?.total ?? 0) > 0,
  };
}

interface UseLifestyleCreepSummaryState extends BaseHookState {
  data: LifestyleCreepSummary | null;
}

interface UseLifestyleCreepSummaryResult extends UseLifestyleCreepSummaryState {
  refresh: () => Promise<void>;
  overallCreepPercentage: number;
  overallSeverity: CreepSeverity;
  totalBaseline: number;
  totalCurrent: number;
  discretionaryRatio: number | null;
  incomeForPeriod: number | null;
  topCreepingCategories: CategoryCreepSummary[];
  improvingCategories: CategoryCreepSummary[];
  isCreeping: boolean;
  isImproving: boolean;
}

export function useLifestyleCreepSummary(periodStart?: string): UseLifestyleCreepSummaryResult {
  const [state, setState] = useState<UseLifestyleCreepSummaryState>({
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
        const response = await analyticsApi.getLifestyleCreepSummary({ periodStart });
        setState({
          data: response,
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load lifestyle creep summary';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          error: message,
        }));
      }
    },
    [periodStart]
  );

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const overallCreepPercentage = useMemo(
    () => parseFloat(state.data?.overall_creep_percentage ?? '0'),
    [state.data?.overall_creep_percentage]
  );

  const totalBaseline = useMemo(
    () => parseFloat(state.data?.total_baseline_discretionary ?? '0'),
    [state.data?.total_baseline_discretionary]
  );

  const totalCurrent = useMemo(
    () => parseFloat(state.data?.total_current_discretionary ?? '0'),
    [state.data?.total_current_discretionary]
  );

  const discretionaryRatio = useMemo(() => {
    const value = state.data?.discretionary_ratio;
    return value ? parseFloat(value) : null;
  }, [state.data?.discretionary_ratio]);

  const incomeForPeriod = useMemo(() => {
    const value = state.data?.income_for_period;
    return value ? parseFloat(value) : null;
  }, [state.data?.income_for_period]);

  return {
    ...state,
    refresh,
    overallCreepPercentage,
    overallSeverity: state.data?.overall_severity ?? 'none',
    totalBaseline,
    totalCurrent,
    discretionaryRatio,
    incomeForPeriod,
    topCreepingCategories: state.data?.top_creeping_categories ?? [],
    improvingCategories: state.data?.improving_categories ?? [],
    isCreeping: overallCreepPercentage > 10,
    isImproving: overallCreepPercentage < -5,
  };
}

interface UseLifestyleCreepHistoryState extends BaseHookState {
  data: LifestyleCreepListResponse | null;
}

interface CreepHistoryChartData {
  label: string;
  percentage: number;
  baseline: number;
  current: number;
  severity: CreepSeverity;
}

interface UseLifestyleCreepHistoryResult extends UseLifestyleCreepHistoryState {
  refresh: () => Promise<void>;
  periods: LifestyleCreepSummary[];
  chartData: CreepHistoryChartData[];
  averageCreepPercentage: number;
  trend: 'improving' | 'stable' | 'worsening';
}

export function useLifestyleCreepHistory(periodsCount: number = 12): UseLifestyleCreepHistoryResult {
  const [state, setState] = useState<UseLifestyleCreepHistoryState>({
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
        const response = await analyticsApi.getLifestyleCreepHistory({ periods: periodsCount });
        setState({
          data: response,
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load lifestyle creep history';
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

  const chartData = useMemo((): CreepHistoryChartData[] => {
    if (!state.data?.periods) return [];

    return [...state.data.periods].reverse().map((period) => ({
      label: formatPeriodLabel(period.period_start, 'monthly'),
      percentage: parseFloat(period.overall_creep_percentage),
      baseline: parseFloat(period.total_baseline_discretionary),
      current: parseFloat(period.total_current_discretionary),
      severity: period.overall_severity,
    }));
  }, [state.data?.periods]);

  const averageCreepPercentage = useMemo(() => {
    if (!state.data?.periods || state.data.periods.length === 0) return 0;

    const total = state.data.periods.reduce(
      (sum, period) => sum + parseFloat(period.overall_creep_percentage),
      0
    );
    return total / state.data.periods.length;
  }, [state.data?.periods]);

  const trend = useMemo((): 'improving' | 'stable' | 'worsening' => {
    if (!state.data?.periods || state.data.periods.length < 3) return 'stable';

    const recentPeriods = state.data.periods.slice(0, 3);
    const recentAvg =
      recentPeriods.reduce((sum, p) => sum + parseFloat(p.overall_creep_percentage), 0) /
      recentPeriods.length;

    if (recentAvg < -5) return 'improving';
    if (recentAvg > 15) return 'worsening';
    return 'stable';
  }, [state.data?.periods]);

  return {
    ...state,
    refresh,
    periods: state.data?.periods ?? [],
    chartData,
    averageCreepPercentage,
    trend,
  };
}

interface UseCategoryCreepHistoryState extends BaseHookState {
  data: CategoryCreepSummary[] | null;
}

interface UseCategoryCreepHistoryResult extends UseCategoryCreepHistoryState {
  refresh: () => Promise<void>;
  history: CategoryCreepSummary[];
  averageCreepPercentage: number;
  maxCreepPercentage: number;
  minCreepPercentage: number;
}

export function useCategoryCreepHistory(
  categoryName: string,
  periodsCount: number = 12
): UseCategoryCreepHistoryResult {
  const [state, setState] = useState<UseCategoryCreepHistoryState>({
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
        const response = await analyticsApi.getCategoryCreepHistory({
          categoryName,
          periods: periodsCount,
        });
        setState({
          data: response,
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load category creep history';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          error: message,
        }));
      }
    },
    [categoryName, periodsCount]
  );

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const averageCreepPercentage = useMemo(() => {
    if (!state.data || state.data.length === 0) return 0;
    const total = state.data.reduce((sum, item) => sum + parseFloat(item.percentage_change), 0);
    return total / state.data.length;
  }, [state.data]);

  const maxCreepPercentage = useMemo(() => {
    if (!state.data || state.data.length === 0) return 0;
    return Math.max(...state.data.map((item) => parseFloat(item.percentage_change)));
  }, [state.data]);

  const minCreepPercentage = useMemo(() => {
    if (!state.data || state.data.length === 0) return 0;
    return Math.min(...state.data.map((item) => parseFloat(item.percentage_change)));
  }, [state.data]);

  return {
    ...state,
    refresh,
    history: state.data ?? [],
    averageCreepPercentage,
    maxCreepPercentage,
    minCreepPercentage,
  };
}

interface UseBaselineComputationState {
  isComputing: boolean;
  result: LifestyleCreepComputationResult | null;
  error: string | null;
}

interface UseBaselineComputationResult extends UseBaselineComputationState {
  compute: (forceRecompute?: boolean) => Promise<LifestyleCreepComputationResult>;
  lock: () => Promise<void>;
  unlock: () => Promise<void>;
  reset: () => Promise<LifestyleCreepComputationResult>;
  clearState: () => void;
}

export function useBaselineComputation(): UseBaselineComputationResult {
  const [state, setState] = useState<UseBaselineComputationState>({
    isComputing: false,
    result: null,
    error: null,
  });

  const compute = useCallback(
    async (forceRecompute: boolean = false): Promise<LifestyleCreepComputationResult> => {
      setState({ isComputing: true, result: null, error: null });

      try {
        const response = await analyticsApi.computeLifestyleBaselines(forceRecompute);
        setState({
          isComputing: false,
          result: response,
          error: response.status === 'failed' ? response.error_message : null,
        });
        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Baseline computation failed';
        setState({
          isComputing: false,
          result: null,
          error: message,
        });
        throw err;
      }
    },
    []
  );

  const lock = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, isComputing: true, error: null }));

    try {
      await analyticsApi.lockLifestyleBaselines();
      setState((prev) => ({ ...prev, isComputing: false }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to lock baselines';
      setState((prev) => ({
        ...prev,
        isComputing: false,
        error: message,
      }));
      throw err;
    }
  }, []);

  const unlock = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, isComputing: true, error: null }));

    try {
      await analyticsApi.unlockLifestyleBaselines();
      setState((prev) => ({ ...prev, isComputing: false }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unlock baselines';
      setState((prev) => ({
        ...prev,
        isComputing: false,
        error: message,
      }));
      throw err;
    }
  }, []);

  const reset = useCallback(async (): Promise<LifestyleCreepComputationResult> => {
    setState({ isComputing: true, result: null, error: null });

    try {
      const response = await analyticsApi.resetLifestyleBaselines();
      setState({
        isComputing: false,
        result: response,
        error: response.status === 'failed' ? response.error_message : null,
      });
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Baseline reset failed';
      setState({
        isComputing: false,
        result: null,
        error: message,
      });
      throw err;
    }
  }, []);

  const clearState = useCallback(() => {
    setState({
      isComputing: false,
      result: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    compute,
    lock,
    unlock,
    reset,
    clearState,
  };
}

interface UseCreepComputationState {
  isComputing: boolean;
  result: LifestyleCreepComputationResult | null;
  error: string | null;
}

interface UseCreepComputationResult extends UseCreepComputationState {
  compute: (periods?: number, forceRecompute?: boolean) => Promise<LifestyleCreepComputationResult>;
  computeCurrent: () => Promise<LifestyleCreepComputationResult>;
  clearState: () => void;
}

export function useCreepComputation(): UseCreepComputationResult {
  const [state, setState] = useState<UseCreepComputationState>({
    isComputing: false,
    result: null,
    error: null,
  });

  const compute = useCallback(
    async (
      periods: number = 6,
      forceRecompute: boolean = false
    ): Promise<LifestyleCreepComputationResult> => {
      setState({ isComputing: true, result: null, error: null });

      try {
        const response = await analyticsApi.computeLifestyleCreep({ periods, forceRecompute });
        setState({
          isComputing: false,
          result: response,
          error: response.status === 'failed' ? response.error_message : null,
        });
        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Creep computation failed';
        setState({
          isComputing: false,
          result: null,
          error: message,
        });
        throw err;
      }
    },
    []
  );

  const computeCurrent = useCallback(async (): Promise<LifestyleCreepComputationResult> => {
    setState({ isComputing: true, result: null, error: null });

    try {
      const response = await analyticsApi.computeCurrentLifestyleCreep();
      setState({
        isComputing: false,
        result: response,
        error: response.status === 'failed' ? response.error_message : null,
      });
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Current period computation failed';
      setState({
        isComputing: false,
        result: null,
        error: message,
      });
      throw err;
    }
  }, []);

  const clearState = useCallback(() => {
    setState({
      isComputing: false,
      result: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    compute,
    computeCurrent,
    clearState,
  };
}
