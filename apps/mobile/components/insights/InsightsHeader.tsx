import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing } from '@/styles';

import { insightsStyles as styles } from './styles';
import type { InsightsHeaderProps } from './types';

export function InsightsHeader({ title }: InsightsHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}
