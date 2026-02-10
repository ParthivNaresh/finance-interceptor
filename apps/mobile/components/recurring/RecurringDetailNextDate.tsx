import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, View } from 'react-native';

import { useTranslation } from '@/hooks';
import { colors } from '@/styles';
import { formatDate } from '@/utils';

import { recurringDetailNextDateStyles as styles } from './styles';
import type { RecurringDetailNextDateProps } from './types';

export function RecurringDetailNextDate({ nextDate }: RecurringDetailNextDateProps) {
  const { t } = useTranslation();
  const formattedDate = formatDate(nextDate);

  return (
    <View style={styles.row}>
      <FontAwesome name="calendar" size={14} color={colors.accent.primary} />
      <Text style={styles.text}>
        {t('recurringDetail.nextExpected', { date: formattedDate })}
      </Text>
    </View>
  );
}
