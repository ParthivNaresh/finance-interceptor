import type { Account, AccountsListResponse, SyncResponse } from '@/types';

import { apiClient } from './client';

export const accountsApi = {
  list: (): Promise<AccountsListResponse> => {
    return apiClient.get<AccountsListResponse>('/api/accounts');
  },

  get: (accountId: string): Promise<Account> => {
    return apiClient.get<Account>(`/api/accounts/${accountId}`);
  },

  sync: (accountId: string): Promise<SyncResponse> => {
    return apiClient.post<SyncResponse>(`/api/accounts/${accountId}/sync`);
  },

  deletePlaidItem: (plaidItemId: string): Promise<void> => {
    return apiClient.delete<void>(`/api/accounts/plaid-items/${plaidItemId}`);
  },
};
