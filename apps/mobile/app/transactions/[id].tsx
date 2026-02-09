import { useLocalSearchParams } from 'expo-router';
import { ScrollView } from 'react-native';

import {
  EmptyState,
  LoadingSpinner,
  TransactionDetailsCard,
  TransactionHeader,
  TransactionLocationCard,
  TransactionReferenceCard,
  TransactionSection,
  TransactionWebsiteCard,
  transactionDetailStyles as styles,
  useTransactionDetail,
  useTransactionLocationDisplay,
} from '@/components';
import { useTranslation } from '@/hooks';

export default function TransactionDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transaction, isLoading, error } = useTransactionDetail(id);

  const { locationString } = useTransactionLocationDisplay(transaction);

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

  const hasLocation = locationString !== null;
  const hasWebsite = Boolean(transaction.website);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TransactionHeader transaction={transaction} />

      <TransactionSection title={t('transactionDetail.details')}>
        <TransactionDetailsCard transaction={transaction} />
      </TransactionSection>

      {hasLocation && (
        <TransactionSection title={t('transactionDetail.location')}>
          <TransactionLocationCard transaction={transaction} />
        </TransactionSection>
      )}

      {hasWebsite && (
        <TransactionSection title={t('transactionDetail.website')}>
          <TransactionWebsiteCard website={transaction.website!} />
        </TransactionSection>
      )}

      <TransactionSection title={t('transactionDetail.reference')}>
        <TransactionReferenceCard transactionId={transaction.transaction_id} />
      </TransactionSection>
    </ScrollView>
  );
}
