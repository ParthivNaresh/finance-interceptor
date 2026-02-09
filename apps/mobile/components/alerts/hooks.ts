import { useMemo } from 'react';

import type { AlertWithStream } from '@/types';
import { formatRelativeDate, getAlertSeverityColor, getAlertTypeIcon } from '@/utils';

import type { AlertBadgeDisplayResult, AlertDisplayResult } from './types';

export function useAlertDisplay(alert: AlertWithStream): AlertDisplayResult {
  return useMemo(() => {
    const iconName = getAlertTypeIcon(alert.alert_type);
    const severityColor = getAlertSeverityColor(alert.severity);
    const isUnread = alert.status === 'unread';
    const isDismissable = alert.status !== 'dismissed' && alert.status !== 'actioned';
    const formattedTimestamp = formatRelativeDate(alert.created_at);

    return {
      iconName,
      severityColor,
      isUnread,
      isDismissable,
      formattedTimestamp,
    };
  }, [alert.alert_type, alert.severity, alert.status, alert.created_at]);
}

export function useAlertBadgeDisplay(count: number): AlertBadgeDisplayResult {
  return useMemo(() => {
    const isVisible = count > 0;
    const displayCount = count > 99 ? '99+' : count.toString();

    return {
      displayCount,
      isVisible,
    };
  }, [count]);
}
