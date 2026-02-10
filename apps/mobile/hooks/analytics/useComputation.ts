import { useMemo } from 'react';

import { analyticsApi } from '@/services/api';
import type { ComputationResultResponse } from '@/types';

import { useAsyncMutation } from '../useAsyncData';

interface UseAnalyticsComputationResult {
  isComputing: boolean;
  result: ComputationResultResponse | null;
  error: string | null;
  compute: (forceFull?: boolean) => Promise<ComputationResultResponse>;
  reset: () => void;
}

export function useAnalyticsComputation(): UseAnalyticsComputationResult {
  const { data, isLoading, error, mutate, reset } = useAsyncMutation(
    (forceFull: boolean = false) => analyticsApi.triggerComputation(forceFull)
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
