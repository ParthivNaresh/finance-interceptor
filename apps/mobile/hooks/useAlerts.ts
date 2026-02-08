import { useCallback, useEffect, useRef, useState } from 'react';

import { alertsApi } from '@/services/api';
import type { AlertListResponse, AlertWithStream, UserActionType } from '@/types';

interface UseAlertsState {
  alerts: AlertWithStream[];
  total: number;
  unreadCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

interface UseAlertsResult extends UseAlertsState {
  refresh: () => Promise<void>;
  markAsRead: (alertId: string) => Promise<void>;
  dismiss: (alertId: string) => Promise<void>;
  acknowledge: (alertId: string, action?: UserActionType) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export function useAlerts(unreadOnly: boolean = false): UseAlertsResult {
  const [state, setState] = useState<UseAlertsState>({
    alerts: [],
    total: 0,
    unreadCount: 0,
    isLoading: true,
    isRefreshing: false,
    error: null,
  });

  const fetchAlerts = useCallback(
    async (isRefresh: boolean = false) => {
      setState((prev) => ({
        ...prev,
        isLoading: !isRefresh,
        isRefreshing: isRefresh,
        error: null,
      }));

      try {
        const response: AlertListResponse = await alertsApi.list(unreadOnly);
        setState({
          alerts: response.alerts,
          total: response.total,
          unreadCount: response.unread_count,
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load alerts';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          error: message,
        }));
      }
    },
    [unreadOnly]
  );

  const refresh = useCallback(async () => {
    await fetchAlerts(true);
  }, [fetchAlerts]);

  const markAsRead = useCallback(
    async (alertId: string) => {
      await alertsApi.markAsRead(alertId);
      setState((prev) => ({
        ...prev,
        alerts: prev.alerts.map((alert) =>
          alert.id === alertId ? { ...alert, status: 'read' as const } : alert
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));
    },
    []
  );

  const dismiss = useCallback(
    async (alertId: string) => {
      await alertsApi.dismiss(alertId);
      setState((prev) => ({
        ...prev,
        alerts: prev.alerts.map((alert) =>
          alert.id === alertId ? { ...alert, status: 'dismissed' as const } : alert
        ),
        unreadCount: prev.alerts.find((a) => a.id === alertId)?.status === 'unread'
          ? Math.max(0, prev.unreadCount - 1)
          : prev.unreadCount,
      }));
    },
    []
  );

  const acknowledge = useCallback(
    async (alertId: string, action?: UserActionType) => {
      await alertsApi.acknowledge(alertId, action);
      setState((prev) => ({
        ...prev,
        alerts: prev.alerts.map((alert) =>
          alert.id === alertId
            ? { ...alert, status: 'actioned' as const, user_action: action ?? null }
            : alert
        ),
        unreadCount: prev.alerts.find((a) => a.id === alertId)?.status === 'unread'
          ? Math.max(0, prev.unreadCount - 1)
          : prev.unreadCount,
      }));
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    await alertsApi.markAllAsRead();
    setState((prev) => ({
      ...prev,
      alerts: prev.alerts.map((alert) =>
        alert.status === 'unread' ? { ...alert, status: 'read' as const } : alert
      ),
      unreadCount: 0,
    }));
  }, []);

  useEffect(() => {
    void fetchAlerts();
  }, [fetchAlerts]);

  return {
    ...state,
    refresh,
    markAsRead,
    dismiss,
    acknowledge,
    markAllAsRead,
  };
}

interface UseUnreadCountResult {
  count: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useUnreadAlertCount(): UseUnreadCountResult {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetchCount = useCallback(async () => {
    try {
      const response = await alertsApi.getUnreadCount();
      if (mountedRef.current) {
        setCount(response.count);
        setIsLoading(false);
      }
    } catch {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchCount();
  }, [fetchCount]);

  useEffect(() => {
    mountedRef.current = true;
    void fetchCount();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchCount]);

  return { count, isLoading, refresh };
}
