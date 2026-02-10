import { useMemo } from 'react';

import Colors from '@/constants/Colors';
import type { Transaction } from '@/types';

import type {
  CategoryIconMapping,
  FontAwesomeIconName,
  ThemeColorName,
  ThemeColorProps,
  TransactionDisplayResult,
} from './types';
import { useColorScheme } from './useColorScheme';

const CATEGORY_ICON_MAP: CategoryIconMapping[] = [
  { keywords: ['food', 'restaurant'], icon: 'cutlery' },
  { keywords: ['transport', 'travel'], icon: 'car' },
  { keywords: ['shopping', 'merchandise'], icon: 'shopping-bag' },
  { keywords: ['entertainment', 'recreation'], icon: 'film' },
  { keywords: ['health', 'medical'], icon: 'medkit' },
  { keywords: ['income', 'payroll'], icon: 'money' },
  { keywords: ['transfer'], icon: 'exchange' },
  { keywords: ['bill', 'utilities'], icon: 'file-text' },
  { keywords: ['subscription'], icon: 'refresh' },
];

function getCategoryIcon(category: string | null): FontAwesomeIconName {
  if (!category) {
    return 'question-circle';
  }

  const categoryLower = category.toLowerCase();

  for (const { keywords, icon } of CATEGORY_ICON_MAP) {
    if (keywords.some((keyword) => categoryLower.includes(keyword))) {
      return icon;
    }
  }

  return 'credit-card';
}

function formatTransactionCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(Math.abs(amount));
}

function formatTransactionDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function useTransactionDisplay(transaction: Transaction): TransactionDisplayResult {
  return useMemo(() => {
    const isIncome = transaction.amount < 0;
    const displayName = transaction.merchant_name || transaction.name;
    const categoryIcon = getCategoryIcon(transaction.personal_finance_category_primary);
    const formattedAmount = formatTransactionCurrency(transaction.amount, transaction.iso_currency_code);
    const amountPrefix = isIncome ? '+' : '-';
    const formattedDate = formatTransactionDate(transaction.date);

    return {
      isIncome,
      displayName,
      categoryIcon,
      formattedAmount,
      amountPrefix,
      formattedDate,
    };
  }, [
    transaction.amount,
    transaction.merchant_name,
    transaction.name,
    transaction.personal_finance_category_primary,
    transaction.iso_currency_code,
    transaction.date,
  ]);
}

export function useThemeColor(props: ThemeColorProps, colorName: ThemeColorName): string {
  const theme = useColorScheme() ?? 'light';

  return useMemo(() => {
    const colorFromProps = props[theme];

    if (colorFromProps) {
      return colorFromProps;
    }

    return Colors[theme][colorName];
  }, [props, theme, colorName]);
}
