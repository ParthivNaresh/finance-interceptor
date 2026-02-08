import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/styles';

import { GlassCard } from '../glass';
import type { ChartDataPoint } from './SpendingBarChart';
import { SpendingBarChart } from './SpendingBarChart';
import { TrendSummary } from './TrendSummary';

type PeriodOption = 6 | 12;

interface SpendingTrendCardProps {
  title?: string;
  data: ChartDataPoint[];
  isLoading?: boolean;
  error?: string | null;
  barColor?: string;
  onBarPress?: (item: ChartDataPoint, index: number) => void;
  onPeriodChange?: (months: PeriodOption) => void;
  initialPeriod?: PeriodOption;
  showTopLabels?: boolean;
  showAverage?: boolean;
  chartHeight?: number;
}

function calculateTrendMetrics(data: ChartDataPoint[]): {
  average: number;
  changePercentage: number | null;
} {
  if (data.length === 0) {
    return { average: 0, changePercentage: null };
  }

  const values = data.map((d) => d.value);
  const average = values.reduce((sum, v) => sum + v, 0) / values.length;

  if (data.length < 2) {
    return { average, changePercentage: null };
  }

  const midpoint = Math.floor(data.length / 2);
  const recentValues = values.slice(midpoint);
  const olderValues = values.slice(0, midpoint);

  const recentAvg = recentValues.reduce((sum, v) => sum + v, 0) / recentValues.length;
  const olderAvg = olderValues.reduce((sum, v) => sum + v, 0) / olderValues.length;

  const changePercentage = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : null;

  return { average, changePercentage };
}

export function SpendingTrendCard({
  title = 'Spending Trend',
  data,
  isLoading = false,
  error = null,
  barColor,
  onBarPress,
  onPeriodChange,
  initialPeriod = 6,
  showTopLabels = true,
  showAverage = false,
  chartHeight,
}: SpendingTrendCardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>(initialPeriod);

  const handlePeriodChange = useCallback(
    (period: PeriodOption) => {
      setSelectedPeriod(period);
      onPeriodChange?.(period);
    },
    [onPeriodChange]
  );

  const { average, changePercentage } = useMemo(() => calculateTrendMetrics(data), [data]);

  const renderPeriodToggle = useCallback(() => {
    const periods: PeriodOption[] = [6, 12];

    return (
      <View style={styles.periodToggle}>
        {periods.map((period) => {
          const isSelected = selectedPeriod === period;
          return (
            <Pressable
              key={period}
              style={[styles.periodButton, isSelected && styles.periodButtonSelected]}
              onPress={() => handlePeriodChange(period)}
            >
              <Text style={[styles.periodButtonText, isSelected && styles.periodButtonTextSelected]}>
                {period}mo
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }, [selectedPeriod, handlePeriodChange]);

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
          <Text style={styles.emptyText}>No historical data available</Text>
        </View>
      );
    }

    return (
      <>
        <SpendingBarChart
          data={data}
          barColor={barColor}
          onBarPress={onBarPress}
          showAverage={showAverage}
          showTopLabels={showTopLabels}
          height={chartHeight}
        />
        <View style={styles.summaryContainer}>
          <TrendSummary average={average} changePercentage={changePercentage} />
        </View>
      </>
    );
  }, [
    isLoading,
    error,
    data,
    barColor,
    onBarPress,
    showAverage,
    showTopLabels,
    chartHeight,
    average,
    changePercentage,
  ]);

  return (
    <GlassCard variant="subtle" padding="md">
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {renderPeriodToggle()}
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
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background.tertiary,
    borderRadius: 8,
    padding: 2,
  },
  periodButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  periodButtonSelected: {
    backgroundColor: colors.background.primary,
  },
  periodButtonText: {
    ...typography.caption,
    color: colors.text.muted,
    fontWeight: '500',
  },
  periodButtonTextSelected: {
    color: colors.text.primary,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    height: 200,
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
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.text.muted,
  },
  summaryContainer: {
    marginTop: spacing.md,
  },
});
