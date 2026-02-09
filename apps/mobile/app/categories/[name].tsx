import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CategoryError,
  CategoryHeader,
  CategoryLoading,
  CategoryMerchants,
  SpendingTrendCard,
  SubcategoryTrendCard,
  useSubcategoryTransform,
} from '@/components';
import type { ChartDataPoint, TimeRange } from '@/components';
import { categoryDetailStyles as styles } from '@/components/categories/styles';
import { useCategoryDetail, useCategorySpendingHistory, useTranslation } from '@/hooks';
import type { MerchantTimeRange } from '@/services/api';
import { colors, spacing } from '@/styles';
import type { MerchantSpendingSummary } from '@/types';
import { formatCategoryName, getCategoryColor } from '@/utils';

export default function CategoryDetailScreen() {
  const { name, timeRange: timeRangeParam } = useLocalSearchParams<{
    name: string;
    timeRange?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const categoryName = decodeURIComponent(name ?? '');
  const timeRange: TimeRange = (timeRangeParam as TimeRange) || 'month';
  const displayName = formatCategoryName(categoryName);
  const categoryColor = getCategoryColor(categoryName);

  const [historyMonths, setHistoryMonths] = useState<6 | 12>(6);

  const {
    data,
    totalAmount,
    averageTransaction,
    percentageOfTotal,
    subcategories,
    topMerchants,
    isLoading,
    isRefreshing,
    error,
    refresh,
  } = useCategoryDetail(categoryName, timeRange as MerchantTimeRange);

  const {
    chartData: historyChartData,
    isLoading: isHistoryLoading,
    error: historyError,
    refresh: refreshHistory,
  } = useCategorySpendingHistory(categoryName, 'monthly', historyMonths);

  const subcategoryData = useSubcategoryTransform(subcategories, categoryName);

  const handleRefresh = useCallback(() => {
    void refresh();
    void refreshHistory();
  }, [refresh, refreshHistory]);

  const handlePeriodChange = useCallback((months: 6 | 12) => {
    setHistoryMonths(months);
  }, []);

  const trendChartData: ChartDataPoint[] = useMemo(
    () =>
      historyChartData.map((item) => ({
        label: item.label,
        value: item.value,
        date: item.periodStart,
      })),
    [historyChartData]
  );

  const handleMerchantPress = useCallback(
    (merchant: MerchantSpendingSummary) => {
      router.push(`/merchants/${encodeURIComponent(merchant.merchant_name)}`);
    },
    [router]
  );

  const handleSubcategoryPress = useCallback(() => {
  }, []);

  const renderHeader = useCallback(() => {
    return (
      <View style={styles.headerContainer}>
        <CategoryHeader
          categoryName={categoryName}
          timeRange={timeRange}
          totalAmount={totalAmount}
          transactionCount={data?.transaction_count ?? 0}
          percentageOfTotal={percentageOfTotal}
          averageTransaction={averageTransaction}
        />

        <SpendingTrendCard
          title={t('categories.spendingTrend')}
          data={trendChartData}
          isLoading={isHistoryLoading}
          error={historyError}
          barColor={categoryColor}
          onPeriodChange={handlePeriodChange}
          initialPeriod={historyMonths}
        />

        {subcategoryData.length > 0 && (
          <SubcategoryTrendCard
            title={t('categories.subcategories')}
            data={subcategoryData}
            categoryColor={categoryColor}
            onItemPress={handleSubcategoryPress}
            maxItems={10}
          />
        )}

        <CategoryMerchants merchants={topMerchants} onMerchantPress={handleMerchantPress} />
      </View>
    );
  }, [
    t,
    categoryName,
    timeRange,
    totalAmount,
    data?.transaction_count,
    percentageOfTotal,
    averageTransaction,
    trendChartData,
    isHistoryLoading,
    historyError,
    categoryColor,
    handlePeriodChange,
    historyMonths,
    subcategoryData,
    handleSubcategoryPress,
    topMerchants,
    handleMerchantPress,
  ]);

  if (isLoading && !isRefreshing) {
    return <CategoryLoading displayName={displayName} />;
  }

  if (error) {
    return <CategoryError displayName={displayName} error={error} onRetry={handleRefresh} />;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: displayName,
          headerStyle: { backgroundColor: colors.background.primary },
          headerTintColor: colors.text.primary,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <FontAwesome name="chevron-left" size={18} color={colors.text.primary} />
            </Pressable>
          ),
        }}
      />

      <FlatList
        data={[]}
        keyExtractor={() => 'header'}
        renderItem={null}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
          />
        }
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing.md }]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
