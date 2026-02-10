import { View } from 'react-native';

import { useTranslation } from '@/hooks';

import { useMerchantStatsDisplay } from './hooks';
import { StatCard } from './StatCard';
import { merchantStatsStyles as styles } from './styles';
import type { MerchantStatsGridProps } from './types';

const STAT_COLORS = {
  average: '#3B82F6',
  median: '#8B5CF6',
  frequency: '#F97316',
  max: '#EF4444',
} as const;

export function MerchantStatsGrid({
  averageTransaction,
  medianTransaction,
  maxTransaction,
  daysBetweenTransactions,
}: MerchantStatsGridProps) {
  const { t } = useTranslation();
  const { formattedAverage, formattedMedian, formattedMax, formattedFrequency } =
    useMerchantStatsDisplay(
      averageTransaction,
      medianTransaction,
      maxTransaction,
      daysBetweenTransactions
    );

  return (
    <View style={styles.grid}>
      <StatCard
        label={t('merchants.average')}
        value={formattedAverage}
        icon="calculator"
        color={STAT_COLORS.average}
      />
      <StatCard
        label={t('merchants.median')}
        value={formattedMedian}
        icon="bar-chart"
        color={STAT_COLORS.median}
      />
      <StatCard
        label={t('merchants.frequency')}
        value={formattedFrequency}
        icon="calendar"
        color={STAT_COLORS.frequency}
      />
      <StatCard
        label={t('merchants.max')}
        value={formattedMax}
        icon="arrow-up"
        color={STAT_COLORS.max}
      />
    </View>
  );
}
