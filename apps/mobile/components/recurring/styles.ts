import { StyleSheet } from 'react-native';

import { colors, spacing, typography } from '@/styles';

export const upcomingBillItemStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.secondary,
  },
  pressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    ...typography.titleSmall,
  },
  dueDate: {
    ...typography.caption,
    marginTop: 2,
  },
  amount: {
    ...typography.titleSmall,
    fontWeight: '600',
  },
});

export const recurringStreamItemStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.secondary,
  },
  pressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    ...typography.titleSmall,
    flex: 1,
    marginRight: spacing.sm,
  },
  amount: {
    ...typography.titleSmall,
    fontWeight: '600',
  },
  frequency: {
    ...typography.caption,
    color: colors.text.muted,
    fontWeight: '400',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  statusText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  nextDate: {
    ...typography.caption,
    color: colors.text.muted,
  },
});

export const recurringSummaryCardStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border.secondary,
    marginHorizontal: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  value: {
    ...typography.titleMedium,
    fontWeight: '600',
  },
  income: {
    color: colors.accent.success,
  },
  expense: {
    color: colors.text.primary,
  },
  netFlowContainer: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.secondary,
    alignItems: 'center',
  },
  netFlowLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  netFlowValue: {
    ...typography.titleLarge,
    fontWeight: '700',
  },
  positive: {
    color: colors.accent.success,
  },
  negative: {
    color: colors.accent.error,
  },
});

export const recurringDetailStyles = StyleSheet.create({
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
  listContent: {
    flexGrow: 1,
  },
  headerContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
});

export const recurringDetailHeaderStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  name: {
    ...typography.titleLarge,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginRight: spacing.md,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  frequencyText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
});

export const recurringDetailStatsStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border.secondary,
    marginHorizontal: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  value: {
    ...typography.titleMedium,
    fontWeight: '600',
  },
});

export const recurringDetailTotalsStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.secondary,
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  value: {
    ...typography.titleSmall,
    fontWeight: '600',
    color: colors.accent.primary,
  },
});

export const recurringDetailNextDateStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.secondary,
  },
  text: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
});

export const recurringTransactionItemStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.secondary,
  },
  left: {
    flex: 1,
    marginRight: spacing.md,
  },
  name: {
    ...typography.bodyMedium,
    fontWeight: '500',
  },
  date: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  amount: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
});

export const recurringHistoryHeaderStyles = StyleSheet.create({
  title: {
    ...typography.titleSmall,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
});
