import { useCallback, useEffect, useMemo, useState } from 'react';

import { useTranslation } from '@/hooks';
import { transactionsApi } from '@/services/api';
import type { TransactionDetail } from '@/types';
import { formatCurrency, formatDate } from '@/utils';

import type {
  TransactionDetailsDisplayResult,
  TransactionHeaderDisplayResult,
  TransactionLocationDisplayResult,
  UseTransactionDetailResult,
} from './types';

export function useTransactionDetail(id: string | undefined): UseTransactionDetailResult {
  const { t } = useTranslation();
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransaction = useCallback(async () => {
    if (!id) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await transactionsApi.get(id);
      setTransaction(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('errors.unknownError');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    void fetchTransaction();
  }, [fetchTransaction]);

  return {
    transaction,
    isLoading,
    error,
    refresh: fetchTransaction,
  };
}

export function useTransactionHeaderDisplay(
  transaction: TransactionDetail
): TransactionHeaderDisplayResult {
  return useMemo(() => {
    const displayName = transaction.merchant_name || transaction.name;
    const isIncome = transaction.amount < 0;
    const formattedAmount = formatCurrency(
      Math.abs(transaction.amount),
      transaction.iso_currency_code
    );
    const amountPrefix = isIncome ? '+' : '-';
    const formattedDate = formatDate(transaction.date, { style: 'long' });
    const isPending = transaction.pending;

    return {
      displayName,
      isIncome,
      formattedAmount,
      amountPrefix,
      formattedDate,
      isPending,
    };
  }, [
    transaction.merchant_name,
    transaction.name,
    transaction.amount,
    transaction.iso_currency_code,
    transaction.date,
    transaction.pending,
  ]);
}

export function useTransactionDetailsDisplay(
  transaction: TransactionDetail
): TransactionDetailsDisplayResult {
  return useMemo(() => {
    const authorizedDate = transaction.authorized_date
      ? formatDate(transaction.authorized_date)
      : null;

    return {
      description: transaction.name,
      merchantName: transaction.merchant_name,
      category: transaction.personal_finance_category_primary,
      subcategory: transaction.personal_finance_category_detailed,
      paymentMethod: transaction.payment_channel,
      authorizedDate,
    };
  }, [
    transaction.name,
    transaction.merchant_name,
    transaction.personal_finance_category_primary,
    transaction.personal_finance_category_detailed,
    transaction.payment_channel,
    transaction.authorized_date,
  ]);
}

export function useTransactionLocationDisplay(
  transaction: TransactionDetail | null
): TransactionLocationDisplayResult {
  return useMemo(() => {
    if (!transaction) {
      return { locationString: null };
    }

    const locationParts = [
      transaction.location_address,
      transaction.location_city,
      transaction.location_region,
      transaction.location_postal_code,
      transaction.location_country,
    ].filter(Boolean);

    const locationString = locationParts.length > 0 ? locationParts.join(', ') : null;

    return { locationString };
  }, [transaction]);
}
