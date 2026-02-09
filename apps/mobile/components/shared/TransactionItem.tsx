import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, Text, View } from 'react-native';

import { useTranslation } from '@/hooks';
import { colors } from '@/styles';

import { useTransactionDisplay } from './hooks';
import { transactionItemStyles as styles } from './styles';
import type { TransactionItemProps } from './types';

export function TransactionItem({ transaction, onPress }: TransactionItemProps) {
  const { t } = useTranslation();
  const { isIncome, displayName, categoryIcon, formattedAmount, amountPrefix, formattedDate } =
    useTransactionDisplay(transaction);

  const handlePress = () => {
    onPress?.(transaction);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={handlePress}
    >
      <View style={styles.iconContainer}>
        <FontAwesome name={categoryIcon} size={18} color={colors.text.secondary} />
      </View>

      <View style={styles.details}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={[styles.amount, isIncome ? styles.income : styles.expense]}>
            {amountPrefix}
            {formattedAmount}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.metaInfo}>
            <Text style={styles.date}>{formattedDate}</Text>
            {transaction.pending && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>{t('transactions.pending')}</Text>
              </View>
            )}
          </View>
          {transaction.personal_finance_category_primary && (
            <Text style={styles.category}>{transaction.personal_finance_category_primary}</Text>
          )}
        </View>
      </View>

      <FontAwesome name="chevron-right" size={12} color={colors.text.muted} />
    </Pressable>
  );
}
