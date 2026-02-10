import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
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

import { RecurringStreamItem, RecurringSummaryCard } from '@/components/recurring';
import { useRecurring, useTranslation } from '@/hooks';
import { colors, spacing, typography } from '@/styles';
import type { RecurringStream } from '@/types';

type TabType = 'expenses' | 'income';

export default function RecurringScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('expenses');
  const {
    inflowStreams,
    outflowStreams,
    totalMonthlyInflow,
    totalMonthlyOutflow,
    isLoading,
    isRefreshing,
    isSyncing,
    error,
    refresh,
    sync,
  } = useRecurring();

  const streams = activeTab === 'expenses' ? outflowStreams : inflowStreams;

  const handleStreamPress = useCallback(
    (stream: RecurringStream) => {
      router.push(`/recurring/${stream.id}`);
    },
    [router]
  );

  const handleSync = useCallback(() => {
    void sync();
  }, [sync]);

  const handleRefresh = useCallback(() => {
    void refresh();
  }, [refresh]);

  const renderHeader = () => (
    <View>
      <RecurringSummaryCard
        monthlyIncome={totalMonthlyInflow}
        monthlyExpenses={totalMonthlyOutflow}
      />

      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, activeTab === 'expenses' && styles.activeTab]}
          onPress={() => setActiveTab('expenses')}
        >
          <Text style={[styles.tabText, activeTab === 'expenses' && styles.activeTabText]}>
            {t('recurring.expenses')} ({outflowStreams.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'income' && styles.activeTab]}
          onPress={() => setActiveTab('income')}
        >
          <Text style={[styles.tabText, activeTab === 'income' && styles.activeTabText]}>
            {t('recurring.income')} ({inflowStreams.length})
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome name="refresh" size={48} color={colors.text.muted} />
      <Text style={styles.emptyTitle}>{t('recurring.noRecurring')}</Text>
      <Text style={styles.emptySubtitle}>{t('recurring.noRecurringSubtitle')}</Text>
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
        <Pressable style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryText}>{t('common.retry')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>{t('recurring.title')}</Text>
        <Pressable style={styles.syncButton} onPress={handleSync} disabled={isSyncing}>
          {isSyncing ? (
            <ActivityIndicator size="small" color={colors.accent.primary} />
          ) : (
            <FontAwesome name="refresh" size={18} color={colors.accent.primary} />
          )}
        </Pressable>
      </View>

      <FlatList
        data={streams}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecurringStreamItem stream={item} onPress={handleStreamPress} />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
          />
        }
        contentContainerStyle={streams.length === 0 ? styles.emptyList : undefined}
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
  syncButton: {
    padding: spacing.sm,
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
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: colors.accent.primary,
  },
  tabText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.background.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.titleMedium,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  emptyList: {
    flexGrow: 1,
  },
});
