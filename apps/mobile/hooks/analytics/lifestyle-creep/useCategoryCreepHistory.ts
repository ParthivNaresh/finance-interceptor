import { useMemo } from 'react';

import { analyticsApi } from '@/services/api';
import type { CategoryCreepSummary } from '@/types';

import { useAsyncData } from '../../useAsyncData';
import type { BaseHookState } from '../types';

export interface UseCategoryCreepHistoryResult extends BaseHookState {
  data: CategoryCreepSummary[] | null;
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
  const { data, isLoading, isRefreshing, error, refresh } = useAsyncData(
    () => analyticsApi.getCategoryCreepHistory({ categoryName, periods: periodsCount }),
    [categoryName, periodsCount],
    { enabled: Boolean(categoryName) }
  );

  const history = useMemo(() => data ?? [], [data]);

  const averageCreepPercentage = useMemo(() => {
    if (!history.length) return 0;
    const total = history.reduce((sum, item) => sum + parseFloat(item.percentage_change), 0);
    return total / history.length;
  }, [history]);

  const maxCreepPercentage = useMemo(() => {
    if (!history.length) return 0;
    return Math.max(...history.map((item) => parseFloat(item.percentage_change)));
  }, [history]);

  const minCreepPercentage = useMemo(() => {
    if (!history.length) return 0;
    return Math.min(...history.map((item) => parseFloat(item.percentage_change)));
  }, [history]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refresh,
    history,
    averageCreepPercentage,
    maxCreepPercentage,
    minCreepPercentage,
  };
}
