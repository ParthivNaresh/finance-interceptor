import { Text, View } from 'react-native';

import { useRecurringDetailDisplay } from './hooks';
import { recurringDetailHeaderStyles as styles } from './styles';
import type { RecurringDetailHeaderProps } from './types';

export function RecurringDetailHeader({ data }: RecurringDetailHeaderProps) {
  const { stream } = data;
  const { displayName, statusColor, statusLabel, frequencyLabel } = useRecurringDetailDisplay(stream);

  return (
    <>
      <Text style={styles.name}>{displayName}</Text>

      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        <Text style={styles.frequencyText}>{frequencyLabel}</Text>
      </View>
    </>
  );
}
