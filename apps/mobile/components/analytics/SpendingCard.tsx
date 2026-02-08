import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { colors, spacing, typography } from '@/styles';
import { formatCurrency } from '@/utils/recurring';

import { ChangeIndicator } from './ChangeIndicator';

type CardVariant = 'spending' | 'income' | 'netFlow';

interface SpendingCardProps {
  variant?: CardVariant;
  amount: number;
  changePercentage: number | null;
  transactionCount?: number;
  periodLabel?: string;
}

const variantConfig: Record<
  CardVariant,
  {
    title: string;
    accentColor: string;
    changeContext: 'spending' | 'income';
  }
> = {
  spending: {
    title: 'Spent',
    accentColor: colors.accent.error,
    changeContext: 'spending',
  },
  income: {
    title: 'Earned',
    accentColor: colors.accent.success,
    changeContext: 'income',
  },
  netFlow: {
    title: 'Net Flow',
    accentColor: colors.accent.primary,
    changeContext: 'income',
  },
};

export function SpendingCard({
  variant = 'spending',
  amount,
  changePercentage,
  transactionCount,
  periodLabel,
}: SpendingCardProps) {
  const config = variantConfig[variant];
  const isPositive = amount >= 0;
  const displayAmount = variant === 'netFlow' ? amount : Math.abs(amount);

  return (
    <GlassCard variant="elevated" padding="lg" style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{config.title}</Text>
        {periodLabel && <Text style={styles.periodLabel}>{periodLabel}</Text>}
      </View>

      <View style={styles.amountContainer}>
        <Text
          style={[
            styles.amount,
            variant === 'netFlow' && {
              color: isPositive ? colors.accent.success : colors.accent.error,
            },
          ]}
        >
          {variant === 'netFlow' && isPositive ? '+' : ''}
          {formatCurrency(displayAmount)}
        </Text>
      </View>

      <View style={styles.footer}>
        <ChangeIndicator
          value={changePercentage}
          context={config.changeContext}
          size="md"
          showIcon
          showLabel
        />
        {transactionCount !== undefined && (
          <Text style={styles.transactionCount}>
            {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
          </Text>
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.labelMedium,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  periodLabel: {
    ...typography.bodySmall,
    color: colors.text.muted,
  },
  amountContainer: {
    marginBottom: spacing.md,
  },
  amount: {
    ...typography.displayMedium,
    color: colors.text.primary,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionCount: {
    ...typography.bodySmall,
    color: colors.text.muted,
  },
});
