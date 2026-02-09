import { Text, View } from 'react-native';

import { detailRowStyles as styles } from './styles';
import type { DetailRowProps } from './types';

export function DetailRow({ label, value }: DetailRowProps) {
  if (!value) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}
