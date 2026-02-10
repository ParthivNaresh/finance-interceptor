import { useMemo } from 'react';

import { analyticsApi } from '@/services/api';
import type { LifestyleCreepComputationResult } from '@/types';

import { useAsyncMutation } from '../../useAsyncData';

export interface UseCreepComputationResult {
  isComputing: boolean;
  result: LifestyleCreepComputationResult | null;
  error: string | null;
  compute: (periods?: number, forceRecompute?: boolean) => Promise<LifestyleCreepComputationResult>;
  computeCurrent: () => Promise<LifestyleCreepComputationResult>;
  clearState: () => void;
}

export function useCreepComputation(): UseCreepComputationResult {
  const computeMutation = useAsyncMutation(
    (periods: number = 6, forceRecompute: boolean = false) =>
      analyticsApi.computeLifestyleCreep({ periods, forceRecompute })
  );

  const computeCurrentMutation = useAsyncMutation(() => analyticsApi.computeCurrentLifestyleCreep());

  const isComputing = computeMutation.isLoading || computeCurrentMutation.isLoading;
  const result = computeMutation.data ?? computeCurrentMutation.data;

  const computationError = useMemo(() => {
    const err = computeMutation.error ?? computeCurrentMutation.error;
    if (err) return err;
    if (result?.status === 'failed') return result.error_message ?? 'Computation failed';
    return null;
  }, [computeMutation.error, computeCurrentMutation.error, result]);

  const clearState = () => {
    computeMutation.reset();
    computeCurrentMutation.reset();
  };

  return {
    isComputing,
    result,
    error: computationError,
    compute: computeMutation.mutate,
    computeCurrent: computeCurrentMutation.mutate,
    clearState,
  };
}
