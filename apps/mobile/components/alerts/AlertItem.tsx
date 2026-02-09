import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/styles';

import { useAlertDisplay } from './hooks';
import { alertItemStyles as styles } from './styles';
import type { AlertItemProps } from './types';

export function AlertItem({ alert, onPress, onDismiss }: AlertItemProps) {
  const { iconName, severityColor, isUnread, isDismissable, formattedTimestamp } = useAlertDisplay(alert);

  const handlePress = () => {
    onPress?.(alert);
  };

  const handleDismiss = () => {
    onDismiss?.(alert.id);
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        isUnread && styles.unread,
        pressed && styles.pressed,
      ]}
      onPress={handlePress}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${severityColor}20` }]}>
        <FontAwesome name={iconName} size={18} color={severityColor} />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {alert.title}
          </Text>
          {isUnread && <View style={styles.unreadDot} />}
        </View>

        <Text style={styles.message} numberOfLines={2}>
          {alert.message}
        </Text>

        <Text style={styles.timestamp}>{formattedTimestamp}</Text>
      </View>

      {isDismissable && (
        <Pressable style={styles.dismissButton} onPress={handleDismiss} hitSlop={8}>
          <FontAwesome name="times" size={14} color={colors.text.muted} />
        </Pressable>
      )}
    </Pressable>
  );
}
