import { useCallback, useState } from 'react';

import type { PeriodOption, PeriodToggleResult, ViewMode, ViewToggleResult } from '../types';

export function usePeriodToggle(
  initialPeriod: PeriodOption,
  onPeriodChange?: (months: PeriodOption) => void
): PeriodToggleResult {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>(initialPeriod);

  const handlePeriodChange = useCallback(
    (period: PeriodOption) => {
      setSelectedPeriod(period);
      onPeriodChange?.(period);
    },
    [onPeriodChange]
  );

  return { selectedPeriod, handlePeriodChange };
}

export function useViewToggle(initialMode: ViewMode = 'breakdown'): ViewToggleResult {
  const [viewMode, setViewMode] = useState<ViewMode>(initialMode);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  return { viewMode, handleViewModeChange };
}
