import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import {
  CategorySection,
  EmptyState,
  InsightsError,
  InsightsHeader,
  InsightsLoading,
  InsightsSummary,
  MerchantSection,
  SpendingCard,
  SpendingStabilityCard,
  useMerchantDisplayItems,
  usePeriodLabel,
} from '@/components';
import type { MerchantDisplayItem, TimeRange } from '@/components';
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
import { colors } from '@/styles';
import type { CategorySpendingSummary, MerchantSpendingSummary } from '@/types';

import { insightsStyles as styles } from '../../components/insights/styles';

export default function InsightsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

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
  const hasData = totalSpending > 0 || totalIncome > 0;

  const periodLabel = usePeriodLabel(summaryData?.period_start);

  const displayMerchants = useMerchantDisplayItems(
    isAllTime,
    allTimeMerchants,
    rangeMerchants,
    rangeTotalSpending,
    5
  );

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
    (_merchant: MerchantSpendingSummary | MerchantDisplayItem) => {
      const merchantName = 'merchant_name' in _merchant ? _merchant.merchant_name : '';
      router.push(`/merchants/${encodeURIComponent(merchantName)}`);
    },
    [router]
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

  if (isLoading && !isRefreshing) {
    return <InsightsLoading />;
  }

  if (summaryError) {
    return <InsightsError error={summaryError} onRetry={handleRefresh} />;
  }

  return (
    <View style={styles.container}>
      <InsightsHeader title={t('insights.title')} />

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
                  ? { targetAmount, currentSpend }
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

            <CategorySection
              categories={categories}
              timeRange={categoryTimeRange}
              onTimeRangeChange={setCategoryTimeRange}
              onCategoryPress={handleCategoryPress}
              isLoading={isCategoriesLoading}
            />

            <MerchantSection
              merchants={displayMerchants}
              timeRange={merchantTimeRange}
              onTimeRangeChange={setMerchantTimeRange}
              onMerchantPress={handleMerchantPress}
              isLoading={isMerchantsLoading}
            />

            <InsightsSummary totalIncome={totalIncome} netFlow={netFlow} />
          </>
        )}
      </ScrollView>
    </View>
  );
}
