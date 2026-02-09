import { ActivityIndicator, Text, View } from 'react-native';

import { MerchantItem, TimeRangeSelector } from '@/components/analytics';
import { GlassCard } from '@/components/glass';
import { useTranslation } from '@/hooks';
import { colors } from '@/styles';
import type { MerchantSpendingSummary } from '@/types';

import { useTimeRangeLabel } from './hooks';
import { sectionStyles as styles } from './styles';
import type { MerchantSectionProps } from './types';

export function MerchantSection({
  merchants,
  timeRange,
  onTimeRangeChange,
  onMerchantPress,
  isLoading,
}: MerchantSectionProps) {
  const { t } = useTranslation();
  const timeRangeLabel = useTimeRangeLabel(timeRange);

  const handleMerchantPress = (merchant: MerchantSpendingSummary) => {
    onMerchantPress(merchant);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('insights.topMerchants')}</Text>
      </View>

      <View style={styles.timeRangeContainer}>
        <TimeRangeSelector selected={timeRange} onSelect={onTimeRangeChange} compact />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.accent.primary} />
        </View>
      ) : merchants.length > 0 ? (
        <GlassCard variant="subtle" padding="none">
          {merchants.map((merchant, index) => (
            <View key={merchant.merchant_name}>
              <MerchantItem
                merchant={{
                  merchant_name: merchant.merchant_name,
                  merchant_id: null,
                  total_amount: merchant.total_amount.toString(),
                  transaction_count: merchant.transaction_count,
                  average_transaction: null,
                  percentage_of_total: merchant.percentage_of_total?.toString() ?? null,
                }}
                rank={index + 1}
                onPress={handleMerchantPress}
              />
              {index < merchants.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </GlassCard>
      ) : (
        <GlassCard variant="subtle" padding="md">
          <Text style={styles.emptyText}>
            {t('insights.noMerchantData', { timeRange: timeRangeLabel.toLowerCase() })}
          </Text>
        </GlassCard>
      )}
    </View>
  );
}
