import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState, LoadingSpinner } from '@/components';
import { useTranslation } from '@/hooks';
import { transactionsApi } from '@/services/api';
import { colors, glassStyles, spacing, typography } from '@/styles';
import type { TransactionDetail } from '@/types';

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(Math.abs(amount));
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface DetailRowProps {
  label: string;
  value: string | null | undefined;
}

function DetailRow({ label, value }: DetailRowProps) {
  if (!value) {
    return null;
  }

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export default function TransactionDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransaction = useCallback(async () => {
    if (!id) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await transactionsApi.get(id);
      setTransaction(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('errors.unknownError');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    void fetchTransaction();
  }, [fetchTransaction]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !transaction) {
    return (
      <EmptyState
        icon="exclamation-circle"
        title={t('common.error')}
        message={error || t('errors.transactionNotFound')}
      />
    );
  }

  const isIncome = transaction.amount < 0;
  const displayName = transaction.merchant_name || transaction.name;

  const locationParts = [
    transaction.location_address,
    transaction.location_city,
    transaction.location_region,
    transaction.location_postal_code,
    transaction.location_country,
  ].filter(Boolean);
  const locationString = locationParts.length > 0 ? locationParts.join(', ') : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.merchantName}>{displayName}</Text>
        <Text style={[styles.amount, isIncome ? styles.income : styles.expense]}>
          {isIncome ? '+' : '-'}
          {formatCurrency(transaction.amount, transaction.iso_currency_code)}
        </Text>
        <Text style={styles.date}>{formatDate(transaction.date)}</Text>
        {transaction.pending && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>{t('transactions.pending')}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('transactionDetail.details')}</Text>
        <View style={[glassStyles.card, styles.card]}>
          <DetailRow label={t('transactionDetail.description')} value={transaction.name} />
          <DetailRow label={t('transactionDetail.merchant')} value={transaction.merchant_name} />
          <DetailRow label={t('transactionDetail.category')} value={transaction.personal_finance_category_primary} />
          <DetailRow label={t('transactionDetail.subcategory')} value={transaction.personal_finance_category_detailed} />
          <DetailRow label={t('transactionDetail.paymentMethod')} value={transaction.payment_channel} />
          <DetailRow
            label={t('transactionDetail.authorizedDate')}
            value={transaction.authorized_date ? formatDate(transaction.authorized_date) : null}
          />
        </View>
      </View>

      {locationString && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('transactionDetail.location')}</Text>
          <View style={[glassStyles.card, styles.card]}>
            <Text style={styles.locationText}>{locationString}</Text>
          </View>
        </View>
      )}

      {transaction.website && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('transactionDetail.website')}</Text>
          <View style={[glassStyles.card, styles.card]}>
            <Text style={styles.websiteText}>{transaction.website}</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('transactionDetail.reference')}</Text>
        <View style={[glassStyles.card, styles.card]}>
          <DetailRow label={t('transactionDetail.transactionId')} value={transaction.transaction_id} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  header: {
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  merchantName: {
    ...typography.headlineMedium,
    textAlign: 'center',
  },
  amount: {
    ...typography.displayMedium,
    marginTop: spacing.sm,
  },
  income: {
    color: colors.accent.success,
  },
  expense: {
    color: colors.text.primary,
  },
  date: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  pendingBadge: {
    backgroundColor: colors.accent.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: spacing.sm,
  },
  pendingText: {
    ...typography.labelSmall,
    color: colors.background.primary,
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    ...typography.overline,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    padding: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  detailLabel: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  detailValue: {
    ...typography.bodyMedium,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing.md,
  },
  locationText: {
    ...typography.bodyMedium,
    lineHeight: 20,
  },
  websiteText: {
    ...typography.bodyMedium,
    color: colors.accent.primary,
  },
});
