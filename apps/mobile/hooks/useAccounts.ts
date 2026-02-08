import { useCallback, useEffect, useState } from 'react';

import { accountsApi } from '@/services/api';
import type { AccountsListResponse, SyncResponse } from '@/types';

interface UseAccountsState {
  data: AccountsListResponse | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

interface UseAccountsResult extends UseAccountsState {
  refresh: () => Promise<void>;
  syncAccount: (accountId: string) => Promise<SyncResponse>;
  deletePlaidItem: (plaidItemId: string) => Promise<void>;
}

export function useAccounts(): UseAccountsResult {
  const [state, setState] = useState<UseAccountsState>({
    data: null,
    isLoading: true,
    isRefreshing: false,
    error: null,
  });

  const fetchAccounts = useCallback(async (isRefresh: boolean = false) => {
    setState((prev) => ({
      ...prev,
      isLoading: !isRefresh,
      isRefreshing: isRefresh,
      error: null,
    }));

    try {
      const response = await accountsApi.list();
      setState({
        data: response,
        isLoading: false,
        isRefreshing: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load accounts';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isRefreshing: false,
        error: message,
      }));
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchAccounts(true);
  }, [fetchAccounts]);

  const syncAccount = useCallback(
    async (accountId: string): Promise<SyncResponse> => {
      const response = await accountsApi.sync(accountId);
      await fetchAccounts(true);
      return response;
    },
    [fetchAccounts]
  );

  const deletePlaidItem = useCallback(
    async (plaidItemId: string): Promise<void> => {
      await accountsApi.deletePlaidItem(plaidItemId);
      await fetchAccounts(true);
    },
    [fetchAccounts]
  );

  useEffect(() => {
    void fetchAccounts();
  }, [fetchAccounts]);

  return {
    ...state,
    refresh,
    syncAccount,
    deletePlaidItem,
  };
}
