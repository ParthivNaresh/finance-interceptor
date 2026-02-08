import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/styles';

type TrendDirection = 'up' | 'down' | 'stable';

interface TrendSummaryProps {
  average: number;
  changePercentage: number | null;
  periodLabel?: string;
  formatValue?: (value: number) => string;
  animated?: boolean;
}

function getTrendDirection(change: number | null): TrendDirection {
  if (change === null || Math.abs(change) < 1) return 'stable';
  return change > 0 ? 'up' : 'down';
}

function getTrendColor(direction: TrendDirection): string {
  switch (direction) {
    case 'up':
      return colors.accent.error;
    case 'down':
      return colors.accent.success;
    case 'stable':
      return colors.text.muted;
  }
}

function getTrendIcon(direction: TrendDirection): 'arrow-up' | 'arrow-down' | 'minus' {
  switch (direction) {
    case 'up':
      return 'arrow-up';
    case 'down':
      return 'arrow-down';
    case 'stable':
      return 'minus';
  }
}

function defaultFormatValue(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function TrendSummary({
  average,
  changePercentage,
  periodLabel = 'per month',
  formatValue = defaultFormatValue,
  animated = true,
}: TrendSummaryProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  const direction = getTrendDirection(changePercentage);
  const trendColor = getTrendColor(direction);
  const trendIcon = getTrendIcon(direction);

  const changeText =
    changePercentage !== null
      ? `${changePercentage > 0 ? '+' : ''}${changePercentage.toFixed(1)}%`
      : '0.0%';

  useEffect(() => {
    if (animated) {
      fadeAnim.setValue(0);
      slideAnim.setValue(10);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          delay: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          delay: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(1);
      slideAnim.setValue(0);
    }
  }, [average, changePercentage, animated, fadeAnim, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.averageSection}>
        <Text style={styles.label}>Average</Text>
        <Text style={styles.averageValue}>
          {formatValue(average)} <Text style={styles.periodLabel}>{periodLabel}</Text>
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.changeSection}>
        <Text style={styles.label}>vs Previous Period</Text>
        <View style={styles.changeRow}>
          <View style={[styles.iconContainer, { backgroundColor: `${trendColor}15` }]}>
            <FontAwesome name={trendIcon} size={10} color={trendColor} />
          </View>
          <Text style={[styles.changeValue, { color: trendColor }]}>{changeText}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
  },
  averageSection: {
    flex: 1,
    gap: 2,
  },
  changeSection: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border.secondary,
    marginHorizontal: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 10,
  },
  averageValue: {
    ...typography.titleSmall,
    fontWeight: '600',
    color: colors.text.primary,
  },
  periodLabel: {
    ...typography.caption,
    color: colors.text.muted,
    fontWeight: '400',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconContainer: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeValue: {
    ...typography.titleSmall,
    fontWeight: '600',
  },
});
