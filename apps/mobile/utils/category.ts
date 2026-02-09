import type FontAwesome from '@expo/vector-icons/FontAwesome';

import { colors } from '@/styles';

export type FontAwesomeIconName = React.ComponentProps<typeof FontAwesome>['name'];

const CATEGORY_ICONS: Record<string, FontAwesomeIconName> = {
  FOOD_AND_DRINK: 'cutlery',
  TRAVEL: 'plane',
  TRANSPORTATION: 'car',
  SHOPPING: 'shopping-bag',
  ENTERTAINMENT: 'film',
  PERSONAL_CARE: 'heart',
  GENERAL_SERVICES: 'wrench',
  HOME_IMPROVEMENT: 'home',
  MEDICAL: 'medkit',
  RENT_AND_UTILITIES: 'bolt',
  GENERAL_MERCHANDISE: 'cube',
  GOVERNMENT_AND_NON_PROFIT: 'institution',
  BANK_FEES: 'bank',
  LOAN_PAYMENTS: 'credit-card',
  INCOME: 'money',
  TRANSFER_IN: 'arrow-down',
  TRANSFER_OUT: 'arrow-up',
};

const CATEGORY_COLORS: Record<string, string> = {
  FOOD_AND_DRINK: '#F97316',
  TRAVEL: '#3B82F6',
  TRANSPORTATION: '#8B5CF6',
  SHOPPING: '#EC4899',
  ENTERTAINMENT: '#EF4444',
  PERSONAL_CARE: '#F472B6',
  GENERAL_SERVICES: '#6B7280',
  HOME_IMPROVEMENT: '#10B981',
  MEDICAL: '#EF4444',
  RENT_AND_UTILITIES: '#FBBF24',
  GENERAL_MERCHANDISE: '#6366F1',
  GOVERNMENT_AND_NON_PROFIT: '#14B8A6',
  BANK_FEES: '#64748B',
  LOAN_PAYMENTS: '#DC2626',
  INCOME: '#22C55E',
  TRANSFER_IN: '#22C55E',
  TRANSFER_OUT: '#EF4444',
};

export function getCategoryIcon(category: string): FontAwesomeIconName {
  return CATEGORY_ICONS[category] ?? 'tag';
}

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? colors.accent.primary;
}

export function formatCategoryName(category: string): string {
  return category
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

export function formatSubcategoryName(subcategory: string, parentCategory: string): string {
  if (!subcategory || subcategory === parentCategory) {
    return 'Other';
  }

  let cleanName = subcategory;

  if (subcategory.startsWith(`${parentCategory}_`)) {
    cleanName = subcategory.slice(parentCategory.length + 1);
  }

  if (!cleanName) {
    return 'Other';
  }

  return cleanName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
