import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Text,
  View,
} from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { useTranslation } from '@/hooks';
import { colors, spacing } from '@/styles';

import { useChartMetrics } from './hooks';
import { spendingBarChartStyles as styles } from './styles';
import type { ChartDataPoint, SpendingBarChartProps, TooltipData } from './types';

export type { ChartDataPoint } from './types';

const DEFAULT_HEIGHT = 160;
const TOP_LABEL_HEIGHT = 24;
const BAR_WIDTH = 28;
const BAR_SPACING = 12;
const INITIAL_SPACING = 16;
const TOOLTIP_DURATION = 2500;

function defaultFormatValue(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return `$${value.toFixed(0)}`;
}

function formatFullValue(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function SpendingBarChart({
  data,
  height = DEFAULT_HEIGHT,
  barColor = colors.accent.primary,
  onBarPress,
  showAverage = false,
  showTopLabels = true,
  formatValue = defaultFormatValue,
  animated = true,
}: SpendingBarChartProps) {
  const { t } = useTranslation();
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalHeight = showTopLabels ? height + TOP_LABEL_HEIGHT : height;
  const { maxValue, average } = useChartMetrics(data);

  const handleBarPressInternal = useCallback(
    (item: ChartDataPoint, index: number) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onBarPress?.(item, index);
    },
    [onBarPress]
  );

  const handleBarLongPressInternal = useCallback(
    (item: ChartDataPoint, index: number) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }

      const barX = INITIAL_SPACING + index * (BAR_WIDTH + BAR_SPACING) + BAR_WIDTH / 2;
      const barHeight = (item.value / maxValue) * height;
      const barY = height - barHeight;

      setTooltip({ item, index, x: barX, y: barY });

      Animated.timing(tooltipOpacity, {
        toValue: 1,
        duration: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();

      tooltipTimeoutRef.current = setTimeout(() => {
        Animated.timing(tooltipOpacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }).start(() => setTooltip(null));
      }, TOOLTIP_DURATION);
    },
    [maxValue, height, tooltipOpacity]
  );

  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      value: item.value,
      label: item.label,
      frontColor: barColor,
      topLabelComponent: showTopLabels
        ? () => <Text style={styles.barTopLabel}>{formatValue(item.value)}</Text>
        : undefined,
      topLabelContainerStyle: showTopLabels ? styles.topLabelContainer : undefined,
      onPress: () => handleBarPressInternal(item, index),
      onLongPress: () => handleBarLongPressInternal(item, index),
    }));
  }, [data, barColor, formatValue, showTopLabels, handleBarPressInternal, handleBarLongPressInternal]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

  const dismissTooltip = useCallback(() => {
    if (tooltip) {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      Animated.timing(tooltipOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => setTooltip(null));
    }
  }, [tooltip, tooltipOpacity]);

  const renderTooltip = useCallback(() => {
    if (!tooltip) return null;

    const tooltipWidth = 120;
    let tooltipX = tooltip.x - tooltipWidth / 2;

    if (tooltipX < spacing.xs) {
      tooltipX = spacing.xs;
    } else if (tooltipX + tooltipWidth > containerWidth - spacing.xs) {
      tooltipX = containerWidth - tooltipWidth - spacing.xs;
    }

    const tooltipY = Math.max(tooltip.y - 50, 0);

    return (
      <Animated.View
        style={[
          styles.tooltip,
          {
            opacity: tooltipOpacity,
            left: tooltipX,
            top: tooltipY,
            width: tooltipWidth,
          },
        ]}
      >
        <Text style={styles.tooltipValue}>{formatFullValue(tooltip.item.value)}</Text>
        {tooltip.item.date && (
          <Text style={styles.tooltipDate}>
            {new Date(tooltip.item.date).toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        )}
      </Animated.View>
    );
  }, [tooltip, tooltipOpacity, containerWidth]);

  const renderAverageLine = useCallback(() => {
    if (!showAverage || average === 0 || maxValue === 0) return null;

    const linePosition = (average / maxValue) * height;
    const bottomOffset = height - linePosition + (showTopLabels ? TOP_LABEL_HEIGHT : 0);

    return (
      <View style={[styles.averageLineContainer, { bottom: bottomOffset }]}>
        <View style={styles.averageLine} />
        <Text style={styles.averageLabel}>{t('analytics.chart.average')} {formatValue(average)}</Text>
      </View>
    );
  }, [t, showAverage, average, maxValue, height, formatValue, showTopLabels]);

  if (data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height: totalHeight }]}>
        <Text style={styles.emptyText}>{t('analytics.chart.noData')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={handleLayout} onTouchEnd={dismissTooltip}>
      <View style={[styles.chartWrapper, { minHeight: totalHeight }]}>
        <BarChart
          data={chartData}
          height={height}
          barWidth={BAR_WIDTH}
          spacing={BAR_SPACING}
          initialSpacing={INITIAL_SPACING}
          endSpacing={INITIAL_SPACING}
          maxValue={maxValue}
          noOfSections={4}
          barBorderRadius={6}
          yAxisThickness={0}
          xAxisThickness={1}
          xAxisColor={colors.border.secondary}
          xAxisLabelTextStyle={styles.xAxisLabel}
          hideYAxisText
          hideRules
          disableScroll={data.length <= 6}
          showScrollIndicator={false}
          isAnimated={animated}
          animationDuration={600}
        />
        {renderAverageLine()}
        {renderTooltip()}
      </View>
    </View>
  );
}
