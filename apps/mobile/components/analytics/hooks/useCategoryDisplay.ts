import { useMemo } from 'react';

import { useTranslation } from '@/hooks';
import type { CategorySpendingSummary } from '@/types';
import { formatCategoryName, getCategoryColor, getCategoryIcon } from '@/utils';

import type { CategoryDisplayResult } from '../types';

export function useCategoryDisplay(category: CategorySpendingSummary): CategoryDisplayResult {
  const { t } = useTranslation();

  return useMemo(() => {
    const amount = parseFloat(category.total_amount);
    const percentage = category.percentage_of_total
      ? parseFloat(category.percentage_of_total)
      : null;
    const iconName = getCategoryIcon(category.category_primary);
    const categoryColor = getCategoryColor(category.category_primary);
    const displayName = formatCategoryName(category.category_primary);
    const transactionLabel = t('common.transactions', { count: category.transaction_count });

    return {
      amount,
      percentage,
      iconName,
      categoryColor,
      displayName,
      transactionLabel,
    };
  }, [t, category.total_amount, category.percentage_of_total, category.category_primary, category.transaction_count]);
}
