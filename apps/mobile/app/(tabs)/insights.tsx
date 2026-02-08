import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CategoryItem,
  EmptyState,
  GlassCard,
  MerchantItem,
  SpendingCard,
  SpendingStabilityCard,
  TimeRangeSelector,
} from '@/components';
import type { TimeRange } from '@/components';
import {
  useCategoryBreakdownByRange,
  useMerchantBreakdownByRange,
  usePacing,
  useSpendingSummary,
  useTargetStatus,
  useTopMerchantStats,
  useTranslation,
} from '@/hooks';
import type { MerchantTimeRange } from '@/services/api';
import { colors, spacing, typography } from '@/styles';
import type { CategorySpendingSummary, MerchantSpendingSummary, MerchantStats } from '@/types';

function getTimeRangeLabel(range: TimeRange): string {
  switch (range) {
    case 'week':
      return 'This Week';
    case 'month':
      return 'This Month';
    case 'year':
      return 'This Year';
    case 'all':
      return 'All Time';
    default:
      return 'This Month';
  }
}

interface MerchantDisplayItem {
  merchant_name: string;
  total_amount: number;
  transaction_count: number;
  percentage_of_total: number | null;
}

function merchantStatsToDisplayItem(
  stats: MerchantStats,
  totalSpending: number
): MerchantDisplayItem {
  const amount = parseFloat(stats.total_lifetime_spend);
  return {
    merchant_name: stats.merchant_name,
    total_amount: amount,
    transaction_count: stats.total_transaction_count,
    percentage_of_total: totalSpending > 0 ? (amount / totalSpending) * 100 : null,
  };
}

function merchantSummaryToDisplayItem(
  summary: MerchantSpendingSummary,
  _totalSpending: number
): MerchantDisplayItem {
  return {
    merchant_name: summary.merchant_name,
    total_amount: parseFloat(summary.total_amount),
    transaction_count: summary.transaction_count,
    percentage_of_total: summary.percentage_of_total ? parseFloat(summary.percentage_of_total) : null,
  };
}

