import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, View } from 'react-native';

import { useTranslation } from '@/hooks';
import { colors } from '@/styles';

import { recurringDetailStyles as styles } from './styles';

export function RecurringDetailEmpty() {
  const { t } = useTranslation();

  return (
    <View style={styles.emptyContainer}>
      <FontAwesome name="inbox" size={48} color={colors.text.muted} />
      <Text style={styles.emptyText}>{t('recurringDetail.noTransactions')}</Text>
    </View>
  );
}
