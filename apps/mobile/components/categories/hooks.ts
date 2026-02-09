import { useMemo } from 'react';

import type { SubcategoryDataPoint } from '@/components/analytics';
import { useTranslation } from '@/hooks';
import type { SubcategorySpendingSummary } from '@/types';
import {
  formatCategoryName,
  formatSubcategoryName,
  getCategoryColor,
  getCategoryIcon,
} from '@/utils';
import { formatCurrency } from '@/utils/recurring';

import type { CategoryDetailDisplayResult } from './types';

export function useCategoryDetailDisplay(
  categoryName: string,
  totalAmount: number,
  transactionCount: number,
  percentageOfTotal: number | null,
  averageTransaction: number | null
): CategoryDetailDisplayResult {
  const { t } = useTranslation();

  return useMemo(() => {
    const categoryIcon = getCategoryIcon(categoryName);
    const categoryColor = getCategoryColor(categoryName);
    const displayName = formatCategoryName(categoryName);
    const formattedTotal = formatCurrency(totalAmount);
    const formattedAverage = averageTransaction !== null ? formatCurrency(averageTransaction) : null;
    const percentageLabel = percentageOfTotal !== null
      ? t('categories.percentOfTotal', { percent: percentageOfTotal.toFixed(1) })
      : null;
    const transactionLabel = t('common.transactions', { count: transactionCount });

    return {
      categoryIcon,
      categoryColor,
      displayName,
      formattedTotal,
      formattedAverage,
      percentageLabel,
      transactionLabel,
    };
  }, [t, categoryName, totalAmount, transactionCount, percentageOfTotal, averageTransaction]);
}

export function useSubcategoryTransform(
  subcategories: SubcategorySpendingSummary[],
  parentCategory: string
): SubcategoryDataPoint[] {
  const { t } = useTranslation();

  return useMemo(() => {
    return subcategories.map((sub) => {
      const name = formatSubcategoryName(sub.category_detailed, parentCategory);
      const localizedName = name === 'Other' ? t('categories.other') : name;

      return {
        name: localizedName,
        value: parseFloat(sub.total_amount),
        percentage: sub.percentage_of_category ? parseFloat(sub.percentage_of_category) : 0,
        transactionCount: sub.transaction_count,
      };
    });
  }, [t, subcategories, parentCategory]);
}
