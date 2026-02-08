import { useCallback, useState } from 'react';

import { analyticsApi } from '@/services/api';
import type { ComputationResultResponse } from '@/types';

interface UseAnalyticsComputationState {
  isComputing: boolean;
  result: ComputationResultResponse | null;
  error: string | null;
}

interface UseAnalyticsComputationResult extends UseAnalyticsComputationState {
  compute: (forceFull?: boolean) => Promise<ComputationResultResponse>;
  reset: () => void;
}

export function useAnalyticsComputation(): UseAnalyticsComputationResult {
  const [state, setState] = useState<UseAnalyticsComputationState>({
    isComputing: false,
    result: null,
    error: null,
  });

  const compute = useCallback(async (forceFull: boolean = false): Promise<ComputationResultResponse> => {
    setState({ isComputing: true, result: null, error: null });

    try {
      const response = await analyticsApi.triggerComputation(forceFull);
      setState({
        isComputing: false,
        result: response,
        error: response.status === 'failed' ? response.error_message : null,
      });
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Computation failed';
      setState({
        isComputing: false,
        result: null,
        error: message,
      });
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isComputing: false,
      result: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    compute,
    reset,
  };
}
