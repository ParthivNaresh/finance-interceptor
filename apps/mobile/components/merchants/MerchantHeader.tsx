import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { useTranslation } from '@/hooks';
import { colors } from '@/styles';

import { useMerchantDetailDisplay } from './hooks';
import { merchantHeaderStyles as styles } from './styles';
import type { MerchantHeaderProps } from './types';

export function MerchantHeader({ merchantName, merchant, lifetimeSpend }: MerchantHeaderProps) {
  const { t } = useTranslation();
  const {
    initials,
    avatarColor,
    dateRange,
    formattedCategory,
    formattedLifetimeSpend,
    transactionCountLabel,
  } = useMerchantDetailDisplay(merchantName, merchant, lifetimeSpend);

  return (
    <GlassCard variant="subtle" padding="lg">
      <View style={styles.container}>
        <View style={[styles.avatar, { backgroundColor: `${avatarColor}20` }]}>
          <Text style={[styles.initials, { color: avatarColor }]}>{initials}</Text>
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{merchantName}</Text>
            {merchant.is_recurring && (
              <View style={styles.recurringBadge}>
                <FontAwesome name="refresh" size={10} color={colors.accent.primary} />
                <Text style={styles.recurringText}>{t('merchants.subscription')}</Text>
              </View>
            )}
          </View>
          <Text style={styles.dateRange}>{dateRange}</Text>
          {formattedCategory && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{formattedCategory}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.lifetimeContainer}>
        <Text style={styles.lifetimeLabel}>{t('merchants.lifetimeSpend')}</Text>
        <Text style={styles.lifetimeAmount}>{formattedLifetimeSpend}</Text>
        <Text style={styles.transactionCount}>{transactionCountLabel}</Text>
      </View>
    </GlassCard>
  );
}
