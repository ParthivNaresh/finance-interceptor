import { StyleSheet } from 'react-native';

import { colors, spacing, typography } from '@/styles';

export const categoryItemStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    ...typography.titleSmall,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  amount: {
    ...typography.titleSmall,
    color: colors.text.primary,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressContainer: {
    flex: 1,
    height: 4,
    backgroundColor: colors.background.tertiary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  percentage: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    width: 45,
    textAlign: 'right',
  },
  transactionCount: {
    ...typography.caption,
    color: colors.text.muted,
  },
  chevron: {
    marginLeft: spacing.xs,
  },
});

export const merchantItemStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  rank: {
    ...typography.labelMedium,
    color: colors.text.muted,
    width: 24,
    textAlign: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    ...typography.titleSmall,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    ...typography.titleSmall,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  amount: {
    ...typography.titleSmall,
    color: colors.text.primary,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionCount: {
    ...typography.caption,
    color: colors.text.muted,
  },
  percentage: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  chevron: {
    marginLeft: spacing.xs,
  },
});

export const spendingCardStyles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.labelMedium,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  periodLabel: {
    ...typography.bodySmall,
    color: colors.text.muted,
  },
  amountContainer: {
    marginBottom: spacing.md,
  },
  amount: {
    ...typography.displayMedium,
    color: colors.text.primary,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionCount: {
    ...typography.bodySmall,
    color: colors.text.muted,
  },
});

export const trendSummaryStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
  },
  averageSection: {
    flex: 1,
    gap: 2,
  },
  changeSection: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border.secondary,
    marginHorizontal: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 10,
  },
  averageValue: {
    ...typography.titleSmall,
    fontWeight: '600',
    color: colors.text.primary,
  },
  periodLabel: {
    ...typography.caption,
    color: colors.text.muted,
    fontWeight: '400',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconContainer: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeValue: {
    ...typography.titleSmall,
    fontWeight: '600',
  },
});

export const sectionHeaderStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: {
    ...typography.headlineSmall,
    color: colors.text.primary,
  },
  action: {
    ...typography.labelMedium,
    color: colors.accent.primary,
  },
});

export const changeIndicatorStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  icon: {
    marginRight: 2,
  },
  value: {
    ...typography.labelMedium,
    fontWeight: '600',
  },
  label: {
    ...typography.bodySmall,
    color: colors.text.muted,
  },
});

export const spendingBarChartStyles = StyleSheet.create({
  container: {
    width: '100%',
  },
  chartWrapper: {
    position: 'relative',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.text.muted,
  },
  xAxisLabel: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: 4,
  },
  topLabelContainer: {
    marginBottom: 4,
  },
  barTopLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 10,
  },
  averageLineContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  averageLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.text.muted,
    opacity: 0.4,
  },
  averageLabel: {
    ...typography.caption,
    color: colors.text.muted,
    marginLeft: spacing.xs,
    fontSize: 10,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: colors.background.tertiary,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.border.secondary,
  },
  tooltipValue: {
    ...typography.titleSmall,
    fontWeight: '600',
    color: colors.text.primary,
  },
  tooltipDate: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: 2,
  },
});

export const subcategoryChartStyles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  emptyContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.text.muted,
  },
  itemContainer: {
    paddingVertical: spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  itemName: {
    ...typography.bodyMedium,
    fontWeight: '500',
    color: colors.text.primary,
    flex: 1,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemValue: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.text.primary,
  },
  itemPercentage: {
    ...typography.caption,
    color: colors.text.muted,
    minWidth: 45,
    textAlign: 'right',
  },
  barContainer: {
    marginBottom: spacing.xs,
  },
  barBackground: {
    height: 8,
    backgroundColor: colors.background.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  transactionCount: {
    ...typography.caption,
    color: colors.text.muted,
    fontSize: 11,
  },
});

export const merchantStatsCardStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rank: {
    ...typography.labelMedium,
    color: colors.text.muted,
    width: 24,
    textAlign: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    ...typography.titleSmall,
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    ...typography.titleSmall,
    color: colors.text.primary,
    flex: 1,
  },
  recurringBadge: {
    backgroundColor: `${colors.accent.primary}20`,
    borderRadius: 6,
    padding: 4,
  },
  dateRange: {
    ...typography.caption,
    color: colors.text.muted,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    ...typography.titleMedium,
    color: colors.text.primary,
    fontWeight: '700',
  },
  lifetimeLabel: {
    ...typography.caption,
    color: colors.text.muted,
  },
  chevron: {
    marginLeft: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
  },
  stat: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  statValue: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.muted,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});

export const spendingTrendCardStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.titleSmall,
    color: colors.text.primary,
  },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background.tertiary,
    borderRadius: 8,
    padding: 2,
  },
  periodButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  periodButtonSelected: {
    backgroundColor: colors.background.primary,
  },
  periodButtonText: {
    ...typography.caption,
    color: colors.text.muted,
    fontWeight: '500',
  },
  periodButtonTextSelected: {
    color: colors.text.primary,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  errorText: {
    ...typography.bodyMedium,
    color: colors.accent.error,
    textAlign: 'center',
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.text.muted,
  },
  summaryContainer: {
    marginTop: spacing.md,
  },
});

export const timeRangeSelectorStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 4,
  },
  option: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: 10,
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: colors.accent.primary,
  },
  optionText: {
    ...typography.labelSmall,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: colors.background.primary,
    fontWeight: '600',
  },
  compactContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  compactChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.background.secondary,
  },
  compactChipSelected: {
    backgroundColor: colors.accent.primary,
  },
  compactChipText: {
    ...typography.labelSmall,
    color: colors.text.secondary,
  },
  compactChipTextSelected: {
    color: colors.background.primary,
    fontWeight: '600',
  },
});

