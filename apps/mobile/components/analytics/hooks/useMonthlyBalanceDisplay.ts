import { useMemo } from 'react';

import { useTranslation } from '@/hooks';
import { colors } from '@/styles';
import { formatCurrency } from '@/utils';

import type { MonthlyBalanceDisplayResult } from '../types';

export function useMonthlyBalanceDisplay(
  income: number,
  expenses: number,
  savingsRate: number | null,
  runwayMonths: number | null
): MonthlyBalanceDisplayResult {
  const { t } = useTranslation();

  return useMemo(() => {
    const netFlow = income - expenses;

    const status = netFlow > 0 ? 'surplus' : netFlow < 0 ? 'deficit' : 'neutral';

    const statusLabel =
      status === 'surplus'
        ? t('analytics.balance.surplus')
        : status === 'deficit'
          ? t('analytics.balance.bufferUsed')
          : t('analytics.balance.balanced');

    const statusColor =
      status === 'surplus'
        ? colors.accent.success
        : status === 'deficit'
          ? colors.accent.error
          : colors.text.secondary;

    const progressRatio = income > 0 ? Math.min(expenses / income, 1) : expenses > 0 ? 1 : 0;
    const savingsRatio = income > 0 ? Math.max(0, 1 - progressRatio) : 0;

    const formattedIncome = `+${formatCurrency(income)}`;
    const formattedExpenses = formatCurrency(expenses);
    const formattedSavingsRate = savingsRate === null ? '--' : `${Math.round(savingsRate)}%`;
    const formattedNetFlow = `${netFlow >= 0 ? '+' : ''}${formatCurrency(netFlow)}`;

    let formattedRunway: string | null = null;
    if (runwayMonths !== null) {
      if (runwayMonths >= 12) {
        const years = Math.floor(runwayMonths / 12);
        const remainingMonths = Math.round(runwayMonths % 12);
        formattedRunway = remainingMonths === 0 ? `${years}y` : `${years}y ${remainingMonths}mo`;
      } else {
        formattedRunway = `${runwayMonths.toFixed(1)} mo`;
      }
    }

    return {
      netFlow,
      status,
      statusLabel,
      statusColor,
      progressRatio,
      savingsRatio,
      formattedIncome,
      formattedExpenses,
      formattedSavingsRate,
      formattedNetFlow,
      formattedRunway,
    };
  }, [t, income, expenses, savingsRate, runwayMonths]);
}
