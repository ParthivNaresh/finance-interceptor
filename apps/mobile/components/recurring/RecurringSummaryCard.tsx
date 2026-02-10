import { Text, View } from 'react-native';

import { useTranslation } from '@/hooks';

import { useRecurringSummaryDisplay } from './hooks';
import { recurringSummaryCardStyles as styles } from './styles';
import type { RecurringSummaryCardProps } from './types';

export function RecurringSummaryCard({
  monthlyIncome,
  monthlyExpenses,
  currency = 'USD',
}: RecurringSummaryCardProps) {
  const { t } = useTranslation();
  const { isPositive, formattedIncome, formattedExpenses, formattedNetFlow } =
    useRecurringSummaryDisplay(monthlyIncome, monthlyExpenses, currency);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.item}>
          <Text style={styles.label}>{t('recurring.monthlyIncome')}</Text>
          <Text style={[styles.value, styles.income]}>{formattedIncome}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.item}>
          <Text style={styles.label}>{t('recurring.monthlyExpenses')}</Text>
          <Text style={[styles.value, styles.expense]}>{formattedExpenses}</Text>
        </View>
      </View>

      <View style={styles.netFlowContainer}>
        <Text style={styles.netFlowLabel}>{t('recurring.netFlow')}</Text>
        <Text style={[styles.netFlowValue, isPositive ? styles.positive : styles.negative]}>
          {formattedNetFlow}
        </Text>
      </View>
    </View>
  );
}
