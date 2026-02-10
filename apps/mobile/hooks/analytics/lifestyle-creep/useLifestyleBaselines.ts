import { useMemo } from 'react';

import { analyticsApi } from '@/services/api';
import type { LifestyleBaseline, LifestyleBaselineListResponse } from '@/types';

import { useAsyncData } from '../../useAsyncData';
import type { BaseHookState } from '../types';

export interface UseLifestyleBaselinesResult extends BaseHookState {
  data: LifestyleBaselineListResponse | null;
  refresh: () => Promise<void>;
  baselines: LifestyleBaseline[];
  isLocked: boolean;
  totalBaselineAmount: number;
  hasBaselines: boolean;
}

export function useLifestyleBaselines(): UseLifestyleBaselinesResult {
  const { data, isLoading, isRefreshing, error, refresh } = useAsyncData(
    () => analyticsApi.getLifestyleBaselines(),
    []
  );

  const totalBaselineAmount = useMemo(() => {
    if (!data?.baselines) return 0;
    return data.baselines.reduce(
      (total, baseline) => total + parseFloat(baseline.baseline_monthly_amount),
      0
    );
  }, [data?.baselines]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refresh,
    baselines: data?.baselines ?? [],
    isLocked: data?.is_locked ?? false,
    totalBaselineAmount,
    hasBaselines: (data?.total ?? 0) > 0,
  };
}
