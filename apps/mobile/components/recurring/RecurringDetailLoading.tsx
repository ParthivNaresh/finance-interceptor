import { ActivityIndicator, View } from 'react-native';

import { colors } from '@/styles';

import { recurringDetailStyles as styles } from './styles';

export function RecurringDetailLoading() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.accent.primary} />
    </View>
  );
}
