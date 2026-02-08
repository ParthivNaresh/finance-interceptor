import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/styles';
import type { MerchantStats } from '@/types';
import { formatCurrency } from '@/utils/recurring';

interface MerchantStatsCardProps {
  merchant: MerchantStats;
  rank?: number;
  onPress?: (merchant: MerchantStats) => void;
  showDetails?: boolean;
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

function formatDateRange(firstDate: string, lastDate: string): string {
  const first = new Date(firstDate);
  const last = new Date(lastDate);

  const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
  const firstFormatted = first.toLocaleDateString('en-US', formatOptions);
  const lastFormatted = last.toLocaleDateString('en-US', formatOptions);

  if (firstFormatted === lastFormatted) {
    return firstFormatted;
  }

  return `${firstFormatted} - ${lastFormatted}`;
}

function formatDayOfWeek(dow: number | null): string | null {
  if (dow === null) return null;
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days[dow] ?? null;
}

export function MerchantStatsCard({
  merchant,
  rank,
  onPress,
  showDetails = false,
}: MerchantStatsCardProps) {
  const lifetimeSpend = parseFloat(merchant.total_lifetime_spend);
  const avgTransaction = merchant.average_transaction_amount
    ? parseFloat(merchant.average_transaction_amount)
    : null;
  const initials = getInitials(merchant.merchant_name);
  const avatarColor = getColorFromName(merchant.merchant_name);
  const dateRange = formatDateRange(merchant.first_transaction_date, merchant.last_transaction_date);
  const dayOfWeek = formatDayOfWeek(merchant.most_frequent_day_of_week);

  const content = (
    <View style={styles.container}>
      <View style={styles.header}>
        {rank !== undefined && <Text style={styles.rank}>#{rank}</Text>}

        <View style={[styles.avatar, { backgroundColor: `${avatarColor}20` }]}>
          <Text style={[styles.initials, { color: avatarColor }]}>{initials}</Text>
        </View>

        <View style={styles.headerContent}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {merchant.merchant_name}
            </Text>
            {merchant.is_recurring && (
              <View style={styles.recurringBadge}>
                <FontAwesome name="refresh" size={10} color={colors.accent.primary} />
              </View>
            )}
          </View>
          <Text style={styles.dateRange}>{dateRange}</Text>
        </View>

        <View style={styles.amountContainer}>
          <Text style={styles.amount}>{formatCurrency(lifetimeSpend)}</Text>
          <Text style={styles.lifetimeLabel}>lifetime</Text>
        </View>

        {onPress && (
          <FontAwesome
            name="chevron-right"
            size={12}
            color={colors.text.muted}
            style={styles.chevron}
          />
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{merchant.total_transaction_count}</Text>
          <Text style={styles.statLabel}>transactions</Text>
        </View>

        {avgTransaction !== null && (
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatCurrency(avgTransaction)}</Text>
            <Text style={styles.statLabel}>avg</Text>
          </View>
        )}

        {merchant.primary_category && (
          <View style={styles.stat}>
            <Text style={styles.statValue} numberOfLines={1}>
              {formatCategory(merchant.primary_category)}
            </Text>
            <Text style={styles.statLabel}>category</Text>
          </View>
        )}
      </View>

      {showDetails && (
        <View style={styles.detailsRow}>
          {merchant.average_days_between_transactions && (
            <View style={styles.detailItem}>
              <FontAwesome name="calendar" size={12} color={colors.text.muted} />
              <Text style={styles.detailText}>
                Every {Math.round(parseFloat(merchant.average_days_between_transactions))} days
              </Text>
            </View>
          )}

          {dayOfWeek && (
            <View style={styles.detailItem}>
              <FontAwesome name="clock-o" size={12} color={colors.text.muted} />
              <Text style={styles.detailText}>Usually {dayOfWeek}</Text>
            </View>
          )}

          {merchant.median_transaction_amount && (
            <View style={styles.detailItem}>
              <FontAwesome name="bar-chart" size={12} color={colors.text.muted} />
              <Text style={styles.detailText}>
                Median: {formatCurrency(parseFloat(merchant.median_transaction_amount))}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={() => onPress(merchant)} style={({ pressed }) => [pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }

  return content;
}

function formatCategory(category: string): string {
  return category
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rank: {
    ...typography.labelMedium,
    color: colors.text.muted,
    width: 24,
    textAlign: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    ...typography.titleSmall,
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    ...typography.titleSmall,
    color: colors.text.primary,
    flex: 1,
  },
  recurringBadge: {
    backgroundColor: `${colors.accent.primary}20`,
    borderRadius: 6,
    padding: 4,
  },
  dateRange: {
    ...typography.caption,
    color: colors.text.muted,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    ...typography.titleMedium,
    color: colors.text.primary,
    fontWeight: '700',
  },
  lifetimeLabel: {
    ...typography.caption,
    color: colors.text.muted,
  },
  chevron: {
    marginLeft: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
  },
  stat: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  statValue: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.muted,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
