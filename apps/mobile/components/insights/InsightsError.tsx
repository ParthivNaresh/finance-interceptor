import { Pressable, Text, View } from 'react-native';

import { useTranslation } from '@/hooks';

import { insightsStyles as styles } from './styles';

interface InsightsErrorProps {
  error: string;
  onRetry: () => void;
}

export function InsightsError({ error, onRetry }: InsightsErrorProps) {
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
