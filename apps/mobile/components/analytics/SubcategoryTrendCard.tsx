import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/styles';

import { GlassCard } from '../glass';
import type { SubcategoryDataPoint } from './SubcategoryChart';
import { SubcategoryChart } from './SubcategoryChart';

type ViewMode = 'breakdown' | 'trend';

interface SubcategoryTrendCardProps {
  title?: string;
  data: SubcategoryDataPoint[];
  isLoading?: boolean;
  error?: string | null;
  categoryColor?: string;
  onItemPress?: (item: SubcategoryDataPoint, index: number) => void;
  maxItems?: number;
  showViewToggle?: boolean;
}

export function SubcategoryTrendCard({
  title = 'Subcategories',
  data,
  isLoading = false,
  error = null,
  categoryColor,
  onItemPress,
  maxItems = 8,
  showViewToggle = false,
}: SubcategoryTrendCardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('breakdown');

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const renderViewToggle = useCallback(() => {
    if (!showViewToggle) return null;

    const modes: { key: ViewMode; label: string }[] = [
      { key: 'breakdown', label: 'Breakdown' },
      { key: 'trend', label: 'Trend' },
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
  }, [showViewToggle, viewMode, handleViewModeChange]);

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
          <Text style={styles.emptyText}>No subcategory data available</Text>
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
  }, [isLoading, error, data, categoryColor, onItemPress, maxItems]);

  return (
    <GlassCard variant="subtle" padding="md">
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {renderViewToggle()}
      </View>
      {renderContent()}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.titleSmall,
    color: colors.text.primary,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background.tertiary,
    borderRadius: 8,
    padding: 2,
  },
  viewButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  viewButtonSelected: {
    backgroundColor: colors.background.primary,
  },
  viewButtonText: {
    ...typography.caption,
    color: colors.text.muted,
    fontWeight: '500',
  },
  viewButtonTextSelected: {
    color: colors.text.primary,
  },
  loadingContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  errorText: {
    ...typography.bodyMedium,
    color: colors.accent.error,
    textAlign: 'center',
  },
  emptyContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.text.muted,
  },
});
