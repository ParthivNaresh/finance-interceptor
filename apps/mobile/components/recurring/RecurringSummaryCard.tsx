import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/styles';
import { formatCurrency } from '@/utils';

interface RecurringSummaryCardProps {
  monthlyIncome: number;
  monthlyExpenses: number;
  currency?: string;
}

export function RecurringSummaryCard({
  monthlyIncome,
  monthlyExpenses,
  currency = 'USD',
}: RecurringSummaryCardProps) {
  const netFlow = monthlyIncome - monthlyExpenses;
  const isPositive = netFlow >= 0;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.item}>
          <Text style={styles.label}>Monthly Income</Text>
          <Text style={[styles.value, styles.income]}>
            +{formatCurrency(monthlyIncome, currency)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.item}>
          <Text style={styles.label}>Monthly Expenses</Text>
          <Text style={[styles.value, styles.expense]}>
            -{formatCurrency(monthlyExpenses, currency)}
          </Text>
        </View>
      </View>

      <View style={styles.netFlowContainer}>
        <Text style={styles.netFlowLabel}>Net Flow</Text>
        <Text style={[styles.netFlowValue, isPositive ? styles.positive : styles.negative]}>
          {isPositive ? '+' : ''}
          {formatCurrency(netFlow, currency)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border.secondary,
    marginHorizontal: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  value: {
    ...typography.titleMedium,
    fontWeight: '600',
  },
  income: {
    color: colors.accent.success,
  },
  expense: {
    color: colors.text.primary,
  },
  netFlowContainer: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.secondary,
    alignItems: 'center',
  },
  netFlowLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  netFlowValue: {
    ...typography.titleLarge,
    fontWeight: '700',
  },
  positive: {
    color: colors.accent.success,
  },
  negative: {
    color: colors.accent.error,
  },
});
