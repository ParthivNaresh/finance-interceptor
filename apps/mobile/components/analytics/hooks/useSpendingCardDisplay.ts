import { useMemo } from 'react';

import { useTranslation } from '@/hooks';
import { colors } from '@/styles';
import { formatCurrency } from '@/utils';

import type { CardVariant, ChangeContext, SpendingCardDisplayResult } from '../types';

export function useSpendingCardDisplay(
  variant: CardVariant,
  amount: number,
  transactionCount?: number
): SpendingCardDisplayResult {
  const { t } = useTranslation();

  return useMemo(() => {
    const title = t(`analytics.cardVariant.${variant}` as const);
    const changeContext: ChangeContext = variant === 'spending' ? 'spending' : 'income';
    const config = {
      title,
      accentColor: variant === 'spending'
        ? colors.accent.error
        : variant === 'income'
          ? colors.accent.success
          : colors.accent.primary,
      changeContext,
    };
    const isPositive = amount >= 0;
    const displayAmount = variant === 'netFlow' ? amount : Math.abs(amount);
    const prefix = variant === 'netFlow' && isPositive ? '+' : '';
    const formattedAmount = `${prefix}${formatCurrency(displayAmount)}`;
    const amountColor = variant === 'netFlow'
      ? (isPositive ? colors.accent.success : colors.accent.error)
      : null;
    const transactionLabel = transactionCount !== undefined
      ? t('common.transactions', { count: transactionCount })
      : null;

    return {
      config,
      isPositive,
      displayAmount,
      formattedAmount,
      amountColor,
      transactionLabel,
    };
  }, [t, variant, amount, transactionCount]);
}
