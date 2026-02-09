import { useMemo } from 'react';

import { analyticsApi } from '@/services/api/analytics';
import type { PacingMode, PacingResponse, PacingStatus } from '@/types';

import { useAsyncData } from '../useAsyncData';

interface UsePacingResult {
  pacing: PacingResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  mode: PacingMode;
  isKickoff: boolean;
  isPacing: boolean;
  isStability: boolean;
  pacingStatus: PacingStatus;
  targetAmount: number;
  currentSpend: number;
  pacingPercentage: number;
  expectedPercentage: number;
  pacingDifference: number;
  daysIntoMonth: number;
  totalDaysInMonth: number;
  stabilityScore: number | null;
}

export function usePacing(): UsePacingResult {
  const { data, isLoading, error, refresh } = useAsyncData(
    () => analyticsApi.getPacing(),
    []
  );

  const mode: PacingMode = data?.mode ?? 'kickoff';

  const derivedValues = useMemo(() => ({
    isKickoff: mode === 'kickoff',
    isPacing: mode === 'pacing',
    isStability: mode === 'stability',
    pacingStatus: data?.pacing_status ?? 'on_track',
    targetAmount: data ? parseFloat(data.target_amount) : 0,
    currentSpend: data ? parseFloat(data.current_discretionary_spend) : 0,
    pacingPercentage: data ? parseFloat(data.pacing_percentage) : 0,
    expectedPercentage: data ? parseFloat(data.expected_pacing_percentage) : 0,
    pacingDifference: data ? parseFloat(data.pacing_difference) : 0,
    daysIntoMonth: data?.days_into_period ?? 1,
    totalDaysInMonth: data?.total_days_in_period ?? 30,
    stabilityScore: data?.stability_score ?? null,
  }), [data, mode]);

  return {
    pacing: data,
    isLoading,
    error,
    refetch: refresh,
    mode,
    ...derivedValues,
  };
}
