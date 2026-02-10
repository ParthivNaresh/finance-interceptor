import { useMemo } from 'react';

import { useTranslation } from '@/hooks';
import type { MerchantSpendingSummary } from '@/types';
import { getMerchantColor, getMerchantInitials } from '@/utils';

import type { MerchantDisplayResult } from '../types';

export function useMerchantDisplay(merchant: MerchantSpendingSummary): MerchantDisplayResult {
  const { t } = useTranslation();

  return useMemo(() => {
    const amount = parseFloat(merchant.total_amount);
    const percentage = merchant.percentage_of_total
      ? parseFloat(merchant.percentage_of_total)
      : null;
    const initials = getMerchantInitials(merchant.merchant_name);
    const avatarColor = getMerchantColor(merchant.merchant_name);
    const transactionLabel = t('common.transactions', { count: merchant.transaction_count });

    return {
      amount,
      percentage,
      initials,
      avatarColor,
      transactionLabel,
    };
  }, [t, merchant.total_amount, merchant.percentage_of_total, merchant.merchant_name, merchant.transaction_count]);
}
