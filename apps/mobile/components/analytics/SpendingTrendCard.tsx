import { useCallback } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { useTranslation } from '@/hooks';
import { colors } from '@/styles';

import { GlassCard } from '../glass';
import { usePeriodToggle, useTrendMetrics } from './hooks';
import { SpendingBarChart } from './SpendingBarChart';
import { spendingTrendCardStyles as styles } from './styles';
import { TrendSummary } from './TrendSummary';
import type { PeriodOption, SpendingTrendCardProps } from './types';

export function SpendingTrendCard({
  title,
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
  const { t } = useTranslation();
  const { selectedPeriod, handlePeriodChange } = usePeriodToggle(initialPeriod, onPeriodChange);
  const { average, changePercentage } = useTrendMetrics(data);

  const displayTitle = title ?? t('insights.spendingTrend');

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
          <Text style={styles.emptyText}>{t('analytics.trend.noHistoricalData')}</Text>
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
    t,
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
        <Text style={styles.title}>{displayTitle}</Text>
        {renderPeriodToggle()}
      </View>
      {renderContent()}
    </GlassCard>
  );
}
