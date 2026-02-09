import { ActivityIndicator, View } from 'react-native';

import { colors } from '@/styles';

import { loadingSpinnerStyles as styles } from './styles';
import type { LoadingSpinnerProps } from './types';

export function LoadingSpinner({ size = 'large' }: LoadingSpinnerProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={colors.accent.primary} />
    </View>
  );
}
