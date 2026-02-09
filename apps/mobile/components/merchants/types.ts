import type { MerchantSpendingHistoryItem, MerchantStats } from '@/types';
import type { FontAwesomeIconName } from '@/utils';

export interface MerchantHeaderProps {
  merchantName: string;
  merchant: MerchantStats;
  lifetimeSpend: number;
}

export interface MerchantStatsGridProps {
  averageTransaction: number | null;
  medianTransaction: number | null;
  maxTransaction: number | null;
  daysBetweenTransactions: number | null;
}

export interface MerchantPatternsProps {
  dayOfWeekLabel: string | null;
  hourLabel: string | null;
}

export interface MerchantHistoryHeaderProps {
  historyCount: number;
}

export interface MerchantHistoryItemProps {
  item: MerchantSpendingHistoryItem;
}

export interface MerchantLoadingProps {
  merchantName: string;
  isComputing?: boolean;
}

export interface MerchantErrorProps {
  merchantName: string;
  error: string | null;
  onRetry: () => void;
}

export interface StatCardProps {
  label: string;
  value: string;
  icon: FontAwesomeIconName;
  color?: string;
}

export interface MerchantDetailDisplayResult {
  initials: string;
  avatarColor: string;
  dateRange: string;
  formattedCategory: string | null;
  formattedLifetimeSpend: string;
  transactionCountLabel: string;
}

export interface MerchantStatsDisplayResult {
  formattedAverage: string;
  formattedMedian: string;
  formattedMax: string;
  formattedFrequency: string;
}

export interface MerchantHistoryDisplayResult {
  monthLabel: string;
  formattedAmount: string;
  transactionLabel: string;
}
