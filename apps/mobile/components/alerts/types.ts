import type FontAwesome from '@expo/vector-icons/FontAwesome';

import type { AlertWithStream } from '@/types';

export type FontAwesomeIconName = React.ComponentProps<typeof FontAwesome>['name'];

export type AlertBadgeSize = 'small' | 'medium';

export interface AlertItemProps {
  alert: AlertWithStream;
  onPress?: (alert: AlertWithStream) => void;
  onDismiss?: (alertId: string) => void;
}

export interface AlertBadgeProps {
  count: number;
  size?: AlertBadgeSize;
}

export interface AlertDisplayResult {
  iconName: FontAwesomeIconName;
  severityColor: string;
  isUnread: boolean;
  isDismissable: boolean;
  formattedTimestamp: string;
}

export interface AlertBadgeDisplayResult {
  displayCount: string;
  isVisible: boolean;
}
