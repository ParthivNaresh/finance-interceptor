import { StyleSheet } from 'react-native';

import { colors, spacing, typography } from '@/styles';

export const profileMenuStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    paddingHorizontal: spacing.md,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.secondary,
  },
  avatarContainer: {
    marginBottom: spacing.sm,
  },
  email: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  menuItems: {
    paddingVertical: spacing.xs,
  },
});

export const profileMenuItemStyles = StyleSheet.create({
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
