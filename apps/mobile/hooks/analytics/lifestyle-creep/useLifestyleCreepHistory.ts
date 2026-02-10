import { useMemo } from 'react';

import { analyticsApi } from '@/services/api';
import type { CreepSeverity, LifestyleCreepListResponse, LifestyleCreepSummary } from '@/types';

import { useAsyncData } from '../../useAsyncData';
import type { BaseHookState } from '../types';
import { formatPeriodLabel } from '../utils';

export interface CreepHistoryChartData {
  label: string;
  percentage: number;
  baseline: number;
  current: number;
  severity: CreepSeverity;
}

export type CreepTrend = 'improving' | 'stable' | 'worsening';

export interface UseLifestyleCreepHistoryResult extends BaseHookState {
  data: LifestyleCreepListResponse | null;
  refresh: () => Promise<void>;
  periods: LifestyleCreepSummary[];
  chartData: CreepHistoryChartData[];
  averageCreepPercentage: number;
  trend: CreepTrend;
}

export function useLifestyleCreepHistory(periodsCount: number = 12): UseLifestyleCreepHistoryResult {
  const { data, isLoading, isRefreshing, error, refresh } = useAsyncData(
    () => analyticsApi.getLifestyleCreepHistory({ periods: periodsCount }),
    [periodsCount]
  );

  const periods = useMemo(() => data?.periods ?? [], [data?.periods]);

  const chartData = useMemo((): CreepHistoryChartData[] => {
    if (!periods.length) return [];

    return [...periods].reverse().map((period) => ({
      label: formatPeriodLabel(period.period_start, 'monthly'),
      percentage: parseFloat(period.overall_creep_percentage),
      baseline: parseFloat(period.total_baseline_discretionary),
      current: parseFloat(period.total_current_discretionary),
      severity: period.overall_severity,
    }));
  }, [periods]);

  const averageCreepPercentage = useMemo(() => {
    if (!periods.length) return 0;

    const total = periods.reduce(
      (sum, period) => sum + parseFloat(period.overall_creep_percentage),
      0
    );
    return total / periods.length;
  }, [periods]);

  const trend = useMemo((): CreepTrend => {
    if (periods.length < 3) return 'stable';

    const recentPeriods = periods.slice(0, 3);
    const recentAvg =
      recentPeriods.reduce((sum, p) => sum + parseFloat(p.overall_creep_percentage), 0) /
      recentPeriods.length;

    if (recentAvg < -5) return 'improving';
    if (recentAvg > 15) return 'worsening';
    return 'stable';
  }, [periods]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refresh,
    periods,
    chartData,
    averageCreepPercentage,
    trend,
  };
}
