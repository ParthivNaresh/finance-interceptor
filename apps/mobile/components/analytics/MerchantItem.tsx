import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/styles';
import type { MerchantSpendingSummary } from '@/types';
import { formatCurrency } from '@/utils/recurring';

interface MerchantItemProps {
  merchant: MerchantSpendingSummary;
  rank?: number;
  onPress?: (merchant: MerchantSpendingSummary) => void;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

function getColorFromName(name: string): string {
  const colorPalette = [
    '#F97316',
    '#3B82F6',
    '#8B5CF6',
    '#EC4899',
    '#10B981',
    '#FBBF24',
    '#6366F1',
    '#14B8A6',
    '#EF4444',
    '#22C55E',
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colorPalette[Math.abs(hash) % colorPalette.length];
}

export function MerchantItem({ merchant, rank, onPress }: MerchantItemProps) {
  const amount = parseFloat(merchant.total_amount);
  const percentage = merchant.percentage_of_total
    ? parseFloat(merchant.percentage_of_total)
    : null;
  const initials = getInitials(merchant.merchant_name);
  const avatarColor = getColorFromName(merchant.merchant_name);

  const content = (
    <View style={styles.container}>
      {rank !== undefined && (
        <Text style={styles.rank}>#{rank}</Text>
      )}

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
          <Text style={styles.transactionCount}>
            {merchant.transaction_count} transaction{merchant.transaction_count !== 1 ? 's' : ''}
          </Text>
          {percentage !== null && (
            <Text style={styles.percentage}>{percentage.toFixed(1)}%</Text>
          )}
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  rank: {
    ...typography.labelMedium,
    color: colors.text.muted,
    width: 24,
    textAlign: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    ...typography.titleSmall,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    ...typography.titleSmall,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  amount: {
    ...typography.titleSmall,
    color: colors.text.primary,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionCount: {
    ...typography.caption,
    color: colors.text.muted,
  },
  percentage: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  chevron: {
    marginLeft: spacing.xs,
  },
});
