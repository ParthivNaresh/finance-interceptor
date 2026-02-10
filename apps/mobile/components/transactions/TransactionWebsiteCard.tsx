import { Text, View } from 'react-native';

import { glassStyles } from '@/styles';

import { transactionSectionStyles as sectionStyles, transactionWebsiteStyles } from './styles';
import type { TransactionWebsiteCardProps } from './types';

export function TransactionWebsiteCard({ website }: TransactionWebsiteCardProps) {
  return (
    <View style={[glassStyles.card, sectionStyles.card]}>
      <Text style={transactionWebsiteStyles.text}>{website}</Text>
    </View>
  );
}
