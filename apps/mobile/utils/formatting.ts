export type DateFormatStyle = 'short' | 'medium' | 'long' | 'full';

export interface CurrencyFormatOptions {
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  showSign?: boolean;
}

export interface DateFormatOptions {
  style?: DateFormatStyle;
  includeTime?: boolean;
  includeYear?: boolean;
}

const DATE_FORMAT_OPTIONS: Record<DateFormatStyle, Intl.DateTimeFormatOptions> = {
  short: { month: 'short', day: 'numeric' },
  medium: { month: 'short', day: 'numeric', year: 'numeric' },
  long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
  full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
};

export function formatCurrency(
  amount: number,
  options: CurrencyFormatOptions | string = {}
): string {
  const opts: CurrencyFormatOptions = typeof options === 'string'
    ? { currency: options }
    : options;

  const {
    currency = 'USD',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showSign = false,
  } = opts;

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(Math.abs(amount));

  if (showSign) {
    return amount >= 0 ? `+${formatted}` : `-${formatted}`;
  }

  return formatted;
}

export function formatCompactCurrency(amount: number, currency: string = 'USD'): string {
  if (Math.abs(amount) >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1000) {
    return `$${(amount / 1000).toFixed(1)}k`;
  }
  return formatCurrency(amount, { currency, maximumFractionDigits: 0 });
}

export function formatDate(
  dateInput: string | Date,
  options: DateFormatOptions = {}
): string {
  const { style = 'medium', includeTime = false, includeYear = true } = options;

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

  const formatOptions: Intl.DateTimeFormatOptions = { ...DATE_FORMAT_OPTIONS[style] };

  if (!includeYear) {
    delete formatOptions.year;
  }

  if (includeTime) {
    formatOptions.hour = 'numeric';
    formatOptions.minute = '2-digit';
  }

  return date.toLocaleDateString('en-US', formatOptions);
}

export function formatMonthYear(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
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

  return formatDate(date, { style: 'short', includeYear: false });
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

export function formatPercentage(
  value: number,
  options: { decimals?: number; showSign?: boolean } = {}
): string {
  const { decimals = 1, showSign = false } = options;
  const formatted = `${Math.abs(value).toFixed(decimals)}%`;

  if (showSign && value !== 0) {
    return value > 0 ? `+${formatted}` : `-${formatted}`;
  }

  return formatted;
}

export function formatNumber(
  value: number,
  options: { decimals?: number; compact?: boolean } = {}
): string {
  const { decimals = 0, compact = false } = options;

  if (compact) {
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
  }

  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
