import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GlassButton, GlassCard, LoadingSpinner, MonthlyBalanceCard, TransactionItem } from '@/components';
import { useAccounts, useCurrentCashFlow, usePlaidLink, useTransactions, useTranslation } from '@/hooks';
import { colors, spacing, typography } from '@/styles';
import type { Transaction } from '@/types';
import { formatCurrency } from '@/utils';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data: accountsData, isLoading: accountsLoading, refresh: refreshAccounts } = useAccounts();
  const { transactions, isLoading: transactionsLoading, refresh: refreshTransactions } = useTransactions();
  const {
    totalIncome,
    totalExpenses,
    savingsRate,
    isLoading: cashFlowLoading,
    refresh: refreshCashFlow,
    data: cashFlowData,
  } = useCurrentCashFlow();

  const handlePlaidSuccess = useCallback(() => {
    void refreshAccounts();
    void refreshTransactions();
    void refreshCashFlow();
  }, [refreshAccounts, refreshTransactions, refreshCashFlow]);

  const { state: plaidState, openLink } = usePlaidLink({
    onSuccess: handlePlaidSuccess,
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshAccounts(), refreshTransactions(), refreshCashFlow()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshAccounts, refreshTransactions, refreshCashFlow]);

  const handleTransactionPress = useCallback(
    (transaction: Transaction) => {
      router.push(`/transactions/${transaction.id}`);
    },
    [router]
  );

  const handleViewAllTransactions = useCallback(() => {
    router.push('/(tabs)/activity');
  }, [router]);

  const isLoading = accountsLoading || transactionsLoading;
  const netWorth = accountsData?.total_balance ?? 0;
  const recentTransactions = transactions.slice(0, 5);
  const hasAccounts = accountsData && accountsData.plaid_items.length > 0;
  const isPlaidLoading = plaidState === 'loading';
  const canConnectBank = plaidState === 'idle' || plaidState === 'ready';

  const cashFlowPeriodLabel = useMemo(() => {
    if (!cashFlowData?.period_start) return undefined;
    const [year, month] = cashFlowData.period_start.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [cashFlowData?.period_start]);

  const runwayMonths = useMemo(() => {
    if (totalExpenses <= 0) return null;
    const liquidAssets = accountsData?.total_balance ?? 0;
    if (liquidAssets <= 0) return null;
    return Math.max(0, liquidAssets / totalExpenses);
  }, [accountsData?.total_balance, totalExpenses]);

  const hasCashFlowData = totalIncome > 0 || totalExpenses > 0;

  if (isLoading && !accountsData) {
    return <LoadingSpinner />;
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
      <GlassCard variant="elevated" padding="lg" style={styles.netWorthCard}>
        <Text style={styles.netWorthLabel}>{t('dashboard.netWorth')}</Text>
        <Text style={styles.netWorthAmount}>{formatCurrency(netWorth)}</Text>
        {accountsData && (
          <Text style={styles.netWorthSubtext}>
            {t('accounts.accountsConnected', { count: accountsData.account_count })}
          </Text>
        )}
      </GlassCard>

      {hasAccounts && (cashFlowLoading || hasCashFlowData) && (
        <MonthlyBalanceCard
          income={totalIncome}
          expenses={totalExpenses}
          savingsRate={savingsRate}
          runwayMonths={runwayMonths}
          periodLabel={cashFlowPeriodLabel}
          isLoading={cashFlowLoading && !cashFlowData}
        />
      )}

      {hasAccounts && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('dashboard.recentActivity')}</Text>
            <GlassButton
              title={t('dashboard.viewAll')}
              variant="ghost"
              size="sm"
              onPress={handleViewAllTransactions}
            />
          </View>
          {transactionsLoading && recentTransactions.length === 0 ? (
            <GlassCard padding="lg">
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.accent.primary} />
                <Text style={styles.loadingText}>{t('dashboard.loadingTransactions')}</Text>
              </View>
            </GlassCard>
          ) : recentTransactions.length > 0 ? (
            <GlassCard padding="none">
              {recentTransactions.map((transaction, index) => (
                <View
                  key={transaction.id}
                  style={[
                    styles.transactionWrapper,
                    index === recentTransactions.length - 1 && styles.lastTransaction,
                  ]}
                >
                  <TransactionItem transaction={transaction} onPress={handleTransactionPress} />
                </View>
              ))}
            </GlassCard>
          ) : (
            <GlassCard padding="lg">
              <Text style={styles.emptyTransactionsText}>{t('dashboard.noTransactions')}</Text>
            </GlassCard>
          )}
        </View>
      )}

      {!hasAccounts && (
        <GlassCard variant="subtle" padding="lg" style={styles.emptyCard}>
          <View style={styles.emptyContent}>
            <FontAwesome name="bank" size={48} color={colors.text.muted} />
            <Text style={styles.emptyTitle}>{t('dashboard.noAccounts')}</Text>
            <Text style={styles.emptyText}>{t('dashboard.connectFirst')}</Text>
            <GlassButton
              title={isPlaidLoading ? t('common.loading') : t('dashboard.connectBank')}
              variant="primary"
              size="lg"
              onPress={openLink}
              disabled={!canConnectBank}
              loading={isPlaidLoading}
              style={styles.connectButton}
            />
          </View>
        </GlassCard>
      )}
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
  netWorthCard: {
    alignItems: 'center',
  },
  netWorthLabel: {
    ...typography.overline,
    color: colors.text.secondary,
  },
  netWorthAmount: {
    ...typography.displayLarge,
    marginTop: spacing.xs,
  },
  netWorthSubtext: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.titleMedium,
  },
  transactionWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  lastTransaction: {
    borderBottomWidth: 0,
  },
  emptyCard: {
    marginTop: spacing.lg,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyTitle: {
    ...typography.headlineMedium,
    marginTop: spacing.md,
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  connectButton: {
    marginTop: spacing.lg,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  emptyTransactionsText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
