import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  MerchantEmpty,
  MerchantError,
  MerchantHeader,
  MerchantHistoryHeader,
  MerchantHistoryItem,
  MerchantLoading,
  MerchantPatterns,
  MerchantStatsGrid,
  merchantDetailStyles as styles,
} from '@/components';
import {
  useMerchantHistory,
  useMerchantStatsComputation,
  useMerchantStatsDetail,
} from '@/hooks';
import { colors, spacing } from '@/styles';
import type { MerchantSpendingHistoryItem } from '@/types';

export default function MerchantDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

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

  const renderHistoryItem = useCallback(
    ({ item }: { item: MerchantSpendingHistoryItem }) => (
      <MerchantHistoryItem item={item} />
    ),
    []
  );

  const renderHeader = useCallback(() => {
    if (!merchant) return null;

    const maxTransaction = merchant.max_transaction_amount
      ? parseFloat(merchant.max_transaction_amount)
      : null;

    return (
      <View style={styles.headerContainer}>
        <MerchantHeader
          merchantName={merchantName}
          merchant={merchant}
          lifetimeSpend={lifetimeSpend}
        />

        <MerchantStatsGrid
          averageTransaction={averageTransaction}
          medianTransaction={medianTransaction}
          maxTransaction={maxTransaction}
          daysBetweenTransactions={daysBetweenTransactions}
        />

        <MerchantPatterns dayOfWeekLabel={dayOfWeekLabel} hourLabel={hourLabel} />

        <MerchantHistoryHeader historyCount={history.length} />
      </View>
    );
  }, [
    merchant,
    merchantName,
    lifetimeSpend,
    averageTransaction,
    medianTransaction,
    daysBetweenTransactions,
    dayOfWeekLabel,
    hourLabel,
    history.length,
  ]);

  const renderEmpty = useCallback(() => <MerchantEmpty />, []);

  if (isLoading && !isRefreshing) {
    return <MerchantLoading merchantName={merchantName} isComputing={isComputingStats} />;
  }

  if ((statsError || !merchant) && !isComputingStats) {
    return (
      <MerchantError
        merchantName={merchantName}
        error={statsError}
        onRetry={handleRefresh}
      />
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
