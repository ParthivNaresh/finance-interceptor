import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/styles';
import type { Transaction } from '@/types';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: (transaction: Transaction) => void;
}

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(Math.abs(amount));
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function getCategoryIcon(category: string | null): React.ComponentProps<typeof FontAwesome>['name'] {
  if (!category) {
    return 'question-circle';
  }

  const categoryLower = category.toLowerCase();

  if (categoryLower.includes('food') || categoryLower.includes('restaurant')) {
    return 'cutlery';
  }
  if (categoryLower.includes('transport') || categoryLower.includes('travel')) {
    return 'car';
  }
  if (categoryLower.includes('shopping') || categoryLower.includes('merchandise')) {
    return 'shopping-bag';
  }
  if (categoryLower.includes('entertainment') || categoryLower.includes('recreation')) {
    return 'film';
  }
  if (categoryLower.includes('health') || categoryLower.includes('medical')) {
    return 'medkit';
  }
  if (categoryLower.includes('income') || categoryLower.includes('payroll')) {
    return 'money';
  }
  if (categoryLower.includes('transfer')) {
    return 'exchange';
  }
  if (categoryLower.includes('bill') || categoryLower.includes('utilities')) {
    return 'file-text';
  }
  if (categoryLower.includes('subscription')) {
    return 'refresh';
  }

  return 'credit-card';
}

export function TransactionItem({ transaction, onPress }: TransactionItemProps) {
  const isIncome = transaction.amount < 0;
  const displayName = transaction.merchant_name || transaction.name;
  const categoryIcon = getCategoryIcon(transaction.personal_finance_category_primary);

  const handlePress = () => {
    onPress?.(transaction);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={handlePress}
    >
      <View style={styles.iconContainer}>
        <FontAwesome name={categoryIcon} size={18} color={colors.text.secondary} />
      </View>

      <View style={styles.details}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={[styles.amount, isIncome ? styles.income : styles.expense]}>
            {isIncome ? '+' : '-'}
            {formatCurrency(transaction.amount, transaction.iso_currency_code)}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.metaInfo}>
            <Text style={styles.date}>{formatDate(transaction.date)}</Text>
            {transaction.pending && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>Pending</Text>
              </View>
            )}
          </View>
          {transaction.personal_finance_category_primary && (
            <Text style={styles.category}>{transaction.personal_finance_category_primary}</Text>
          )}
        </View>
      </View>

      <FontAwesome name="chevron-right" size={12} color={colors.text.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  pressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  details: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    ...typography.titleMedium,
    flex: 1,
    marginRight: spacing.sm,
  },
  amount: {
    ...typography.titleMedium,
    fontWeight: '600',
  },
  income: {
    color: colors.accent.success,
  },
  expense: {
    color: colors.text.primary,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  date: {
    ...typography.bodySmall,
  },
  pendingBadge: {
    backgroundColor: colors.accent.warning,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendingText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.background.primary,
  },
  category: {
    ...typography.caption,
    textTransform: 'capitalize',
  },
});
