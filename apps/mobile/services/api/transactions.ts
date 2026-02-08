import type {
  TransactionDetail,
  TransactionFilters,
  TransactionsListResponse,
} from '@/types';

import { apiClient } from './client';

function buildQueryString(filters: TransactionFilters, limit: number, offset: number): string {
  const params = new URLSearchParams();

  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  if (filters.account_id) {
    params.append('account_id', filters.account_id);
  }
  if (filters.start_date) {
    params.append('start_date', filters.start_date);
  }
  if (filters.end_date) {
    params.append('end_date', filters.end_date);
  }
  if (filters.category) {
    params.append('category', filters.category);
  }
  if (filters.search) {
    params.append('search', filters.search);
  }
  if (filters.pending !== undefined) {
    params.append('pending', filters.pending.toString());
  }

  return params.toString();
}

export const transactionsApi = {
  list: (
    filters: TransactionFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<TransactionsListResponse> => {
    const queryString = buildQueryString(filters, limit, offset);
    return apiClient.get<TransactionsListResponse>(`/api/transactions?${queryString}`);
  },

  get: (transactionId: string): Promise<TransactionDetail> => {
    return apiClient.get<TransactionDetail>(`/api/transactions/${transactionId}`);
  },
};
