import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/styles';
import type { RecurringStream } from '@/types';
import {
  formatCurrency,
  formatRelativeDate,
  getFrequencyShortLabel,
  getStreamStatusColor,
  getStreamStatusLabel,
} from '@/utils';

interface RecurringStreamItemProps {
  stream: RecurringStream;
  onPress?: (stream: RecurringStream) => void;
  showNextDate?: boolean;
}

export function RecurringStreamItem({
  stream,
  onPress,
  showNextDate = true,
}: RecurringStreamItemProps) {
  const handlePress = () => {
    onPress?.(stream);
  };

  const displayName = stream.merchant_name || stream.description;
  const amount = formatCurrency(stream.last_amount, stream.iso_currency_code);
  const frequencyLabel = getFrequencyShortLabel(stream.frequency);
  const statusColor = getStreamStatusColor(stream.status);
  const statusLabel = getStreamStatusLabel(stream.status);

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={handlePress}
    >
      <View style={styles.iconContainer}>
        <FontAwesome
          name={stream.stream_type === 'inflow' ? 'arrow-down' : 'arrow-up'}
          size={16}
          color={stream.stream_type === 'inflow' ? colors.accent.success : colors.text.primary}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.amount}>
            {stream.stream_type === 'outflow' ? '-' : '+'}
            {amount}
            <Text style={styles.frequency}>{frequencyLabel}</Text>
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>

          {showNextDate && stream.predicted_next_date && (
            <Text style={styles.nextDate}>
              Next: {formatRelativeDate(stream.predicted_next_date)}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.secondary,
  },
  pressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    ...typography.titleSmall,
    flex: 1,
    marginRight: spacing.sm,
  },
  amount: {
    ...typography.titleSmall,
    fontWeight: '600',
  },
  frequency: {
    ...typography.caption,
    color: colors.text.muted,
    fontWeight: '400',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  statusText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  nextDate: {
    ...typography.caption,
    color: colors.text.muted,
  },
});
