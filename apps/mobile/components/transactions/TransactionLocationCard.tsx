import { Text, View } from 'react-native';

import { glassStyles } from '@/styles';

import { useTransactionLocationDisplay } from './hooks';
import { transactionLocationStyles, transactionSectionStyles as sectionStyles } from './styles';
import type { TransactionLocationCardProps } from './types';

export function TransactionLocationCard({ transaction }: TransactionLocationCardProps) {
  const { locationString } = useTransactionLocationDisplay(transaction);

  if (!locationString) {
    return null;
  }

  return (
    <View style={[glassStyles.card, sectionStyles.card]}>
      <Text style={transactionLocationStyles.text}>{locationString}</Text>
    </View>
  );
}
