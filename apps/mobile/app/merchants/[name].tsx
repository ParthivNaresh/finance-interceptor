import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

import { GlassCard } from '@/components';
import {
  useMerchantHistory,
  useMerchantStatsComputation,
  useMerchantStatsDetail,
  useTranslation,
} from '@/hooks';
import { colors, spacing, typography } from '@/styles';
import type { MerchantSpendingHistoryItem } from '@/types';
import { formatCurrency } from '@/utils/recurring';

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  color?: string;
}

function StatCard({ label, value, icon, color = colors.accent.primary }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
        <FontAwesome name={icon as 'money'} size={16} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

function getColorFromName(name: string): string {
  const colorPalette = [
    '#F97316',
    '#3B82F6',
    '#8B5CF6',
    '#EC4899',
    '#10B981',
    '#FBBF24',
    '#6366F1',
    '#14B8A6',
    '#EF4444',
    '#22C55E',
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colorPalette[Math.abs(hash) % colorPalette.length];
}

function formatCategory(category: string): string {
  return category
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default function MerchantDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const merchantName = decodeURIComponent(name ?? '');
  const hasAttemptedComputation = useRef(false);
  const [isComputingStats, setIsComputingStats] = useState(false);

  const {
    merchant,
    lifetimeSpend,
    averageTransaction,
    medianTransaction,
    daysBetweenTransactions,
    dayOfWeekLabel,
    hourLabel,
    isLoading: isStatsLoading,
    isRefreshing: isStatsRefreshing,
    error: statsError,
    refresh: refreshStats,
  } = useMerchantStatsDetail(merchantName);

  const {
    history,
    isLoading: isHistoryLoading,
    refresh: refreshHistory,
  } = useMerchantHistory(merchantName, 'monthly', 12);

  const { compute: computeStats } = useMerchantStatsComputation();

  useEffect(() => {
    const shouldCompute =
      !isStatsLoading &&
      !merchant &&
      !hasAttemptedComputation.current &&
      !isComputingStats;

    if (shouldCompute) {
      hasAttemptedComputation.current = true;
      setIsComputingStats(true);

      void computeStats(false)
        .then(() => {
          void refreshStats();
        })
        .finally(() => {
          setIsComputingStats(false);
        });
    }
  }, [isStatsLoading, merchant, computeStats, refreshStats, isComputingStats]);

  const isLoading = isStatsLoading || isHistoryLoading || isComputingStats;
  const isRefreshing = isStatsRefreshing;

  const handleRefresh = useCallback(() => {
    void Promise.all([refreshStats(), refreshHistory()]);
  }, [refreshStats, refreshHistory]);

  const initials = useMemo(() => getInitials(merchantName), [merchantName]);
  const avatarColor = useMemo(() => getColorFromName(merchantName), [merchantName]);

  const dateRange = useMemo(() => {
    if (!merchant) return '';
    const first = new Date(merchant.first_transaction_date);
    const last = new Date(merchant.last_transaction_date);
    const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
    return `${first.toLocaleDateString('en-US', formatOptions)} - ${last.toLocaleDateString('en-US', formatOptions)}`;
  }, [merchant]);

  const renderHistoryItem = useCallback(
    ({ item }: { item: MerchantSpendingHistoryItem }) => {
      const amount = parseFloat(item.total_amount);
      const periodDate = new Date(item.period_start);
      const monthLabel = periodDate.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });

      return (
        <View style={styles.historyItem}>
          <View style={styles.historyLeft}>
            <Text style={styles.historyMonth}>{monthLabel}</Text>
            <Text style={styles.historyCount}>
              {item.transaction_count} transaction{item.transaction_count !== 1 ? 's' : ''}
            </Text>
          </View>
          <Text style={styles.historyAmount}>{formatCurrency(amount)}</Text>
        </View>
      );
    },
    []
  );

  const renderHeader = useCallback(() => {
    if (!merchant) return null;

    return (
      <View style={styles.headerContainer}>
        <GlassCard variant="subtle" padding="lg">
          <View style={styles.merchantHeader}>
            <View style={[styles.avatar, { backgroundColor: `${avatarColor}20` }]}>
              <Text style={[styles.initials, { color: avatarColor }]}>{initials}</Text>
            </View>

            <View style={styles.merchantInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.merchantName}>{merchantName}</Text>
                {merchant.is_recurring && (
                  <View style={styles.recurringBadge}>
                    <FontAwesome name="refresh" size={10} color={colors.accent.primary} />
                    <Text style={styles.recurringText}>Subscription</Text>
                  </View>
                )}
              </View>
              <Text style={styles.dateRange}>{dateRange}</Text>
              {merchant.primary_category && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>
                    {formatCategory(merchant.primary_category)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.lifetimeContainer}>
            <Text style={styles.lifetimeLabel}>Lifetime Spend</Text>
            <Text style={styles.lifetimeAmount}>{formatCurrency(lifetimeSpend)}</Text>
            <Text style={styles.transactionCount}>
              {merchant.total_transaction_count} total transactions
            </Text>
          </View>
        </GlassCard>

        <View style={styles.statsGrid}>
          <StatCard
            label="Average"
            value={averageTransaction ? formatCurrency(averageTransaction) : '-'}
            icon="calculator"
            color="#3B82F6"
          />
          <StatCard
            label="Median"
            value={medianTransaction ? formatCurrency(medianTransaction) : '-'}
            icon="bar-chart"
            color="#8B5CF6"
          />
          <StatCard
            label="Frequency"
            value={daysBetweenTransactions ? `${Math.round(daysBetweenTransactions)}d` : '-'}
            icon="calendar"
            color="#F97316"
          />
          <StatCard
            label="Max"
            value={
              merchant.max_transaction_amount
                ? formatCurrency(parseFloat(merchant.max_transaction_amount))
                : '-'
            }
            icon="arrow-up"
            color="#EF4444"
          />
        </View>

        {(dayOfWeekLabel || hourLabel) && (
          <GlassCard variant="subtle" padding="md">
            <Text style={styles.patternsTitle}>Spending Patterns</Text>
            <View style={styles.patternsRow}>
              {dayOfWeekLabel && (
                <View style={styles.patternItem}>
                  <FontAwesome name="calendar-o" size={14} color={colors.text.muted} />
                  <Text style={styles.patternText}>Usually on {dayOfWeekLabel}s</Text>
                </View>
              )}
              {hourLabel && (
                <View style={styles.patternItem}>
                  <FontAwesome name="clock-o" size={14} color={colors.text.muted} />
                  <Text style={styles.patternText}>Around {hourLabel}</Text>
                </View>
              )}
            </View>
          </GlassCard>
        )}

        {history.length > 0 && (
          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>Monthly History</Text>
            <Text style={styles.sectionSubtitle}>Last {history.length} months</Text>
          </View>
        )}
      </View>
    );
  }, [
    merchant,
    merchantName,
    avatarColor,
    initials,
    dateRange,
    lifetimeSpend,
    averageTransaction,
    medianTransaction,
    daysBetweenTransactions,
    dayOfWeekLabel,
    hourLabel,
    history.length,
  ]);

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <FontAwesome name="line-chart" size={48} color={colors.text.muted} />
        <Text style={styles.emptyText}>No spending history available</Text>
      </View>
    ),
    []
  );

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen
          options={{
            title: merchantName,
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
        {isComputingStats && (
          <Text style={styles.computingText}>Computing merchant statistics...</Text>
        )}
      </View>
    );
  }

  if ((statsError || !merchant) && !isComputingStats) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen
          options={{
            title: merchantName,
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
        <Text style={styles.errorTitle}>No Data Available</Text>
        <Text style={styles.errorText}>
          {statsError || 'Unable to load merchant statistics. Please try again.'}
        </Text>
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
          title: merchantName,
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
        data={[...history].reverse()}
        keyExtractor={(_, index) => `history-${index}`}
        renderItem={renderHistoryItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
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
  merchantHeader: {
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
  merchantInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  merchantName: {
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.titleMedium,
    fontWeight: '600',
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.muted,
  },
  patternsTitle: {
    ...typography.titleSmall,
    marginBottom: spacing.sm,
  },
  patternsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  patternItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  patternText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.titleSmall,
    color: colors.text.primary,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.text.muted,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.secondary,
  },
  historyLeft: {
    gap: 2,
  },
  historyMonth: {
    ...typography.bodyMedium,
    fontWeight: '500',
  },
  historyCount: {
    ...typography.caption,
    color: colors.text.muted,
  },
  historyAmount: {
    ...typography.titleSmall,
    fontWeight: '600',
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
