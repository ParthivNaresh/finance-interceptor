import { Text } from 'react-native';

import { useTranslation } from '@/hooks';

import { recurringHistoryHeaderStyles as styles } from './styles';

export function RecurringHistoryHeader() {
  const { t } = useTranslation();

  return <Text style={styles.title}>{t('recurringDetail.transactionHistory')}</Text>;
}
