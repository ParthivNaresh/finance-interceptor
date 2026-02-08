import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/styles';
import type { AlertWithStream } from '@/types';
import { formatRelativeDate, getAlertSeverityColor, getAlertTypeIcon } from '@/utils';

interface AlertItemProps {
  alert: AlertWithStream;
  onPress?: (alert: AlertWithStream) => void;
  onDismiss?: (alertId: string) => void;
}

export function AlertItem({ alert, onPress, onDismiss }: AlertItemProps) {
  const handlePress = () => {
    onPress?.(alert);
  };

  const handleDismiss = () => {
    onDismiss?.(alert.id);
  };

  const iconName = getAlertTypeIcon(alert.alert_type);
  const severityColor = getAlertSeverityColor(alert.severity);
  const isUnread = alert.status === 'unread';

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

        <Text style={styles.timestamp}>{formatRelativeDate(alert.created_at)}</Text>
      </View>

      {alert.status !== 'dismissed' && alert.status !== 'actioned' && (
        <Pressable style={styles.dismissButton} onPress={handleDismiss} hitSlop={8}>
          <FontAwesome name="times" size={14} color={colors.text.muted} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.secondary,
  },
  unread: {
    backgroundColor: 'rgba(45, 212, 191, 0.05)',
  },
  pressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
    marginRight: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    ...typography.titleSmall,
    flex: 1,
    marginRight: spacing.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent.primary,
  },
  message: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: 4,
  },
  timestamp: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: 6,
  },
  dismissButton: {
    padding: spacing.xs,
  },
});
