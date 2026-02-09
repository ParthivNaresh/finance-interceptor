import { Text, View } from 'react-native';

import { useTranslation } from '@/hooks';

import { useRecurringDetailTotalsDisplay } from './hooks';
import { recurringDetailTotalsStyles as styles } from './styles';
import type { RecurringDetailTotalsProps } from './types';

export function RecurringDetailTotals({
  totalSpent,
  occurrenceCount,
  isInflow,
  currency,
}: RecurringDetailTotalsProps) {
  const { t } = useTranslation();
  const { formattedTotalSpent, totalLabel } = useRecurringDetailTotalsDisplay(
    totalSpent,
    isInflow,
    currency
  );

  return (
    <View style={styles.row}>
      <View style={styles.item}>
        <Text style={styles.label}>{totalLabel}</Text>
        <Text style={styles.value}>{formattedTotalSpent}</Text>
      </View>
      <View style={styles.item}>
        <Text style={styles.label}>{t('recurringDetail.occurrences')}</Text>
        <Text style={styles.value}>{occurrenceCount}</Text>
      </View>
    </View>
  );
}
