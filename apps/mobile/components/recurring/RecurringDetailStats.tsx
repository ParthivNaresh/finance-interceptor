import { Text, View } from 'react-native';

import { useTranslation } from '@/hooks';

import { useRecurringDetailStatsDisplay } from './hooks';
import { recurringDetailStatsStyles as styles } from './styles';
import type { RecurringDetailStatsProps } from './types';

export function RecurringDetailStats({
  currentAmount,
  averageAmount,
  currency,
}: RecurringDetailStatsProps) {
  const { t } = useTranslation();
  const { formattedCurrentAmount, formattedAverageAmount } = useRecurringDetailStatsDisplay(
    currentAmount,
    averageAmount,
    currency
  );

  return (
    <View style={styles.row}>
      <View style={styles.item}>
        <Text style={styles.label}>{t('recurringDetail.currentAmount')}</Text>
        <Text style={styles.value}>{formattedCurrentAmount}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.item}>
        <Text style={styles.label}>{t('recurringDetail.average')}</Text>
        <Text style={styles.value}>{formattedAverageAmount}</Text>
      </View>
    </View>
  );
}
