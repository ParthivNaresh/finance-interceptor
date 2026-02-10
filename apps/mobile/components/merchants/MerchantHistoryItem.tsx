import { Text, View } from 'react-native';

import { useMerchantHistoryDisplay } from './hooks';
import { merchantHistoryStyles as styles } from './styles';
import type { MerchantHistoryItemProps } from './types';

export function MerchantHistoryItem({ item }: MerchantHistoryItemProps) {
  const { monthLabel, formattedAmount, transactionLabel } = useMerchantHistoryDisplay(item);

  return (
    <View style={styles.item}>
      <View style={styles.itemLeft}>
        <Text style={styles.month}>{monthLabel}</Text>
        <Text style={styles.count}>{transactionLabel}</Text>
      </View>
      <Text style={styles.amount}>{formattedAmount}</Text>
    </View>
  );
}
