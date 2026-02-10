import { Text, View } from 'react-native';

import { useTranslation } from '@/hooks';

import { merchantHistoryStyles as styles } from './styles';
import type { MerchantHistoryHeaderProps } from './types';

export function MerchantHistoryHeader({ historyCount }: MerchantHistoryHeaderProps) {
  const { t } = useTranslation();

  if (historyCount === 0) {
    return null;
  }

  return (
    <View style={styles.header}>
      <Text style={styles.title}>{t('merchants.monthlyHistory')}</Text>
      <Text style={styles.subtitle}>{t('merchants.lastMonths', { count: historyCount })}</Text>
    </View>
  );
}
