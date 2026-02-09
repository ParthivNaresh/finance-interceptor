import { useMemo } from 'react';

import { useTranslation } from '@/hooks';
import type { MerchantStats } from '@/types';
import { formatCategoryName, formatCurrency, formatMerchantDateRange, getMerchantColor, getMerchantInitials } from '@/utils';

import type { MerchantStatsDisplayResult } from '../types';

const DAYS_OF_WEEK_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export function useMerchantStatsDisplay(merchant: MerchantStats): MerchantStatsDisplayResult {
  const { t } = useTranslation();

  return useMemo(() => {
    const lifetimeSpend = parseFloat(merchant.total_lifetime_spend);
    const avgTransaction = merchant.average_transaction_amount
      ? parseFloat(merchant.average_transaction_amount)
      : null;
    const initials = getMerchantInitials(merchant.merchant_name);
    const avatarColor = getMerchantColor(merchant.merchant_name);
    const dateRange = formatMerchantDateRange(
      merchant.first_transaction_date,
      merchant.last_transaction_date
    );

    const dayOfWeekIndex = merchant.most_frequent_day_of_week;
    const dayOfWeek = dayOfWeekIndex !== null && dayOfWeekIndex >= 0 && dayOfWeekIndex < 7
      ? t(`daysOfWeek.${DAYS_OF_WEEK_KEYS[dayOfWeekIndex]}` as const)
      : null;

    const formattedLifetimeSpend = formatCurrency(lifetimeSpend);
    const formattedAvgTransaction = avgTransaction !== null ? formatCurrency(avgTransaction) : null;
    const formattedCategory = merchant.primary_category
      ? formatCategoryName(merchant.primary_category)
      : null;
    const formattedFrequency = merchant.average_days_between_transactions
      ? t('analytics.merchant.every', { days: Math.round(parseFloat(merchant.average_days_between_transactions)) })
      : null;
    const formattedMedian = merchant.median_transaction_amount
      ? formatCurrency(parseFloat(merchant.median_transaction_amount))
      : null;

    return {
      lifetimeSpend,
      avgTransaction,
      initials,
      avatarColor,
      dateRange,
      dayOfWeek,
      formattedLifetimeSpend,
      formattedAvgTransaction,
      formattedCategory,
      formattedFrequency,
      formattedMedian,
    };
  }, [
    t,
    merchant.total_lifetime_spend,
    merchant.average_transaction_amount,
    merchant.merchant_name,
    merchant.first_transaction_date,
    merchant.last_transaction_date,
    merchant.most_frequent_day_of_week,
    merchant.primary_category,
    merchant.average_days_between_transactions,
    merchant.median_transaction_amount,
  ]);
}
