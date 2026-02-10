import { useMemo } from 'react';

import { analyticsApi } from '@/services/api';
import type { CategoryCreepSummary, CreepSeverity, LifestyleCreepSummary } from '@/types';

import { useAsyncData } from '../../useAsyncData';
import type { BaseHookState } from '../types';

export interface UseLifestyleCreepSummaryResult extends BaseHookState {
  data: LifestyleCreepSummary | null;
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
  const { data, isLoading, isRefreshing, error, refresh } = useAsyncData(
    () => analyticsApi.getLifestyleCreepSummary({ periodStart }),
    [periodStart]
  );

  const overallCreepPercentage = useMemo(
    () => parseFloat(data?.overall_creep_percentage ?? '0'),
    [data?.overall_creep_percentage]
  );

  const totalBaseline = useMemo(
    () => parseFloat(data?.total_baseline_discretionary ?? '0'),
    [data?.total_baseline_discretionary]
  );

  const totalCurrent = useMemo(
    () => parseFloat(data?.total_current_discretionary ?? '0'),
    [data?.total_current_discretionary]
  );

  const discretionaryRatio = useMemo(() => {
    const value = data?.discretionary_ratio;
    return value ? parseFloat(value) : null;
  }, [data?.discretionary_ratio]);

  const incomeForPeriod = useMemo(() => {
    const value = data?.income_for_period;
    return value ? parseFloat(value) : null;
  }, [data?.income_for_period]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refresh,
    overallCreepPercentage,
    overallSeverity: data?.overall_severity ?? 'none',
    totalBaseline,
    totalCurrent,
    discretionaryRatio,
    incomeForPeriod,
    topCreepingCategories: data?.top_creeping_categories ?? [],
    improvingCategories: data?.improving_categories ?? [],
    isCreeping: overallCreepPercentage > 10,
    isImproving: overallCreepPercentage < -5,
  };
}
