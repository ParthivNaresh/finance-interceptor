import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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

import { recurringApi } from '@/services/api';
import { colors, spacing, typography } from '@/styles';
import type { RecurringStreamDetailResponse, StreamTransaction } from '@/types';
import { formatCurrency, getFrequencyLabel, getStreamStatusColor, getStreamStatusLabel } from '@/utils';

export default function RecurringDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [data, setData] = useState<RecurringStreamDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (isRefresh: boolean = false) => {
      if (!id) return;

      if (!isRefresh) {
        setIsLoading(true);
      }
      setIsRefreshing(isRefresh);
      setError(null);

      try {
        const response = await recurringApi.getWithTransactions(id);
        setData(response);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load details';
        setError(message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    void fetchData(true);
  }, [fetchData]);

  const renderTransaction = ({ item }: { item: StreamTransaction }) => {
    const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionLeft}>
          <Text style={styles.transactionName} numberOfLines={1}>
            {item.merchant_name || item.name}
          </Text>
          <Text style={styles.transactionDate}>{formattedDate}</Text>
        </View>
        <Text style={styles.transactionAmount}>
          {formatCurrency(Math.abs(item.amount), item.iso_currency_code)}
        </Text>
      </View>
    );
  };

  const renderHeader = () => {
    if (!data) return null;

    const { stream, total_spent, occurrence_count } = data;
    const displayName = stream.merchant_name || stream.description;
    const statusColor = getStreamStatusColor(stream.status);
    const statusLabel = getStreamStatusLabel(stream.status);
    const frequencyLabel = getFrequencyLabel(stream.frequency);
    const isInflow = stream.stream_type === 'inflow';

    return (
      <View style={styles.headerContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.merchantName}>{displayName}</Text>

          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
            <Text style={styles.frequencyText}>{frequencyLabel}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Current Amount</Text>
              <Text style={styles.statValue}>
                {formatCurrency(stream.last_amount, stream.iso_currency_code)}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Average</Text>
              <Text style={styles.statValue}>
                {formatCurrency(stream.average_amount, stream.iso_currency_code)}
              </Text>
            </View>
          </View>

          <View style={styles.totalRow}>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>
                {isInflow ? 'Total Income' : 'Total Spent'}
              </Text>
              <Text style={styles.totalValue}>
                {formatCurrency(total_spent, stream.iso_currency_code)}
              </Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>Occurrences</Text>
              <Text style={styles.totalValue}>{occurrence_count}</Text>
            </View>
          </View>

          {stream.predicted_next_date && (
            <View style={styles.nextDateRow}>
              <FontAwesome name="calendar" size={14} color={colors.accent.primary} />
              <Text style={styles.nextDateText}>
                Next expected:{' '}
                {new Date(stream.predicted_next_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Transaction History</Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome name="inbox" size={48} color={colors.text.muted} />
      <Text style={styles.emptyText}>No transactions found</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={() => void fetchData()}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: data?.stream.merchant_name || data?.stream.description || 'Details',
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
        data={data?.transactions ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
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
  summaryCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  merchantName: {
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
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border.secondary,
    marginHorizontal: spacing.md,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  statValue: {
    ...typography.titleMedium,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.secondary,
  },
  totalItem: {
    flex: 1,
    alignItems: 'center',
  },
  totalLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  totalValue: {
    ...typography.titleSmall,
    fontWeight: '600',
    color: colors.accent.primary,
  },
  nextDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.secondary,
  },
  nextDateText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  sectionTitle: {
    ...typography.titleSmall,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.secondary,
  },
  transactionLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  transactionName: {
    ...typography.bodyMedium,
    fontWeight: '500',
  },
  transactionDate: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  transactionAmount: {
    ...typography.bodyMedium,
    fontWeight: '600',
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
