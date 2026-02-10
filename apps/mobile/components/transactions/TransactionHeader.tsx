import { Text, View } from 'react-native';

import { useTranslation } from '@/hooks';

import { useTransactionHeaderDisplay } from './hooks';
import { transactionHeaderStyles as styles } from './styles';
import type { TransactionHeaderProps } from './types';

export function TransactionHeader({ transaction }: TransactionHeaderProps) {
  const { t } = useTranslation();
  const { displayName, isIncome, formattedAmount, amountPrefix, formattedDate, isPending } =
    useTransactionHeaderDisplay(transaction);

  return (
    <View style={styles.container}>
      <Text style={styles.merchantName}>{displayName}</Text>
      <Text style={[styles.amount, isIncome ? styles.income : styles.expense]}>
        {amountPrefix}
        {formattedAmount}
      </Text>
      <Text style={styles.date}>{formattedDate}</Text>
      {isPending && (
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingText}>{t('transactions.pending')}</Text>
        </View>
      )}
    </View>
  );
}
