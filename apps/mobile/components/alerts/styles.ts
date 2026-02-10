import { StyleSheet } from 'react-native';

import { colors, spacing, typography } from '@/styles';

export const alertItemStyles = StyleSheet.create({
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

export const alertBadgeStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.accent.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  small: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  medium: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
  },
  text: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  textSmall: {
    fontSize: 10,
  },
  textMedium: {
    ...typography.caption,
  },
});
