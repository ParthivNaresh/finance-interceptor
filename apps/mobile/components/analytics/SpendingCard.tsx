import { Text, View } from 'react-native';

import { GlassCard } from '@/components/glass';

import { ChangeIndicator } from './ChangeIndicator';
import { useSpendingCardDisplay } from './hooks';
import { spendingCardStyles as styles } from './styles';
import type { SpendingCardProps } from './types';

export function SpendingCard({
  variant = 'spending',
  amount,
  changePercentage,
  transactionCount,
  periodLabel,
}: SpendingCardProps) {
  const { config, formattedAmount, amountColor, transactionLabel } = useSpendingCardDisplay(
    variant,
    amount,
    transactionCount
  );

  return (
    <GlassCard variant="elevated" padding="lg" style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{config.title}</Text>
        {periodLabel && <Text style={styles.periodLabel}>{periodLabel}</Text>}
      </View>

      <View style={styles.amountContainer}>
        <Text style={[styles.amount, amountColor && { color: amountColor }]}>{formattedAmount}</Text>
      </View>

      <View style={styles.footer}>
        <ChangeIndicator
          value={changePercentage}
          context={config.changeContext}
          size="md"
          showIcon
          showLabel
        />
        {transactionLabel && <Text style={styles.transactionCount}>{transactionLabel}</Text>}
      </View>
    </GlassCard>
  );
}
