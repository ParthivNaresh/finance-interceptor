import type {
  Alert,
  AlertListResponse,
  AlertWithStream,
  UserActionType,
} from '@/types';

import { apiClient } from './client';

export const alertsApi = {
  list: (
    unreadOnly: boolean = false,
    limit: number = 50,
    offset: number = 0
  ): Promise<AlertListResponse> => {
    const params = new URLSearchParams();
    params.append('unread_only', unreadOnly.toString());
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    return apiClient.get<AlertListResponse>(`/api/alerts?${params.toString()}`);
  },

  get: (alertId: string): Promise<AlertWithStream> => {
    return apiClient.get<AlertWithStream>(`/api/alerts/${alertId}`);
  },

  getUnreadCount: (): Promise<{ count: number }> => {
    return apiClient.get<{ count: number }>('/api/alerts/unread/count');
  },

  markAsRead: (alertId: string): Promise<Alert> => {
    return apiClient.post<Alert>(`/api/alerts/${alertId}/read`, {});
  },

  dismiss: (alertId: string): Promise<Alert> => {
    return apiClient.post<Alert>(`/api/alerts/${alertId}/dismiss`, {});
  },

  acknowledge: (alertId: string, userAction?: UserActionType): Promise<Alert> => {
    const body: Record<string, unknown> = {};
    if (userAction) {
      body.user_action = userAction;
    }
    return apiClient.post<Alert>(`/api/alerts/${alertId}/acknowledge`, body);
  },

  markAllAsRead: (): Promise<{ marked_as_read: number }> => {
    return apiClient.post<{ marked_as_read: number }>('/api/alerts/read-all', {});
  },
};
