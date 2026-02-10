import { StyleSheet } from 'react-native';

import { colors, spacing, typography } from '@/styles';

export const insightsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.titleLarge,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['2xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    gap: spacing.md,
  },
  loadingText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: spacing.xl,
  },
  errorText: {
    ...typography.bodyMedium,
    color: colors.accent.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.accent.primary,
    borderRadius: 8,
  },
  retryText: {
    ...typography.titleSmall,
    color: colors.background.primary,
  },
});

export const sectionStyles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.md,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: {
    ...typography.headlineSmall,
    color: colors.text.primary,
  },
  timeRangeContainer: {
    marginBottom: spacing.md,
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.secondary,
    marginHorizontal: spacing.md,
  },
});

export const summaryStyles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border.secondary,
  },
  label: {
    ...typography.labelMedium,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    ...typography.headlineMedium,
    fontWeight: '600',
  },
  incomeValue: {
    color: colors.accent.success,
  },
  expenseValue: {
    color: colors.accent.error,
  },
});
