import { useMemo } from 'react';

import { useTranslation } from '@/hooks';
import type { MerchantSpendingHistoryItem, MerchantStats } from '@/types';
import {
  formatCategoryName,
  formatCurrency,
  formatMerchantDateRange,
  formatMonthYear,
  getMerchantColor,
  getMerchantInitials,
} from '@/utils';

import type {
  MerchantDetailDisplayResult,
  MerchantHistoryDisplayResult,
  MerchantStatsDisplayResult,
} from './types';

export function useMerchantDetailDisplay(
  merchantName: string,
  merchant: MerchantStats | null,
  lifetimeSpend: number
): MerchantDetailDisplayResult {
  const { t } = useTranslation();

  return useMemo(() => {
    const initials = getMerchantInitials(merchantName);
    const avatarColor = getMerchantColor(merchantName);

    const dateRange = merchant
      ? formatMerchantDateRange(merchant.first_transaction_date, merchant.last_transaction_date)
      : '';

    const formattedCategory = merchant?.primary_category
      ? formatCategoryName(merchant.primary_category)
      : null;

    const formattedLifetimeSpend = formatCurrency(lifetimeSpend);

    const transactionCountLabel = merchant
      ? t('merchants.totalTransactions', { count: merchant.total_transaction_count })
      : '';

    return {
      initials,
      avatarColor,
      dateRange,
      formattedCategory,
      formattedLifetimeSpend,
      transactionCountLabel,
    };
  }, [t, merchantName, merchant, lifetimeSpend]);
}

export function useMerchantStatsDisplay(
  averageTransaction: number | null,
  medianTransaction: number | null,
  maxTransaction: number | null,
  daysBetweenTransactions: number | null
): MerchantStatsDisplayResult {
  return useMemo(() => {
    const formattedAverage = averageTransaction !== null
      ? formatCurrency(averageTransaction)
      : '-';

    const formattedMedian = medianTransaction !== null
      ? formatCurrency(medianTransaction)
      : '-';

    const formattedMax = maxTransaction !== null
      ? formatCurrency(maxTransaction)
      : '-';

    const formattedFrequency = daysBetweenTransactions !== null
      ? `${Math.round(daysBetweenTransactions)}d`
      : '-';

    return {
      formattedAverage,
      formattedMedian,
      formattedMax,
      formattedFrequency,
    };
  }, [averageTransaction, medianTransaction, maxTransaction, daysBetweenTransactions]);
}

export function useMerchantHistoryDisplay(
  item: MerchantSpendingHistoryItem
): MerchantHistoryDisplayResult {
  const { t } = useTranslation();

  return useMemo(() => {
    const amount = parseFloat(item.total_amount);
    const monthLabel = formatMonthYear(item.period_start);
    const formattedAmount = formatCurrency(amount);
    const transactionLabel = t('common.transactions', { count: item.transaction_count });

    return {
      monthLabel,
      formattedAmount,
      transactionLabel,
    };
  }, [t, item.total_amount, item.period_start, item.transaction_count]);
}
