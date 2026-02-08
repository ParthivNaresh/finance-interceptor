import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  GlassCard,
  MerchantItem,
  SpendingTrendCard,
  SubcategoryTrendCard,
} from '@/components';
import type { ChartDataPoint, SubcategoryDataPoint, TimeRange } from '@/components';
import { useCategoryDetail, useCategorySpendingHistory, useTranslation } from '@/hooks';
import type { MerchantTimeRange } from '@/services/api';
import { colors, spacing, typography } from '@/styles';
import type { MerchantSpendingSummary, SubcategorySpendingSummary } from '@/types';
import { formatCurrency } from '@/utils/recurring';

type IconName = React.ComponentProps<typeof FontAwesome>['name'];

const categoryIcons: Record<string, IconName> = {
  FOOD_AND_DRINK: 'cutlery',
  TRAVEL: 'plane',
  TRANSPORTATION: 'car',
  SHOPPING: 'shopping-bag',
  ENTERTAINMENT: 'film',
  PERSONAL_CARE: 'heart',
  GENERAL_SERVICES: 'wrench',
  HOME_IMPROVEMENT: 'home',
  MEDICAL: 'medkit',
  RENT_AND_UTILITIES: 'bolt',
  GENERAL_MERCHANDISE: 'cube',
  GOVERNMENT_AND_NON_PROFIT: 'institution',
  BANK_FEES: 'bank',
  LOAN_PAYMENTS: 'credit-card',
  INCOME: 'money',
  TRANSFER_IN: 'arrow-down',
  TRANSFER_OUT: 'arrow-up',
};

const categoryColors: Record<string, string> = {
  FOOD_AND_DRINK: '#F97316',
  TRAVEL: '#3B82F6',
  TRANSPORTATION: '#8B5CF6',
  SHOPPING: '#EC4899',
  ENTERTAINMENT: '#EF4444',
  PERSONAL_CARE: '#F472B6',
  GENERAL_SERVICES: '#6B7280',
  HOME_IMPROVEMENT: '#10B981',
  MEDICAL: '#EF4444',
  RENT_AND_UTILITIES: '#FBBF24',
  GENERAL_MERCHANDISE: '#6366F1',
  GOVERNMENT_AND_NON_PROFIT: '#14B8A6',
  BANK_FEES: '#64748B',
  LOAN_PAYMENTS: '#DC2626',
  INCOME: '#22C55E',
  TRANSFER_IN: '#22C55E',
  TRANSFER_OUT: '#EF4444',
};

function getCategoryIcon(category: string): IconName {
  return categoryIcons[category] ?? 'tag';
}

function getCategoryColor(category: string): string {
  return categoryColors[category] ?? colors.accent.primary;
}

function formatCategoryName(category: string): string {
  return category
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

function formatSubcategoryName(subcategory: string, parentCategory: string): string {
  if (!subcategory || subcategory === parentCategory) {
    return 'Other';
  }

  let cleanName = subcategory;

  if (subcategory.startsWith(`${parentCategory}_`)) {
    cleanName = subcategory.slice(parentCategory.length + 1);
  }

  if (!cleanName) {
    return 'Other';
  }

  return cleanName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

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

function transformSubcategories(
  subcategories: SubcategorySpendingSummary[],
  parentCategory: string
): SubcategoryDataPoint[] {
  return subcategories.map((sub) => ({
    name: formatSubcategoryName(sub.category_detailed, parentCategory),
    value: parseFloat(sub.total_amount),
    percentage: sub.percentage_of_category ? parseFloat(sub.percentage_of_category) : 0,
    transactionCount: sub.transaction_count,
  }));
}

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

  const subcategoryData = useMemo(
    () => transformSubcategories(subcategories, categoryName),
    [subcategories, categoryName]
  );

  const handleMerchantPress = useCallback(
    (merchant: MerchantSpendingSummary) => {
      router.push(`/merchants/${encodeURIComponent(merchant.merchant_name)}`);
    },
    [router]
  );

  const handleSubcategoryPress = useCallback((_item: SubcategoryDataPoint) => {
  }, []);

  const categoryIcon = useMemo(() => getCategoryIcon(categoryName), [categoryName]);
  const categoryColor = useMemo(() => getCategoryColor(categoryName), [categoryName]);
  const displayName = useMemo(() => formatCategoryName(categoryName), [categoryName]);

  const renderHeader = useCallback(() => {
    return (
      <View style={styles.headerContainer}>
        <GlassCard variant="subtle" padding="lg">
          <View style={styles.categoryHeader}>
            <View style={[styles.iconContainer, { backgroundColor: `${categoryColor}20` }]}>
              <FontAwesome name={categoryIcon} size={28} color={categoryColor} />
            </View>

            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{displayName}</Text>
              <Text style={styles.periodLabel}>{getTimeRangeLabel(timeRange)}</Text>
            </View>
          </View>

          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Spent</Text>
            <Text style={styles.totalAmount}>{formatCurrency(totalAmount)}</Text>
            <View style={styles.statsRow}>
              {percentageOfTotal !== null && (
                <Text style={styles.statText}>
                  {percentageOfTotal.toFixed(1)}% of total spending
                </Text>
              )}
              {data?.transaction_count !== undefined && (
                <Text style={styles.statText}>
                  {data.transaction_count} transaction{data.transaction_count !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
            {averageTransaction !== null && (
              <Text style={styles.averageText}>
                Avg: {formatCurrency(averageTransaction)} per transaction
              </Text>
            )}
          </View>
        </GlassCard>

        <SpendingTrendCard
          title="Spending Trend"
          data={trendChartData}
          isLoading={isHistoryLoading}
          error={historyError}
          barColor={categoryColor}
          onPeriodChange={handlePeriodChange}
          initialPeriod={historyMonths}
        />

        {subcategoryData.length > 0 && (
          <SubcategoryTrendCard
            title="Subcategories"
            data={subcategoryData}
            categoryColor={categoryColor}
            onItemPress={handleSubcategoryPress}
            maxItems={10}
          />
        )}

        {topMerchants.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Merchants</Text>
            <GlassCard variant="subtle" padding="none">
              {topMerchants.map((merchant, index) => (
                <View key={merchant.merchant_name}>
                  <MerchantItem
                    merchant={merchant}
                    rank={index + 1}
                    onPress={handleMerchantPress}
                  />
                  {index < topMerchants.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </GlassCard>
          </View>
        )}
      </View>
    );
  }, [
    categoryIcon,
    categoryColor,
    displayName,
    timeRange,
    totalAmount,
    percentageOfTotal,
    data?.transaction_count,
    averageTransaction,
    trendChartData,
    isHistoryLoading,
    historyError,
    handlePeriodChange,
    historyMonths,
    subcategoryData,
    handleSubcategoryPress,
    topMerchants,
    handleMerchantPress,
  ]);

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
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
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
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
        <FontAwesome name="exclamation-circle" size={48} color={colors.text.muted} />
        <Text style={styles.errorTitle}>Unable to Load</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryText}>{t('common.retry')}</Text>
        </Pressable>
      </View>
    );
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

const styles = StyleSheet.create({
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
  categoryHeader: {
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
  categoryInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  categoryName: {
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
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
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
