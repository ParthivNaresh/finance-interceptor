import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/styles';

import { useUpcomingBillDisplay } from './hooks';
import { upcomingBillItemStyles as styles } from './styles';
import type { UpcomingBillItemProps } from './types';

export function UpcomingBillItem({ bill, onPress }: UpcomingBillItemProps) {
  const { displayName, formattedAmount, dueDateLabel, dueDateColor } = useUpcomingBillDisplay(bill);

  const handlePress = () => {
    onPress?.(bill);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={handlePress}
    >
      <View style={styles.iconContainer}>
        <FontAwesome name="calendar" size={16} color={colors.accent.primary} />
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={[styles.dueDate, { color: dueDateColor }]}>{dueDateLabel}</Text>
      </View>

      <Text style={styles.amount}>{formattedAmount}</Text>
    </Pressable>
  );
}
