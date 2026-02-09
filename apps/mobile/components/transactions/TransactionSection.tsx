import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { transactionSectionStyles as styles } from './styles';

interface TransactionSectionProps {
  title: string;
  children: ReactNode;
}

export function TransactionSection({ title, children }: TransactionSectionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}
