import { useMemo } from 'react';

import { analyticsApi } from '@/services/api';
import type { LifestyleCreepComputationResult } from '@/types';

import { useAsyncMutation } from '../../useAsyncData';

export interface UseBaselineComputationResult {
  isComputing: boolean;
  result: LifestyleCreepComputationResult | null;
  error: string | null;
  compute: (forceRecompute?: boolean) => Promise<LifestyleCreepComputationResult>;
  lock: () => Promise<void>;
  unlock: () => Promise<void>;
  reset: () => Promise<LifestyleCreepComputationResult>;
  clearState: () => void;
}

export function useBaselineComputation(): UseBaselineComputationResult {
  const computeMutation = useAsyncMutation(
    (forceRecompute: boolean = false) => analyticsApi.computeLifestyleBaselines(forceRecompute)
  );

  const lockMutation = useAsyncMutation(() => analyticsApi.lockLifestyleBaselines());

  const unlockMutation = useAsyncMutation(() => analyticsApi.unlockLifestyleBaselines());

  const resetMutation = useAsyncMutation(() => analyticsApi.resetLifestyleBaselines());

  const isComputing =
    computeMutation.isLoading ||
    lockMutation.isLoading ||
    unlockMutation.isLoading ||
    resetMutation.isLoading;

  const result = computeMutation.data ?? resetMutation.data;

  const computationError = useMemo(() => {
    const err = computeMutation.error ?? lockMutation.error ?? unlockMutation.error ?? resetMutation.error;
    if (err) return err;
    if (result?.status === 'failed') return result.error_message ?? 'Computation failed';
    return null;
  }, [computeMutation.error, lockMutation.error, unlockMutation.error, resetMutation.error, result]);

  const clearState = () => {
    computeMutation.reset();
    lockMutation.reset();
    unlockMutation.reset();
    resetMutation.reset();
  };

  return {
    isComputing,
    result,
    error: computationError,
    compute: computeMutation.mutate,
    lock: async () => {
      await lockMutation.mutate();
    },
    unlock: async () => {
      await unlockMutation.mutate();
    },
    reset: resetMutation.mutate,
    clearState,
  };
}
