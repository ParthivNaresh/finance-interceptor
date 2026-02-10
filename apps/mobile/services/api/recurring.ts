import type {
  RecurringStream,
  RecurringStreamDetailResponse,
  RecurringStreamListResponse,
  RecurringSyncResult,
  UpcomingBillsListResponse,
} from '@/types';

import { apiClient } from './client';

export const recurringApi = {
  list: (activeOnly: boolean = true): Promise<RecurringStreamListResponse> => {
    const params = new URLSearchParams();
    params.append('active_only', activeOnly.toString());
    return apiClient.get<RecurringStreamListResponse>(`/api/recurring?${params.toString()}`);
  },

  get: (streamId: string): Promise<RecurringStream> => {
    return apiClient.get<RecurringStream>(`/api/recurring/${streamId}`);
  },

  getWithTransactions: (streamId: string): Promise<RecurringStreamDetailResponse> => {
    return apiClient.get<RecurringStreamDetailResponse>(`/api/recurring/${streamId}/transactions`);
  },

  getUpcoming: (days: number = 30): Promise<UpcomingBillsListResponse> => {
    const params = new URLSearchParams();
    params.append('days', days.toString());
    return apiClient.get<UpcomingBillsListResponse>(`/api/recurring/upcoming?${params.toString()}`);
  },

  sync: (): Promise<RecurringSyncResult> => {
    return apiClient.post<RecurringSyncResult>('/api/recurring/sync', {});
  },
};
