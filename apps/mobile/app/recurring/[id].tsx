import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  RecurringDetailEmpty,
  RecurringDetailError,
  RecurringDetailHeader,
  RecurringDetailLoading,
  RecurringDetailNextDate,
  RecurringDetailStats,
  RecurringDetailTotals,
  RecurringHistoryHeader,
  RecurringTransactionItem,
  recurringDetailStyles as styles,
  useRecurringDetail,
} from '@/components';
import { colors, spacing } from '@/styles';
import type { StreamTransaction } from '@/types';

export default function RecurringDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data, isLoading, isRefreshing, error, refresh } = useRecurringDetail(id);

  const renderTransaction = useCallback(
    ({ item }: { item: StreamTransaction }) => <RecurringTransactionItem transaction={item} />,
    []
  );

  const renderHeader = useCallback(() => {
    if (!data) return null;

    const { stream, total_spent, occurrence_count } = data;
    const isInflow = stream.stream_type === 'inflow';

    return (
      <View style={styles.headerContainer}>
        <View style={{ backgroundColor: colors.background.secondary, borderRadius: 16, padding: spacing.lg, marginBottom: spacing.lg }}>
          <RecurringDetailHeader data={data} />

          <RecurringDetailStats
            currentAmount={stream.last_amount}
            averageAmount={stream.average_amount}
            currency={stream.iso_currency_code}
          />

          <RecurringDetailTotals
            totalSpent={total_spent}
            occurrenceCount={occurrence_count}
            isInflow={isInflow}
            currency={stream.iso_currency_code}
          />

          {stream.predicted_next_date && (
            <RecurringDetailNextDate nextDate={stream.predicted_next_date} />
          )}
        </View>

        <RecurringHistoryHeader />
      </View>
    );
  }, [data]);

  const renderEmpty = useCallback(() => <RecurringDetailEmpty />, []);

  const displayName = data?.stream.merchant_name || data?.stream.description || 'Details';

  if (isLoading) {
    return <RecurringDetailLoading />;
  }

  if (error) {
    return <RecurringDetailError error={error} onRetry={refresh} />;
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
        data={data?.transactions ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
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