export const monthlyBalanceCardStyles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.labelMedium,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  periodLabel: {
    ...typography.bodySmall,
    color: colors.text.muted,
  },
  loadingContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border.secondary,
  },
  metricLabel: {
    ...typography.labelSmall,
    color: colors.text.muted,
    marginBottom: spacing.xs,
  },
  metricValue: {
    ...typography.titleMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  incomeValue: {
    color: colors.accent.success,
  },
  progressContainer: {
    marginBottom: spacing.md,
  },
  progressBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.background.tertiary,
    overflow: 'hidden',
  },
  progressExpenses: {
    backgroundColor: colors.accent.error,
    opacity: 0.7,
  },
  progressSavings: {
    backgroundColor: colors.accent.success,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
  runwayText: {
    ...typography.bodySmall,
    color: colors.text.muted,
  },
  pressed: {
    opacity: 0.8,
  },
});

export const subcategoryTrendCardStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.titleSmall,
    color: colors.text.primary,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background.tertiary,
    borderRadius: 8,
    padding: 2,
  },
  viewButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  viewButtonSelected: {
    backgroundColor: colors.background.primary,
  },
  viewButtonText: {
    ...typography.caption,
    color: colors.text.muted,
    fontWeight: '500',
  },
  viewButtonTextSelected: {
    color: colors.text.primary,
  },
  loadingContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  errorText: {
    ...typography.bodyMedium,
    color: colors.accent.error,
    textAlign: 'center',
  },
  emptyContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.text.muted,
  },
});

export const spendingStabilityCardStyles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.labelMedium,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  periodLabel: {
    ...typography.bodySmall,
    color: colors.text.muted,
  },
  loadingContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  noDataContainer: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  noDataText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  buildingContainer: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buildingTitle: {
    ...typography.titleSmall,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  buildingSubtext: {
    ...typography.bodySmall,
    color: colors.text.muted,
    textAlign: 'center',
  },
  kickoffContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  kickoffEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  kickoffTitle: {
    ...typography.headlineSmall,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  kickoffSubtitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  kickoffHighlight: {
    color: colors.accent.primary,
    fontWeight: '600',
  },
  kickoffSpendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.tertiary,
    borderRadius: 8,
  },
  kickoffSpendLabel: {
    ...typography.bodySmall,
    color: colors.text.muted,
  },
  kickoffSpendValue: {
    ...typography.titleSmall,
    color: colors.text.primary,
    fontWeight: '600',
  },
  kickoffNote: {
    ...typography.bodySmall,
    color: colors.text.muted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  pacingContainer: {
    paddingVertical: spacing.xs,
  },
  progressSection: {
    marginBottom: spacing.md,
  },
  progressBarContainer: {
    marginBottom: spacing.xs,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: colors.background.tertiary,
    borderRadius: 6,
    overflow: 'visible',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  todayMarker: {
    position: 'absolute',
    top: -4,
    width: 2,
    height: 20,
    backgroundColor: colors.text.primary,
    marginLeft: -1,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  progressLabelLeft: {
    ...typography.labelSmall,
    color: colors.text.muted,
  },
  progressLabelCenter: {
    ...typography.labelSmall,
    color: colors.text.secondary,
  },
  progressLabelRight: {
    ...typography.labelSmall,
    color: colors.text.muted,
  },
  statusBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  statusEmoji: {
    ...typography.titleMedium,
    fontWeight: '700',
  },
  statusLabelLarge: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
  pacingStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  pacingStat: {
    flex: 1,
    alignItems: 'center',
  },
  pacingStatLabel: {
    ...typography.labelSmall,
    color: colors.text.muted,
    marginBottom: 2,
  },
  pacingStatValue: {
    ...typography.titleMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  pacingStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border.secondary,
  },
  miniProgressSection: {
    marginBottom: spacing.md,
  },
  miniProgressBar: {
    height: 6,
    backgroundColor: colors.background.tertiary,
    borderRadius: 3,
    overflow: 'visible',
    position: 'relative',
    marginBottom: spacing.xs,
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  miniTodayMarker: {
    position: 'absolute',
    top: -2,
    width: 2,
    height: 10,
    backgroundColor: colors.text.primary,
    marginLeft: -1,
  },
  pacingInsight: {
    ...typography.labelSmall,
    textAlign: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  scoreCircle: {
    alignItems: 'center',
  },
  scoreValue: {
    ...typography.displaySmall,
    fontWeight: '700',
  },
  scoreLabel: {
    ...typography.labelSmall,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...typography.labelMedium,
    fontWeight: '600',
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.tertiary,
    borderRadius: 8,
  },
  comparisonLabel: {
    ...typography.bodySmall,
    color: colors.text.muted,
  },
  comparisonValue: {
    ...typography.titleSmall,
    fontWeight: '600',
  },
  driftingContainer: {
    marginBottom: spacing.md,
  },
  driftingLabel: {
    ...typography.labelSmall,
    color: colors.text.muted,
    marginBottom: spacing.xs,
  },
  driftingCategory: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background.tertiary,
    borderRadius: 8,
  },
  driftingCategoryName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  driftingCategoryChange: {
    ...typography.titleSmall,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.secondary,
  },
  footerText: {
    ...typography.bodySmall,
    color: colors.text.muted,
  },
  pressed: {
    opacity: 0.8,
  },
});
