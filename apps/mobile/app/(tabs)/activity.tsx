import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EmptyState, LoadingSpinner, TransactionItem } from '@/components';
import { useTransactions, useTranslation } from '@/hooks';
import { colors, spacing, typography } from '@/styles';
import type { Transaction } from '@/types';

export default function ActivityScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    transactions,
    total,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error,
    refresh,
    loadMore,
  } = useTransactions();

  const handleTransactionPress = useCallback(
    (transaction: Transaction) => {
      router.push(`/transactions/${transaction.id}`);
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: Transaction }) => (
      <TransactionItem transaction={item} onPress={handleTransactionPress} />
    ),
    [handleTransactionPress]
  );

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) {
      return null;
    }
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.accent.primary} />
      </View>
    );
  }, [isLoadingMore]);

  const keyExtractor = useCallback((item: Transaction) => item.id, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <EmptyState
        icon="exclamation-circle"
        title={t('common.error')}
        message={error}
      />
    );
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon="list"
        title={t('activity.noTransactions')}
        message={t('activity.noTransactionsSubtitle')}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {t('activity.count', { count: total })}
        </Text>
      </View>

      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void refresh()}
            tintColor={colors.accent.primary}
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  headerText: {
    ...typography.labelMedium,
  },
  listContent: {
    flexGrow: 1,
  },
  footer: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});
