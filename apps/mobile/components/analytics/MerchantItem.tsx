import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/styles';
import { formatCurrency } from '@/utils/recurring';

import { useMerchantDisplay } from './hooks';
import { merchantItemStyles as styles } from './styles';
import type { MerchantItemProps } from './types';

export function MerchantItem({ merchant, rank, onPress }: MerchantItemProps) {
  const { amount, percentage, initials, avatarColor, transactionLabel } = useMerchantDisplay(merchant);

  const content = (
    <View style={styles.container}>
      {rank !== undefined && <Text style={styles.rank}>#{rank}</Text>}

      <View style={[styles.avatar, { backgroundColor: `${avatarColor}20` }]}>
        <Text style={[styles.initials, { color: avatarColor }]}>{initials}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {merchant.merchant_name}
          </Text>
          <Text style={styles.amount}>{formatCurrency(amount)}</Text>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.transactionCount}>{transactionLabel}</Text>
          {percentage !== null && <Text style={styles.percentage}>{percentage.toFixed(1)}%</Text>}
        </View>
      </View>

      {onPress && (
        <FontAwesome name="chevron-right" size={12} color={colors.text.muted} style={styles.chevron} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={() => onPress(merchant)}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}
