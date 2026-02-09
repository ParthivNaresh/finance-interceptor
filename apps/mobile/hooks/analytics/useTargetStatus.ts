import { useMemo } from 'react';

import { analyticsApi } from '@/services/api/analytics';
import type { TargetStatusResponse, TargetStatusType } from '@/types';

import { useAsyncData } from '../useAsyncData';

interface UseTargetStatusResult {
  targetStatus: TargetStatusResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isBuilding: boolean;
  isEstablished: boolean;
  progressPercentage: number;
}

export function useTargetStatus(): UseTargetStatusResult {
  const { data, isLoading, error, refresh } = useAsyncData(
    () => analyticsApi.getTargetStatus(),
    []
  );

  const status: TargetStatusType = data?.status ?? 'building';

  const derivedValues = useMemo(() => ({
    isBuilding: status === 'building',
    isEstablished: status === 'established',
    progressPercentage: data
      ? Math.min(100, (data.months_available / data.months_required) * 100)
      : 0,
  }), [data, status]);

  return {
    targetStatus: data,
    isLoading,
    error,
    refetch: refresh,
    ...derivedValues,
  };
}
