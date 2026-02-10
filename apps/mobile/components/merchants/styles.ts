import { StyleSheet } from 'react-native';

import { colors, spacing, typography } from '@/styles';

export const merchantDetailStyles = StyleSheet.create({
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
  computingText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginTop: spacing.sm,
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
});

export const merchantHeaderStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  initials: {
    ...typography.headlineMedium,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  name: {
    ...typography.titleLarge,
    fontWeight: '700',
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.accent.primary}15`,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  recurringText: {
    ...typography.caption,
    color: colors.accent.primary,
    fontWeight: '600',
  },
  dateRange: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.background.tertiary,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: spacing.xs,
  },
  categoryText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  lifetimeContainer: {
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.secondary,
  },
  lifetimeLabel: {
    ...typography.labelMedium,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  lifetimeAmount: {
    ...typography.displaySmall,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  transactionCount: {
    ...typography.bodySmall,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
});

export const merchantStatsStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.titleMedium,
    fontWeight: '600',
  },
  label: {
    ...typography.caption,
    color: colors.text.muted,
  },
});

export const merchantPatternsStyles = StyleSheet.create({
  title: {
    ...typography.titleSmall,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  text: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
});

export const merchantHistoryStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: spacing.sm,
  },
  title: {
    ...typography.titleSmall,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.muted,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.secondary,
  },
  itemLeft: {
    gap: 2,
  },
  month: {
    ...typography.bodyMedium,
    fontWeight: '500',
  },
  count: {
    ...typography.caption,
    color: colors.text.muted,
  },
  amount: {
    ...typography.titleSmall,
    fontWeight: '600',
  },
});
