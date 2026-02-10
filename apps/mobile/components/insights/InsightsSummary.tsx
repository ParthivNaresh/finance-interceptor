import { Text, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { useTranslation } from '@/hooks';

import { summaryStyles as styles } from './styles';
import type { InsightsSummaryProps } from './types';

function formatAmount(amount: number): string {
  return `$${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

export function InsightsSummary({ totalIncome, netFlow }: InsightsSummaryProps) {
  const { t } = useTranslation();
  const isPositiveNetFlow = netFlow >= 0;

  return (
    <View style={styles.container}>
      <GlassCard variant="subtle" padding="md">
        <View style={styles.row}>
          <View style={styles.item}>
            <Text style={styles.label}>{t('insights.earned')}</Text>
            <Text style={[styles.value, styles.incomeValue]}>+{formatAmount(totalIncome)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.item}>
            <Text style={styles.label}>{t('insights.netFlow')}</Text>
            <Text
              style={[
                styles.value,
                isPositiveNetFlow ? styles.incomeValue : styles.expenseValue,
              ]}
            >
              {isPositiveNetFlow ? '+' : ''}{formatAmount(netFlow)}
            </Text>
          </View>
        </View>
      </GlassCard>
    </View>
  );
}
