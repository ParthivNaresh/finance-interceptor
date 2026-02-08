import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack, useRouter } from 'expo-router';
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

import { AlertItem } from '@/components/alerts';
import { useAlerts, useTranslation } from '@/hooks';
import { colors, spacing, typography } from '@/styles';
import type { AlertWithStream } from '@/types';

type FilterType = 'all' | 'unread';

export default function AlertsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');
  const {
    alerts,
    unreadCount,
    isLoading,
    isRefreshing,
    error,
    refresh,
    markAsRead,
    dismiss,
    markAllAsRead,
  } = useAlerts(filter === 'unread');

  const handleAlertPress = useCallback(
    (alert: AlertWithStream) => {
      if (alert.status === 'unread') {
        void markAsRead(alert.id);
      }
    },
    [markAsRead]
  );

  const handleDismiss = useCallback(
    (alertId: string) => {
      void dismiss(alertId);
    },
    [dismiss]
  );

  const handleMarkAllRead = useCallback(() => {
    void markAllAsRead();
  }, [markAllAsRead]);

  const handleRefresh = useCallback(() => {
    void refresh();
  }, [refresh]);

  const renderHeader = () => (
    <View style={styles.filterContainer}>
      <View style={styles.filterTabs}>
        <Pressable
          style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            {t('alerts.all')}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterTab, filter === 'unread' && styles.activeFilterTab]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterText, filter === 'unread' && styles.activeFilterText]}>
            {t('alerts.unread')} {unreadCount > 0 && `(${unreadCount})`}
          </Text>
        </Pressable>
      </View>

      {unreadCount > 0 && (
        <Pressable style={styles.markAllButton} onPress={handleMarkAllRead}>
          <Text style={styles.markAllText}>{t('alerts.markAllRead')}</Text>
        </Pressable>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome name="bell-o" size={48} color={colors.text.muted} />
      <Text style={styles.emptyTitle}>{t('alerts.noAlerts')}</Text>
      <Text style={styles.emptySubtitle}>{t('alerts.noAlertsSubtitle')}</Text>
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
      <Stack.Screen
        options={{
          title: t('alerts.title'),
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
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AlertItem alert={item} onPress={handleAlertPress} onDismiss={handleDismiss} />
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
        contentContainerStyle={alerts.length === 0 ? styles.emptyList : undefined}
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
  filterContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeFilterTab: {
    backgroundColor: colors.accent.primary,
  },
  filterText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  activeFilterText: {
    color: colors.background.primary,
    fontWeight: '600',
  },
  markAllButton: {
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  markAllText: {
    ...typography.caption,
    color: colors.accent.primary,
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
