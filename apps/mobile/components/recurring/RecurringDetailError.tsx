import { Pressable, Text, View } from 'react-native';

import { useTranslation } from '@/hooks';

import { recurringDetailStyles as styles } from './styles';
import type { RecurringDetailErrorProps } from './types';

export function RecurringDetailError({ error, onRetry }: RecurringDetailErrorProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
      <Pressable style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryText}>{t('common.retry')}</Text>
      </Pressable>
    </View>
  );
}
