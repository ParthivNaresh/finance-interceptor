import { ActivityIndicator, Text, View } from 'react-native';

import { useTranslation } from '@/hooks';
import { colors } from '@/styles';

import { insightsStyles as styles } from './styles';

export function InsightsLoading() {
  const { t } = useTranslation();

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.accent.primary} />
      <Text style={styles.loadingText}>{t('insights.computing')}</Text>
    </View>
  );
}
