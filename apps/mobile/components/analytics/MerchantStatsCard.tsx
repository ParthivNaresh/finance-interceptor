import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, Text, View } from 'react-native';

import { useTranslation } from '@/hooks';
import { colors } from '@/styles';

import { useMerchantStatsDisplay } from './hooks';
import { merchantStatsCardStyles as styles } from './styles';
import type { MerchantStatsCardProps } from './types';

export function MerchantStatsCard({
  merchant,
  rank,
  onPress,
  showDetails = false,
}: MerchantStatsCardProps) {
  const { t } = useTranslation();
  const {
    initials,
    avatarColor,
    dateRange,
    dayOfWeek,
    formattedLifetimeSpend,
    formattedAvgTransaction,
    formattedCategory,
    formattedFrequency,
    formattedMedian,
  } = useMerchantStatsDisplay(merchant);

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
          <Text style={styles.amount}>{formattedLifetimeSpend}</Text>
          <Text style={styles.lifetimeLabel}>{t('analytics.merchant.lifetime')}</Text>
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
          <Text style={styles.statLabel}>{t('analytics.merchant.transactions')}</Text>
        </View>

        {formattedAvgTransaction !== null && (
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formattedAvgTransaction}</Text>
            <Text style={styles.statLabel}>{t('analytics.merchant.avg')}</Text>
          </View>
        )}

        {formattedCategory !== null && (
          <View style={styles.stat}>
            <Text style={styles.statValue} numberOfLines={1}>
              {formattedCategory}
            </Text>
            <Text style={styles.statLabel}>{t('analytics.merchant.category')}</Text>
          </View>
        )}
      </View>

      {showDetails && (
        <View style={styles.detailsRow}>
          {formattedFrequency !== null && (
            <View style={styles.detailItem}>
              <FontAwesome name="calendar" size={12} color={colors.text.muted} />
              <Text style={styles.detailText}>{formattedFrequency}</Text>
            </View>
          )}

          {dayOfWeek !== null && (
            <View style={styles.detailItem}>
              <FontAwesome name="clock-o" size={12} color={colors.text.muted} />
              <Text style={styles.detailText}>{t('analytics.merchant.usually', { day: dayOfWeek })}</Text>
            </View>
          )}

          {formattedMedian !== null && (
            <View style={styles.detailItem}>
              <FontAwesome name="bar-chart" size={12} color={colors.text.muted} />
              <Text style={styles.detailText}>{t('analytics.merchant.median')} {formattedMedian}</Text>
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
