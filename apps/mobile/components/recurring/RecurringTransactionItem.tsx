import { Text, View } from 'react-native';

import { useRecurringTransactionDisplay } from './hooks';
import { recurringTransactionItemStyles as styles } from './styles';
import type { RecurringTransactionItemProps } from './types';

export function RecurringTransactionItem({ transaction }: RecurringTransactionItemProps) {
  const { displayName, formattedDate, formattedAmount } = useRecurringTransactionDisplay(transaction);

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>
      <Text style={styles.amount}>{formattedAmount}</Text>
    </View>
  );
}
