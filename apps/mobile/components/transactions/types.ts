import type { TransactionDetail } from '@/types';

export interface TransactionHeaderProps {
  transaction: TransactionDetail;
}

export interface TransactionDetailsCardProps {
  transaction: TransactionDetail;
}

export interface TransactionLocationCardProps {
  transaction: TransactionDetail;
}

export interface TransactionWebsiteCardProps {
  website: string;
}

export interface TransactionReferenceCardProps {
  transactionId: string;
}

export interface DetailRowProps {
  label: string;
  value: string | null | undefined;
}

export interface TransactionHeaderDisplayResult {
  displayName: string;
  isIncome: boolean;
  formattedAmount: string;
  amountPrefix: string;
  formattedDate: string;
  isPending: boolean;
}

export interface TransactionDetailsDisplayResult {
  description: string;
  merchantName: string | null;
  category: string | null;
  subcategory: string | null;
  paymentMethod: string | null;
  authorizedDate: string | null;
}

export interface TransactionLocationDisplayResult {
  locationString: string | null;
}

export interface UseTransactionDetailResult {
  transaction: TransactionDetail | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}
