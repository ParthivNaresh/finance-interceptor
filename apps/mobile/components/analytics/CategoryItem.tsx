import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/styles';
import type { CategorySpendingSummary } from '@/types';
import { formatCurrency } from '@/utils/recurring';

interface CategoryItemProps {
  category: CategorySpendingSummary;
  onPress?: (category: CategorySpendingSummary) => void;
}

type IconName = React.ComponentProps<typeof FontAwesome>['name'];

const categoryIcons: Record<string, IconName> = {
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

const categoryColors: Record<string, string> = {
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

function getCategoryIcon(category: string): IconName {
  return categoryIcons[category] ?? 'tag';
}

function getCategoryColor(category: string): string {
  return categoryColors[category] ?? colors.accent.primary;
}

function formatCategoryName(category: string): string {
  return category
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

export function CategoryItem({ category, onPress }: CategoryItemProps) {
  const amount = parseFloat(category.total_amount);
  const percentage = category.percentage_of_total
    ? parseFloat(category.percentage_of_total)
    : null;
  const iconName = getCategoryIcon(category.category_primary);
  const categoryColor = getCategoryColor(category.category_primary);

  const content = (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: `${categoryColor}20` }]}>
        <FontAwesome name={iconName} size={16} color={categoryColor} />
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {formatCategoryName(category.category_primary)}
          </Text>
          <Text style={styles.amount}>{formatCurrency(amount)}</Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(percentage ?? 0, 100)}%`,
                  backgroundColor: categoryColor,
                },
              ]}
            />
          </View>
          <Text style={styles.percentage}>
            {percentage !== null ? `${percentage.toFixed(1)}%` : '—'}
          </Text>
        </View>

        <Text style={styles.transactionCount}>
          {category.transaction_count} transaction{category.transaction_count !== 1 ? 's' : ''}
        </Text>
      </View>

      {onPress && (
        <FontAwesome name="chevron-right" size={12} color={colors.text.muted} style={styles.chevron} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={() => onPress(category)}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    ...typography.titleSmall,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  amount: {
    ...typography.titleSmall,
    color: colors.text.primary,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressContainer: {
    flex: 1,
    height: 4,
    backgroundColor: colors.background.tertiary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  percentage: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    width: 45,
    textAlign: 'right',
  },
  transactionCount: {
    ...typography.caption,
    color: colors.text.muted,
  },
  chevron: {
    marginLeft: spacing.xs,
  },
});
