import { StyleSheet } from 'react-native';

import { colors, spacing, typography } from '@/styles';

export const accountRowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  withBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.secondary,
  },
  pressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  info: {
    flex: 1,
    marginRight: spacing.md,
  },
  name: {
    ...typography.titleSmall,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  subtype: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  separator: {
    ...typography.caption,
    color: colors.text.muted,
    marginHorizontal: spacing.xs,
  },
  mask: {
    ...typography.caption,
    color: colors.text.muted,
  },
  balance: {
    ...typography.titleSmall,
    fontWeight: '600',
  },
  negativeBalance: {
    color: colors.accent.error,
  },
});

export const accountSectionStyles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  typeLabel: {
    ...typography.titleMedium,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  total: {
    ...typography.titleMedium,
    fontWeight: '600',
  },
  negativeTotal: {
    color: colors.accent.error,
  },
});

export const accountTypeIconStyles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
});
