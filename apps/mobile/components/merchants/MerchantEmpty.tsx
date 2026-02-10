import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, View } from 'react-native';

import { useTranslation } from '@/hooks';
import { colors } from '@/styles';

import { merchantDetailStyles as styles } from './styles';

export function MerchantEmpty() {
  const { t } = useTranslation();

  return (
    <View style={styles.emptyContainer}>
      <FontAwesome name="line-chart" size={48} color={colors.text.muted} />
      <Text style={styles.emptyText}>{t('merchants.noHistory')}</Text>
    </View>
  );
}
