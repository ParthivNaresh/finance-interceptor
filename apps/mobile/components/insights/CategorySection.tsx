import { ActivityIndicator, Text, View } from 'react-native';

import { CategoryItem, TimeRangeSelector } from '@/components/analytics';
import { GlassCard } from '@/components/glass';
import { useTranslation } from '@/hooks';
import { colors } from '@/styles';

import { useTimeRangeLabel } from './hooks';
import { sectionStyles as styles } from './styles';
import type { CategorySectionProps } from './types';

export function CategorySection({
  categories,
  timeRange,
  onTimeRangeChange,
  onCategoryPress,
  isLoading,
}: CategorySectionProps) {
  const { t } = useTranslation();
  const timeRangeLabel = useTimeRangeLabel(timeRange);
  const displayCategories = categories.slice(0, 5);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('insights.topCategories')}</Text>
      </View>

      <View style={styles.timeRangeContainer}>
        <TimeRangeSelector selected={timeRange} onSelect={onTimeRangeChange} compact />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.accent.primary} />
        </View>
      ) : displayCategories.length > 0 ? (
        <GlassCard variant="subtle" padding="none">
          {displayCategories.map((category, index) => (
            <View key={category.category_primary}>
              <CategoryItem category={category} onPress={onCategoryPress} />
              {index < displayCategories.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </GlassCard>
      ) : (
        <GlassCard variant="subtle" padding="md">
          <Text style={styles.emptyText}>
            {t('insights.noCategoryData', { timeRange: timeRangeLabel.toLowerCase() })}
          </Text>
        </GlassCard>
      )}
    </View>
  );
}
