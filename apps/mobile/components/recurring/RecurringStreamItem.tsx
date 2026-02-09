import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, Text, View } from 'react-native';

import { useTranslation } from '@/hooks';

import { useRecurringStreamDisplay } from './hooks';
import { recurringStreamItemStyles as styles } from './styles';
import type { RecurringStreamItemProps } from './types';

export function RecurringStreamItem({
  stream,
  onPress,
  showNextDate = true,
}: RecurringStreamItemProps) {
  const { t } = useTranslation();
  const {
    displayName,
    formattedAmount,
    amountPrefix,
    frequencyLabel,
    statusColor,
    statusLabel,
    iconName,
    iconColor,
    formattedNextDate,
  } = useRecurringStreamDisplay(stream);

  const handlePress = () => {
    onPress?.(stream);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={handlePress}
    >
      <View style={styles.iconContainer}>
        <FontAwesome name={iconName} size={16} color={iconColor} />
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.amount}>
            {amountPrefix}
            {formattedAmount}
            <Text style={styles.frequency}>{frequencyLabel}</Text>
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>

          {showNextDate && formattedNextDate && (
            <Text style={styles.nextDate}>{t('recurring.next')}: {formattedNextDate}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}