export default function InsightsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [categoryTimeRange, setCategoryTimeRange] = useState<TimeRange>('month');
  const [merchantTimeRange, setMerchantTimeRange] = useState<TimeRange>('month');

  const isAllTime = merchantTimeRange === 'all';

  const {
    totalSpending,
    totalIncome,
    netFlow,
    monthOverMonthChange,
    isLoading: isSummaryLoading,
    isRefreshing: isSummaryRefreshing,
    error: summaryError,
    refresh: refreshSummary,
    data: summaryData,
  } = useSpendingSummary('monthly');

  const {
    categories,
    isLoading: isCategoriesLoading,
    refresh: refreshCategories,
  } = useCategoryBreakdownByRange(categoryTimeRange as MerchantTimeRange, 10);

  const {
    merchants: rangeMerchants,
    totalSpending: rangeTotalSpending,
    isLoading: isRangeMerchantsLoading,
    refresh: refreshRangeMerchants,
  } = useMerchantBreakdownByRange(merchantTimeRange as MerchantTimeRange, 5);

  const {
    merchants: allTimeMerchants,
    isLoading: isAllTimeMerchantsLoading,
    refresh: refreshAllTimeMerchants,
  } = useTopMerchantStats('spend', 5);

  const {
    targetStatus,
    isLoading: isTargetStatusLoading,
    refetch: refetchTargetStatus,
  } = useTargetStatus();

  const {
    pacing,
    isLoading: isPacingLoading,
    mode: pacingMode,
    pacingStatus,
    targetAmount,
    currentSpend,
    pacingPercentage,
    expectedPercentage,
    daysIntoMonth,
    totalDaysInMonth,
    stabilityScore,
    refetch: refetchPacing,
  } = usePacing();

  const isLoading = isSummaryLoading;
  const isMerchantsLoading = isAllTime ? isAllTimeMerchantsLoading : isRangeMerchantsLoading;
  const isRefreshing = isSummaryRefreshing;
  const isStabilityLoading = isTargetStatusLoading || isPacingLoading;

  const hasTarget = targetStatus?.status === 'established' && pacing !== null;

  const handleRefresh = useCallback(() => {
    void Promise.all([
      refreshSummary(),
      refreshCategories(),
      refreshRangeMerchants(),
      refreshAllTimeMerchants(),
      refetchTargetStatus(),
      refetchPacing(),
    ]);
  }, [refreshSummary, refreshCategories, refreshRangeMerchants, refreshAllTimeMerchants, refetchTargetStatus, refetchPacing]);

  const handleMerchantPress = useCallback(
    (merchantName: string) => {
      router.push(`/merchants/${encodeURIComponent(merchantName)}`);
    },
    [router]
  );

  const handleMerchantSummaryPress = useCallback(
    (merchant: MerchantSpendingSummary) => {
      handleMerchantPress(merchant.merchant_name);
    },
    [handleMerchantPress]
  );

  const handleCategoryPress = useCallback(
    (category: CategorySpendingSummary) => {
      router.push({
        pathname: '/categories/[name]',
        params: {
          name: encodeURIComponent(category.category_primary),
          timeRange: categoryTimeRange,
        },
      });
    },
    [router, categoryTimeRange]
  );

  const periodLabel = useMemo(() => {
    if (!summaryData?.period_start) return t('insights.thisMonth');
    const [year, month] = summaryData.period_start.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [summaryData?.period_start, t]);

  const displayCategories = useMemo(() => {
    return categories.slice(0, 5);
  }, [categories]);

  const displayMerchants = useMemo((): MerchantDisplayItem[] => {
    if (isAllTime) {
      const totalAllTimeSpending = allTimeMerchants.reduce(
        (sum, m) => sum + parseFloat(m.total_lifetime_spend),
        0
      );
      return allTimeMerchants
        .slice(0, 5)
        .map((m) => merchantStatsToDisplayItem(m, totalAllTimeSpending));
    }

    return rangeMerchants
      .slice(0, 5)
      .map((m) => merchantSummaryToDisplayItem(m, rangeTotalSpending));
  }, [isAllTime, allTimeMerchants, rangeMerchants, rangeTotalSpending]);

  const hasData = totalSpending > 0 || totalIncome > 0;

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
        <Text style={styles.loadingText}>{t('insights.computing')}</Text>
      </View>
    );
  }

  if (summaryError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{summaryError}</Text>
        <Pressable style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryText}>{t('common.retry')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>{t('insights.title')}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
          />
        }
      >
        {!hasData ? (
          <EmptyState
            icon="bar-chart"
            title={t('insights.noData')}
            message={t('insights.noDataSubtitle')}
          />
        ) : (
          <>
            <SpendingCard
              variant="spending"
              amount={totalSpending}
              changePercentage={monthOverMonthChange}
              transactionCount={summaryData?.transaction_count}
              periodLabel={periodLabel}
            />

            <SpendingStabilityCard
              mode={pacingMode}
              kickoffState={
                pacingMode === 'kickoff'
                  ? {
                      targetAmount,
                      currentSpend,
                    }
                  : undefined
              }
              pacingState={
                pacingMode === 'pacing'
                  ? {
                      targetAmount,
                      currentSpend,
                      pacingPercentage,
                      expectedPercentage,
                      pacingStatus,
                      daysIntoMonth,
                      totalDaysInMonth,
                    }
                  : undefined
              }
              stabilityState={
                pacingMode === 'stability' && pacing
                  ? {
                      stabilityScore: stabilityScore ?? 0,
                      overallSeverity: pacing.overall_severity ?? 'none',
                      targetAmount,
                      currentSpend,
                      pacingPercentage,
                      expectedPercentage,
                      pacingStatus,
                      topDriftingCategory: pacing.top_drifting_category,
                    }
                  : undefined
              }
              periodLabel={periodLabel}
              isLoading={isStabilityLoading}
              hasTarget={hasTarget}
            />

            <View style={styles.section}>
              <View style={styles.merchantsHeader}>
                <Text style={styles.sectionTitle}>{t('insights.topCategories')}</Text>
              </View>

              <View style={styles.timeRangeContainer}>
                <TimeRangeSelector
                  selected={categoryTimeRange}
                  onSelect={setCategoryTimeRange}
                  compact
                />
              </View>

              {isCategoriesLoading ? (
                <View style={styles.merchantsLoading}>
                  <ActivityIndicator size="small" color={colors.accent.primary} />
                </View>
              ) : displayCategories.length > 0 ? (
                <GlassCard variant="subtle" padding="none">
                  {displayCategories.map((category, index) => (
                    <View key={category.category_primary}>
                      <CategoryItem category={category} onPress={handleCategoryPress} />
                      {index < displayCategories.length - 1 && <View style={styles.divider} />}
                    </View>
                  ))}
                </GlassCard>
              ) : (
                <GlassCard variant="subtle" padding="md">
                  <Text style={styles.noMerchantsText}>
                    No category data for {getTimeRangeLabel(categoryTimeRange).toLowerCase()}
                  </Text>
                </GlassCard>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.merchantsHeader}>
                <Text style={styles.sectionTitle}>{t('insights.topMerchants')}</Text>
              </View>

              <View style={styles.timeRangeContainer}>
                <TimeRangeSelector
                  selected={merchantTimeRange}
                  onSelect={setMerchantTimeRange}
                  compact
                />
              </View>

              {isMerchantsLoading ? (
                <View style={styles.merchantsLoading}>
                  <ActivityIndicator size="small" color={colors.accent.primary} />
                </View>
              ) : displayMerchants.length > 0 ? (
                <GlassCard variant="subtle" padding="none">
                  {displayMerchants.map((merchant, index) => (
                    <View key={merchant.merchant_name}>
                      <MerchantItem
                        merchant={{
                          merchant_name: merchant.merchant_name,
                          merchant_id: null,
                          total_amount: merchant.total_amount.toString(),
                          transaction_count: merchant.transaction_count,
                          average_transaction: null,
                          percentage_of_total: merchant.percentage_of_total?.toString() ?? null,
                        }}
                        rank={index + 1}
                        onPress={handleMerchantSummaryPress}
                      />
                      {index < displayMerchants.length - 1 && <View style={styles.divider} />}
                    </View>
                  ))}
                </GlassCard>
              ) : (
                <GlassCard variant="subtle" padding="md">
                  <Text style={styles.noMerchantsText}>
                    No merchant data for {getTimeRangeLabel(merchantTimeRange).toLowerCase()}
                  </Text>
                </GlassCard>
              )}
            </View>

            <View style={styles.summarySection}>
              <GlassCard variant="subtle" padding="md">
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>{t('insights.earned')}</Text>
                    <Text style={[styles.summaryValue, styles.incomeValue]}>
                      +${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>{t('insights.netFlow')}</Text>
                    <Text
                      style={[
                        styles.summaryValue,
                        netFlow >= 0 ? styles.incomeValue : styles.expenseValue,
                      ]}
                    >
                      {netFlow >= 0 ? '+' : ''}$
                      {Math.abs(netFlow).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
  section: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.md,
  },
  sectionTitle: {
    ...typography.headlineSmall,
    color: colors.text.primary,
  },
  merchantsHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  timeRangeContainer: {
    marginBottom: spacing.md,
  },
  merchantsLoading: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  noMerchantsText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.secondary,
    marginHorizontal: spacing.md,
  },
  summarySection: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border.secondary,
  },
  summaryLabel: {
    ...typography.labelMedium,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
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
