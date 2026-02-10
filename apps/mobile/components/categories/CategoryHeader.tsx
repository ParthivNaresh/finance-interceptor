import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { useTranslation } from '@/hooks';
import { useTimeRangeLabel } from '@/components/insights';

import { useCategoryDetailDisplay } from './hooks';
import { categoryHeaderStyles as styles } from './styles';
import type { CategoryHeaderProps } from './types';

export function CategoryHeader({
  categoryName,
  timeRange,
  totalAmount,
  transactionCount,
  percentageOfTotal,
  averageTransaction,
}: CategoryHeaderProps) {
  const { t } = useTranslation();
  const timeRangeLabel = useTimeRangeLabel(timeRange);
  const {
    categoryIcon,
    categoryColor,
    displayName,
    formattedTotal,
    formattedAverage,
    percentageLabel,
    transactionLabel,
  } = useCategoryDetailDisplay(
    categoryName,
    totalAmount,
    transactionCount,
    percentageOfTotal,
    averageTransaction
  );

  return (
    <GlassCard variant="subtle" padding="lg">
      <View style={styles.container}>
        <View style={[styles.iconContainer, { backgroundColor: `${categoryColor}20` }]}>
          <FontAwesome name={categoryIcon} size={28} color={categoryColor} />
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.periodLabel}>{timeRangeLabel}</Text>
        </View>
      </View>

      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>{t('categories.totalSpent')}</Text>
        <Text style={styles.totalAmount}>{formattedTotal}</Text>
        <View style={styles.statsRow}>
          {percentageLabel && <Text style={styles.statText}>{percentageLabel}</Text>}
          <Text style={styles.statText}>{transactionLabel}</Text>
        </View>
        {formattedAverage && (
          <Text style={styles.averageText}>
            {t('categories.avgPerTransaction', { amount: formattedAverage })}
          </Text>
        )}
      </View>
    </GlassCard>
  );
}
