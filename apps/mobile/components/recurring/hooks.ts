import { useCallback, useEffect, useMemo, useState } from 'react';

import { useTranslation } from '@/hooks';
import { recurringApi } from '@/services/api';
import { colors } from '@/styles';
import type { RecurringStream, RecurringStreamDetailResponse, StreamTransaction, UpcomingBill } from '@/types';
import {
  formatCurrency,
  formatDate,
  formatRelativeDate,
  getFrequencyLabel,
  getFrequencyShortLabel,
  getStreamStatusColor,
  getStreamStatusLabel,
} from '@/utils';

import type {
  RecurringDetailDisplayResult,
  RecurringDetailStatsDisplayResult,
  RecurringDetailTotalsDisplayResult,
  RecurringStreamDisplayResult,
  RecurringSummaryDisplayResult,
  RecurringTransactionDisplayResult,
  UpcomingBillDisplayResult,
  UseRecurringDetailResult,
} from './types';

export function useUpcomingBillDisplay(bill: UpcomingBill): UpcomingBillDisplayResult {
  const { t } = useTranslation();

  return useMemo(() => {
    const displayName = bill.stream.merchant_name || bill.stream.description;
    const formattedAmount = formatCurrency(bill.expected_amount, bill.stream.iso_currency_code);

    let dueDateLabel: string;
    const daysUntil = bill.days_until_due;

    if (daysUntil < 0) {
      dueDateLabel = t('time.daysOverdue', { count: Math.abs(daysUntil) });
    } else if (daysUntil === 0) {
      dueDateLabel = t('recurring.dueToday');
    } else if (daysUntil === 1) {
      dueDateLabel = t('recurring.dueTomorrow');
    } else {
      dueDateLabel = t('recurring.dueIn', { days: daysUntil });
    }

    let dueDateColor: string;
    if (daysUntil < 0) {
      dueDateColor = colors.accent.error;
    } else if (daysUntil <= 3) {
      dueDateColor = colors.accent.warning;
    } else {
      dueDateColor = colors.text.secondary;
    }

    return {
      displayName,
      formattedAmount,
      dueDateLabel,
      dueDateColor,
    };
  }, [t, bill.stream.merchant_name, bill.stream.description, bill.expected_amount, bill.stream.iso_currency_code, bill.days_until_due]);
}

export function useRecurringStreamDisplay(stream: RecurringStream): RecurringStreamDisplayResult {
  return useMemo(() => {
    const displayName = stream.merchant_name || stream.description;
    const formattedAmount = formatCurrency(stream.last_amount, stream.iso_currency_code);
    const amountPrefix = stream.stream_type === 'outflow' ? '-' : '+';
    const frequencyLabel = getFrequencyShortLabel(stream.frequency);
    const statusColor = getStreamStatusColor(stream.status);
    const statusLabel = getStreamStatusLabel(stream.status);
    const iconName: 'arrow-down' | 'arrow-up' = stream.stream_type === 'inflow' ? 'arrow-down' : 'arrow-up';
    const iconColor = stream.stream_type === 'inflow' ? colors.accent.success : colors.text.primary;
    const formattedNextDate = stream.predicted_next_date
      ? formatRelativeDate(stream.predicted_next_date)
      : null;

    return {
      displayName,
      formattedAmount,
      amountPrefix,
      frequencyLabel,
      statusColor,
      statusLabel,
      iconName,
      iconColor,
      formattedNextDate,
    };
  }, [
    stream.merchant_name,
    stream.description,
    stream.last_amount,
    stream.iso_currency_code,
    stream.stream_type,
    stream.frequency,
    stream.status,
    stream.predicted_next_date,
  ]);
}

export function useRecurringSummaryDisplay(
  monthlyIncome: number,
  monthlyExpenses: number,
  currency: string
): RecurringSummaryDisplayResult {
  return useMemo(() => {
    const netFlow = monthlyIncome - monthlyExpenses;
    const isPositive = netFlow >= 0;
    const formattedIncome = `+${formatCurrency(monthlyIncome, currency)}`;
    const formattedExpenses = `-${formatCurrency(monthlyExpenses, currency)}`;
    const formattedNetFlow = `${isPositive ? '+' : ''}${formatCurrency(netFlow, currency)}`;

    return {
      netFlow,
      isPositive,
      formattedIncome,
      formattedExpenses,
      formattedNetFlow,
    };
  }, [monthlyIncome, monthlyExpenses, currency]);
}

export function useRecurringDetail(id: string | undefined): UseRecurringDetailResult {
  const [data, setData] = useState<RecurringStreamDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (isRefresh: boolean = false) => {
      if (!id) return;

      if (!isRefresh) {
        setIsLoading(true);
      }
      setIsRefreshing(isRefresh);
      setError(null);

      try {
        const response = await recurringApi.getWithTransactions(id);
        setData(response);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load details';
        setError(message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    void fetchData(true);
  }, [fetchData]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refresh,
  };
}

export function useRecurringDetailDisplay(stream: RecurringStream): RecurringDetailDisplayResult {
  return useMemo(() => {
    const displayName = stream.merchant_name || stream.description;
    const statusColor = getStreamStatusColor(stream.status);
    const statusLabel = getStreamStatusLabel(stream.status);
    const frequencyLabel = getFrequencyLabel(stream.frequency);
    const isInflow = stream.stream_type === 'inflow';

    return {
      displayName,
      statusColor,
      statusLabel,
      frequencyLabel,
      isInflow,
    };
  }, [stream.merchant_name, stream.description, stream.status, stream.frequency, stream.stream_type]);
}

export function useRecurringDetailStatsDisplay(
  currentAmount: number,
  averageAmount: number,
  currency: string
): RecurringDetailStatsDisplayResult {
  return useMemo(() => ({
    formattedCurrentAmount: formatCurrency(currentAmount, currency),
    formattedAverageAmount: formatCurrency(averageAmount, currency),
  }), [currentAmount, averageAmount, currency]);
}

export function useRecurringDetailTotalsDisplay(
  totalSpent: number,
  isInflow: boolean,
  currency: string
): RecurringDetailTotalsDisplayResult {
  const { t } = useTranslation();

  return useMemo(() => ({
    formattedTotalSpent: formatCurrency(totalSpent, currency),
    totalLabel: isInflow ? t('recurringDetail.totalIncome') : t('recurringDetail.totalSpent'),
  }), [t, totalSpent, isInflow, currency]);
}

export function useRecurringTransactionDisplay(
  transaction: StreamTransaction
): RecurringTransactionDisplayResult {
  return useMemo(() => {
    const displayName = transaction.merchant_name || transaction.name;
    const formattedDate = formatDate(transaction.date);
    const formattedAmount = formatCurrency(Math.abs(transaction.amount), transaction.iso_currency_code);

    return {
      displayName,
      formattedDate,
      formattedAmount,
    };
  }, [transaction.merchant_name, transaction.name, transaction.date, transaction.amount, transaction.iso_currency_code]);
}
