import type { CreepSeverity, PeriodType } from '@/types';

export function formatPeriodLabel(periodStart: string, periodType: PeriodType): string {
  const date = new Date(periodStart);

  switch (periodType) {
    case 'daily':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'weekly':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'monthly':
      return date.toLocaleDateString('en-US', { month: 'short' });
    case 'yearly':
      return date.getFullYear().toString();
    default:
      return periodStart;
  }
}

export function getMonthlyMultiplier(frequency: string): number {
  switch (frequency) {
    case 'weekly':
      return 4.33;
    case 'biweekly':
      return 2.17;
    case 'semi_monthly':
      return 2;
    case 'monthly':
      return 1;
    case 'quarterly':
      return 0.33;
    case 'semi_annually':
      return 0.17;
    case 'annually':
      return 0.083;
    default:
      return 1;
  }
}

export function getCreepSeverityColor(severity: CreepSeverity): string {
  const colors: Record<CreepSeverity, string> = {
    none: '#2DD4BF',
    low: '#FBBF24',
    medium: '#F97316',
    high: '#EF4444',
  };
  return colors[severity] ?? '#6B7280';
}

export function getCreepSeverityLabel(severity: CreepSeverity): string {
  const labels: Record<CreepSeverity, string> = {
    none: 'On Track',
    low: 'Slight Increase',
    medium: 'Moderate Increase',
    high: 'Significant Increase',
  };
  return labels[severity] ?? 'Unknown';
}

export function formatPercentageChange(percentage: number): string {
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(1)}%`;
}
