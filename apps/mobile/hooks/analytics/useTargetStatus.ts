import { useCallback, useEffect, useState } from 'react';

import { analyticsApi } from '@/services/api/analytics';
import type { TargetStatusResponse, TargetStatusType } from '@/types';

interface UseTargetStatusResult {
  targetStatus: TargetStatusResponse | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isBuilding: boolean;
  isEstablished: boolean;
  progressPercentage: number;
}

export function useTargetStatus(): UseTargetStatusResult {
  const [targetStatus, setTargetStatus] = useState<TargetStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTargetStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await analyticsApi.getTargetStatus();
      setTargetStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch target status'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTargetStatus();
  }, [fetchTargetStatus]);

  const status: TargetStatusType = targetStatus?.status ?? 'building';
  const isBuilding = status === 'building';
  const isEstablished = status === 'established';

  const progressPercentage = targetStatus
    ? Math.min(100, (targetStatus.months_available / targetStatus.months_required) * 100)
    : 0;

  return {
    targetStatus,
    isLoading,
    error,
    refetch: fetchTargetStatus,
    isBuilding,
    isEstablished,
    progressPercentage,
  };
}
