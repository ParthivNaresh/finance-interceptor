import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { AccountSection, EmptyState, GlassButton, LoadingSpinner } from '@/components';
import { useAccounts, usePlaidLink, useTranslation } from '@/hooks';
import { colors, spacing } from '@/styles';
import type { Account } from '@/types';
import { groupAccountsByType } from '@/utils';

export default function AccountsScreen() {
  const { t } = useTranslation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data, isLoading, error, refresh } = useAccounts();

  const handlePlaidSuccess = useCallback(() => {
    void refresh();
  }, [refresh]);

  const { state: plaidState, openLink } = usePlaidLink({
    onSuccess: handlePlaidSuccess,
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

  const handleAccountPress = useCallback((_account: Account) => {
    // Future: Navigate to account detail
  }, []);

  const allAccounts = useMemo(() => {
    if (!data) return [];
    return data.plaid_items.flatMap((item) => item.accounts);
  }, [data]);

  const groupedAccounts = useMemo(() => {
    return groupAccountsByType(allAccounts);
  }, [allAccounts]);

  const isPlaidLoading = plaidState === 'loading';
  const canConnectBank = plaidState === 'idle' || plaidState === 'ready';

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

  if (!data || allAccounts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          icon="bank"
          title={t('accounts.noAccounts')}
          message={t('accounts.noAccountsSubtitle')}
        />
        <View style={styles.emptyAction}>
          <GlassButton
            title={isPlaidLoading ? t('common.loading') : t('dashboard.connectBank')}
            variant="primary"
            size="lg"
            onPress={openLink}
            disabled={!canConnectBank}
            loading={isPlaidLoading}
          />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => void handleRefresh()}
          tintColor={colors.accent.primary}
        />
      }
    >
      <View style={styles.header}>
        <GlassButton
          title={isPlaidLoading ? t('common.loading') : t('dashboard.addBank')}
          variant="secondary"
          size="md"
          onPress={openLink}
          disabled={!canConnectBank}
          loading={isPlaidLoading}
          icon={
            !isPlaidLoading ? (
              <FontAwesome name="plus" size={16} color={colors.text.primary} />
            ) : undefined
          }
          fullWidth
        />
      </View>

      {groupedAccounts.map((group) => (
        <AccountSection
          key={group.type}
          group={group}
          onAccountPress={handleAccountPress}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  emptyAction: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
});
