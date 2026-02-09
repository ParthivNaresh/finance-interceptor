const MERCHANT_COLOR_PALETTE = [
  '#F97316',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#10B981',
  '#FBBF24',
  '#6366F1',
  '#14B8A6',
  '#EF4444',
  '#22C55E',
] as const;

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export function getMerchantInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 0 || !words[0]) {
    return '??';
  }
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function getMerchantColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return MERCHANT_COLOR_PALETTE[Math.abs(hash) % MERCHANT_COLOR_PALETTE.length];
}

export function getDayOfWeekLabel(dayIndex: number | null): string | null {
  if (dayIndex === null || dayIndex < 0 || dayIndex > 6) {
    return null;
  }
  return DAYS_OF_WEEK[dayIndex];
}

export function getHourLabel(hour: number | null): string | null {
  if (hour === null || hour < 0 || hour > 23) {
    return null;
  }

  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:00 ${period}`;
}

export function formatFrequencyDays(days: number): string {
  if (days <= 1) {
    return 'Daily';
  }
  if (days <= 8) {
    return `Every ${Math.round(days)} days`;
  }
  if (days <= 10) {
    return 'Weekly';
  }
  if (days <= 16) {
    return 'Every 2 weeks';
  }
  if (days <= 35) {
    return 'Monthly';
  }
  if (days <= 100) {
    return 'Quarterly';
  }
  return 'Yearly';
}

export function formatMerchantDateRange(
  firstDate: string,
  lastDate: string
): string {
  const first = new Date(firstDate);
  const last = new Date(lastDate);
  const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };

  const firstFormatted = first.toLocaleDateString('en-US', formatOptions);
  const lastFormatted = last.toLocaleDateString('en-US', formatOptions);

  if (firstFormatted === lastFormatted) {
    return firstFormatted;
  }

  return `${firstFormatted} - ${lastFormatted}`;
}
