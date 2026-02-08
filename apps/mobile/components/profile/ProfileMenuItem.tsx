import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/styles';

type IconName = React.ComponentProps<typeof FontAwesome>['name'];

interface ProfileMenuItemProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  variant?: 'default' | 'danger';
  showDivider?: boolean;
  rightElement?: ReactNode;
}

export function ProfileMenuItem({
  icon,
  label,
  onPress,
  variant = 'default',
  showDivider = true,
  rightElement,
}: ProfileMenuItemProps) {
  const iconColor = variant === 'danger' ? colors.accent.error : colors.text.primary;
  const textColor = variant === 'danger' ? colors.accent.error : colors.text.primary;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        showDivider && styles.withDivider,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.iconContainer}>
        <FontAwesome name={icon} size={20} color={iconColor} />
      </View>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
      <FontAwesome name="chevron-right" size={14} color={colors.text.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  withDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.secondary,
  },
  pressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconContainer: {
    width: 32,
    marginRight: spacing.md,
    alignItems: 'center',
  },
  label: {
    ...typography.bodyLarge,
    flex: 1,
  },
  rightElement: {
    marginRight: spacing.sm,
  },
});
