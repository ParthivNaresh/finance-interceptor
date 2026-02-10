import { StyleSheet } from 'react-native';

import { colors, spacing, typography } from '@/styles';

export const categoryDetailStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  backButton: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    gap: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorTitle: {
    ...typography.titleMedium,
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  errorText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.accent.primary,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  retryText: {
    ...typography.titleSmall,
    color: colors.background.primary,
  },
  listContent: {
    flexGrow: 1,
  },
  headerContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
});

export const categoryHeaderStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    ...typography.titleLarge,
    fontWeight: '700',
  },
  periodLabel: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  totalContainer: {
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.secondary,
  },
  totalLabel: {
    ...typography.labelMedium,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalAmount: {
    ...typography.displaySmall,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  statText: {
    ...typography.bodySmall,
    color: colors.text.muted,
  },
  averageText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
});

export const categoryMerchantsStyles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  title: {
    ...typography.titleSmall,
    color: colors.text.primary,
    paddingHorizontal: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.secondary,
    marginHorizontal: spacing.md,
  },
});
