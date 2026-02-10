import { useCallback } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { useTranslation } from '@/hooks';
import { colors } from '@/styles';

import { GlassCard } from '../glass';
import { useViewToggle } from './hooks';
import { SubcategoryChart } from './SubcategoryChart';
import { subcategoryTrendCardStyles as styles } from './styles';
import type { SubcategoryTrendCardProps, ViewMode } from './types';

export function SubcategoryTrendCard({
  title,
  data,
  isLoading = false,
  error = null,
  categoryColor,
  onItemPress,
  maxItems = 8,
  showViewToggle = false,
}: SubcategoryTrendCardProps) {
  const { t } = useTranslation();
  const { viewMode, handleViewModeChange } = useViewToggle('breakdown');

  const displayTitle = title ?? t('transactionDetail.subcategory');

  const renderViewToggle = useCallback(() => {
    if (!showViewToggle) return null;

    const modes: { key: ViewMode; label: string }[] = [
      { key: 'breakdown', label: t('analytics.viewToggle.breakdown') },
      { key: 'trend', label: t('analytics.viewToggle.trend') },
    ];

    return (
      <View style={styles.viewToggle}>
        {modes.map(({ key, label }) => {
          const isSelected = viewMode === key;
          return (
            <Pressable
              key={key}
              style={[styles.viewButton, isSelected && styles.viewButtonSelected]}
              onPress={() => handleViewModeChange(key)}
            >
              <Text style={[styles.viewButtonText, isSelected && styles.viewButtonTextSelected]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }, [t, showViewToggle, viewMode, handleViewModeChange]);

  const renderContent = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.accent.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    if (data.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('analytics.subcategory.noData')}</Text>
        </View>
      );
    }

    return (
      <SubcategoryChart
        data={data}
        categoryColor={categoryColor}
        onItemPress={onItemPress}
        maxItems={maxItems}
      />
    );
  }, [t, isLoading, error, data, categoryColor, onItemPress, maxItems]);

  return (
    <GlassCard variant="subtle" padding="md">
      <View style={styles.header}>
        <Text style={styles.title}>{displayTitle}</Text>
        {renderViewToggle()}
      </View>
      {renderContent()}
    </GlassCard>
  );
}
