import { useCallback, useEffect, useState } from 'react';

import { analyticsApi } from '@/services/api/analytics';
import type { PacingMode, PacingResponse, PacingStatus } from '@/types';

interface UsePacingResult {
  pacing: PacingResponse | null;
  isLoading: boolean;
  error: Error | null;
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
  const [pacing, setPacing] = useState<PacingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPacing = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await analyticsApi.getPacing();
      setPacing(data);
    } catch (err) {
      if (err instanceof Error && err.message.includes('404')) {
        setPacing(null);
      } else {
        setError(err instanceof Error ? err : new Error('Failed to fetch pacing'));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPacing();
  }, [fetchPacing]);

  const mode: PacingMode = pacing?.mode ?? 'kickoff';
  const isKickoff = mode === 'kickoff';
  const isPacing = mode === 'pacing';
  const isStability = mode === 'stability';

  const pacingStatus: PacingStatus = pacing?.pacing_status ?? 'on_track';
  const targetAmount = pacing ? parseFloat(pacing.target_amount) : 0;
  const currentSpend = pacing ? parseFloat(pacing.current_discretionary_spend) : 0;
  const pacingPercentage = pacing ? parseFloat(pacing.pacing_percentage) : 0;
  const expectedPercentage = pacing ? parseFloat(pacing.expected_pacing_percentage) : 0;
  const pacingDifference = pacing ? parseFloat(pacing.pacing_difference) : 0;
  const daysIntoMonth = pacing?.days_into_period ?? 1;
  const totalDaysInMonth = pacing?.total_days_in_period ?? 30;
  const stabilityScore = pacing?.stability_score ?? null;

  return {
    pacing,
    isLoading,
    error,
    refetch: fetchPacing,
    mode,
    isKickoff,
    isPacing,
    isStability,
    pacingStatus,
    targetAmount,
    currentSpend,
    pacingPercentage,
    expectedPercentage,
    pacingDifference,
    daysIntoMonth,
    totalDaysInMonth,
    stabilityScore,
  };
}
