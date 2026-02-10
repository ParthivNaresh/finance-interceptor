import { useCallback, useEffect, useState } from 'react';

import { recurringApi } from '@/services/api';
import type {
  RecurringStream,
  RecurringStreamListResponse,
  RecurringSyncResult,
  UpcomingBillsListResponse,
} from '@/types';

interface UseRecurringState {
  data: RecurringStreamListResponse | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isSyncing: boolean;
  error: string | null;
}

interface UseRecurringResult extends UseRecurringState {
  refresh: () => Promise<void>;
  sync: () => Promise<RecurringSyncResult>;
  inflowStreams: RecurringStream[];
  outflowStreams: RecurringStream[];
  totalMonthlyInflow: number;
  totalMonthlyOutflow: number;
  netMonthlyFlow: number;
}

export function useRecurring(activeOnly: boolean = true): UseRecurringResult {
  const [state, setState] = useState<UseRecurringState>({
    data: null,
    isLoading: true,
    isRefreshing: false,
    isSyncing: false,
    error: null,
  });

  const fetchRecurring = useCallback(
    async (isRefresh: boolean = false) => {
      setState((prev) => ({
        ...prev,
        isLoading: !isRefresh,
        isRefreshing: isRefresh,
        error: null,
      }));

      try {
        const response = await recurringApi.list(activeOnly);
        setState({
          data: response,
          isLoading: false,
          isRefreshing: false,
          isSyncing: false,
          error: null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load recurring transactions';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          error: message,
        }));
      }
    },
    [activeOnly]
  );

  const refresh = useCallback(async () => {
    await fetchRecurring(true);
  }, [fetchRecurring]);

  const sync = useCallback(async (): Promise<RecurringSyncResult> => {
    setState((prev) => ({ ...prev, isSyncing: true }));

    try {
      const result = await recurringApi.sync();
      await fetchRecurring(true);
      return result;
    } catch (err) {
      setState((prev) => ({ ...prev, isSyncing: false }));
      throw err;
    }
  }, [fetchRecurring]);

  useEffect(() => {
    void fetchRecurring();
  }, [fetchRecurring]);

  const inflowStreams = state.data?.inflow_streams ?? [];
  const outflowStreams = state.data?.outflow_streams ?? [];
  const totalMonthlyInflow = state.data?.total_monthly_inflow ?? 0;
  const totalMonthlyOutflow = state.data?.total_monthly_outflow ?? 0;

  return {
    ...state,
    refresh,
    sync,
    inflowStreams,
    outflowStreams,
    totalMonthlyInflow,
    totalMonthlyOutflow,
    netMonthlyFlow: totalMonthlyInflow - totalMonthlyOutflow,
  };
}

interface UseUpcomingBillsState {
  data: UpcomingBillsListResponse | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

interface UseUpcomingBillsResult extends UseUpcomingBillsState {
  refresh: () => Promise<void>;
}

export function useUpcomingBills(days: number = 30): UseUpcomingBillsResult {
  const [state, setState] = useState<UseUpcomingBillsState>({
    data: null,
    isLoading: true,
    isRefreshing: false,
    error: null,
  });

  const fetchUpcoming = useCallback(
    async (isRefresh: boolean = false) => {
      setState((prev) => ({
        ...prev,
        isLoading: !isRefresh,
        isRefreshing: isRefresh,
        error: null,
      }));

      try {
        const response = await recurringApi.getUpcoming(days);
        setState({
          data: response,
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load upcoming bills';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          error: message,
        }));
      }
    },
    [days]
  );

  const refresh = useCallback(async () => {
    await fetchUpcoming(true);
  }, [fetchUpcoming]);

  useEffect(() => {
    void fetchUpcoming();
  }, [fetchUpcoming]);

  return {
    ...state,
    refresh,
  };
}
