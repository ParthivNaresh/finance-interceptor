import type { RecurringStream, RecurringStreamDetailResponse, StreamTransaction, UpcomingBill } from '@/types';

export interface UpcomingBillItemProps {
  bill: UpcomingBill;
  onPress?: (bill: UpcomingBill) => void;
}

export interface RecurringStreamItemProps {
  stream: RecurringStream;
  onPress?: (stream: RecurringStream) => void;
  showNextDate?: boolean;
}

export interface RecurringSummaryCardProps {
  monthlyIncome: number;
  monthlyExpenses: number;
  currency?: string;
}

export interface UpcomingBillDisplayResult {
  displayName: string;
  formattedAmount: string;
  dueDateLabel: string;
  dueDateColor: string;
}

export interface RecurringStreamDisplayResult {
  displayName: string;
  formattedAmount: string;
  amountPrefix: string;
  frequencyLabel: string;
  statusColor: string;
  statusLabel: string;
  iconName: 'arrow-down' | 'arrow-up';
  iconColor: string;
  formattedNextDate: string | null;
}

export interface RecurringSummaryDisplayResult {
  netFlow: number;
  isPositive: boolean;
  formattedIncome: string;
  formattedExpenses: string;
  formattedNetFlow: string;
}

export interface RecurringDetailHeaderProps {
  data: RecurringStreamDetailResponse;
}

export interface RecurringDetailStatsProps {
  currentAmount: number;
  averageAmount: number;
  currency: string;
}

export interface RecurringDetailTotalsProps {
  totalSpent: number;
  occurrenceCount: number;
  isInflow: boolean;
  currency: string;
}

export interface RecurringDetailNextDateProps {
  nextDate: string;
}

export interface RecurringTransactionItemProps {
  transaction: StreamTransaction;
}

export interface RecurringDetailLoadingProps {
  title?: string;
}

export interface RecurringDetailErrorProps {
  error: string;
  onRetry: () => void;
}

export type RecurringDetailEmptyProps = Record<string, never>;

export interface RecurringDetailDisplayResult {
  displayName: string;
  statusColor: string;
  statusLabel: string;
  frequencyLabel: string;
  isInflow: boolean;
}

export interface RecurringDetailStatsDisplayResult {
  formattedCurrentAmount: string;
  formattedAverageAmount: string;
}

export interface RecurringDetailTotalsDisplayResult {
  formattedTotalSpent: string;
  totalLabel: string;
}

export interface RecurringTransactionDisplayResult {
  displayName: string;
  formattedDate: string;
  formattedAmount: string;
}

export interface UseRecurringDetailResult {
  data: RecurringStreamDetailResponse | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => void;
}
