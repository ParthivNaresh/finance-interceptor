import { StyleSheet } from 'react-native';

import { colors, spacing, typography } from '@/styles';

export const activityStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background.primary,
  },
  title: {
    ...typography.displaySmall,
  },
  separator: {
    marginVertical: spacing.lg,
    height: 1,
    width: '80%',
    backgroundColor: colors.border.primary,
  },
  placeholder: {
    ...typography.bodyLarge,
    textAlign: 'center',
    color: colors.text.secondary,
  },
});

export const connectStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background.primary,
  },
  title: {
    ...typography.displaySmall,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyLarge,
    textAlign: 'center',
    marginTop: spacing.sm,
    color: colors.text.secondary,
  },
  separator: {
    marginVertical: spacing.lg,
    height: 1,
    width: '80%',
    backgroundColor: colors.border.primary,
  },
  centerContent: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  statusText: {
    ...typography.bodyMedium,
    marginTop: spacing.sm,
    color: colors.text.secondary,
  },
  errorText: {
    ...typography.bodyMedium,
    color: colors.accent.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  linkButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginTop: spacing.xl,
  },
  retryButton: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  buttonText: {
    ...typography.button,
    color: colors.background.primary,
  },
});

export const emptyStateStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background.primary,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.headlineMedium,
    textAlign: 'center',
  },
  message: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});

export const loadingSpinnerStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
});

export const transactionItemStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  pressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  details: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    ...typography.titleMedium,
    flex: 1,
    marginRight: spacing.sm,
  },
  amount: {
    ...typography.titleMedium,
    fontWeight: '600',
  },
  income: {
    color: colors.accent.success,
  },
  expense: {
    color: colors.text.primary,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  date: {
    ...typography.bodySmall,
  },
  pendingBadge: {
    backgroundColor: colors.accent.warning,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendingText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.background.primary,
  },
  category: {
    ...typography.caption,
    textTransform: 'capitalize',
  },
});
