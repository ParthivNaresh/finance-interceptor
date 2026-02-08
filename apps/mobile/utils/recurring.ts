import type FontAwesome from '@expo/vector-icons/FontAwesome';

import type { AlertSeverity, AlertType, FrequencyType, StreamStatus } from '@/types';

type IconName = React.ComponentProps<typeof FontAwesome>['name'];

export function getFrequencyLabel(frequency: FrequencyType): string {
  const labels: Record<FrequencyType, string> = {
    weekly: 'Weekly',
    biweekly: 'Every 2 weeks',
    semi_monthly: 'Twice a month',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    semi_annually: 'Every 6 months',
    annually: 'Yearly',
    irregular: 'Irregular',
    unknown: 'Unknown',
  };
  return labels[frequency] ?? 'Unknown';
}

export function getFrequencyShortLabel(frequency: FrequencyType): string {
  const labels: Record<FrequencyType, string> = {
    weekly: '/wk',
    biweekly: '/2wk',
    semi_monthly: '/2mo',
    monthly: '/mo',
    quarterly: '/qtr',
    semi_annually: '/6mo',
    annually: '/yr',
    irregular: '',
    unknown: '',
  };
  return labels[frequency] ?? '';
}

export function getStreamStatusLabel(status: StreamStatus): string {
  const labels: Record<StreamStatus, string> = {
    mature: 'Active',
    early_detection: 'New',
    tombstoned: 'Ended',
  };
  return labels[status] ?? 'Unknown';
}

export function getStreamStatusColor(status: StreamStatus): string {
  const colors: Record<StreamStatus, string> = {
    mature: '#2DD4BF',
    early_detection: '#FBBF24',
    tombstoned: '#6B7280',
  };
  return colors[status] ?? '#6B7280';
}

export function getAlertTypeIcon(alertType: AlertType): IconName {
  const icons: Record<AlertType, IconName> = {
    price_increase: 'arrow-up',
    price_decrease: 'arrow-down',
    new_subscription: 'plus-circle',
    cancelled_subscription: 'times-circle',
    missed_payment: 'exclamation-triangle',
  };
  return icons[alertType] ?? 'bell';
}

export function getAlertTypeLabel(alertType: AlertType): string {
  const labels: Record<AlertType, string> = {
    price_increase: 'Price Increase',
    price_decrease: 'Price Decrease',
    new_subscription: 'New Subscription',
    cancelled_subscription: 'Subscription Ended',
    missed_payment: 'Missed Payment',
  };
  return labels[alertType] ?? 'Alert';
}

export function getAlertSeverityColor(severity: AlertSeverity): string {
  const colors: Record<AlertSeverity, string> = {
    low: '#2DD4BF',
    medium: '#FBBF24',
    high: '#EF4444',
  };
  return colors[severity] ?? '#6B7280';
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Tomorrow';
  }
  if (diffDays === -1) {
    return 'Yesterday';
  }
  if (diffDays > 0 && diffDays <= 7) {
    return `In ${diffDays} days`;
  }
  if (diffDays < 0 && diffDays >= -7) {
    return `${Math.abs(diffDays)} days ago`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function getDaysUntil(dateString: string | null): number | null {
  if (!dateString) return null;

  const date = new Date(dateString);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const diffMs = date.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
