import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, spacing, typography } from '@/styles';

export interface SubcategoryDataPoint {
  name: string;
  value: number;
  percentage: number;
  transactionCount: number;
}

interface SubcategoryChartProps {
  data: SubcategoryDataPoint[];
  categoryColor?: string;
  onItemPress?: (item: SubcategoryDataPoint, index: number) => void;
  maxItems?: number;
  formatValue?: (value: number) => string;
  animated?: boolean;
}

const BAR_HEIGHT = 8;
const MAX_BAR_WIDTH_PERCENT = 0.6;
const ANIMATION_DURATION = 400;
const ANIMATION_STAGGER = 50;

function defaultFormatValue(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

interface AnimatedBarProps {
  percentage: number;
  color: string;
  delay: number;
  animated: boolean;
}

function AnimatedBar({ percentage, color, delay, animated }: AnimatedBarProps) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useMemo(() => {
    if (animated) {
      Animated.timing(widthAnim, {
        toValue: percentage,
        duration: ANIMATION_DURATION,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    } else {
      widthAnim.setValue(percentage);
    }
  }, [percentage, delay, animated, widthAnim]);

  const widthStyle = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', `${MAX_BAR_WIDTH_PERCENT * 100}%`],
  });

  return (
    <View style={styles.barContainer}>
      <View style={styles.barBackground}>
        <Animated.View
          style={[
            styles.barFill,
            {
              width: widthStyle,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

interface SubcategoryItemProps {
  item: SubcategoryDataPoint;
  index: number;
  categoryColor: string;
  onPress?: () => void;
  formatValue: (value: number) => string;
  animated: boolean;
}

function SubcategoryItem({
  item,
  index,
  categoryColor,
  onPress,
  formatValue,
  animated,
}: SubcategoryItemProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }, [onPress]);

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.itemContainer, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.itemHeader}>
          <View style={styles.itemLeft}>
            <View style={[styles.colorDot, { backgroundColor: categoryColor }]} />
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
          </View>
          <View style={styles.itemRight}>
            <Text style={styles.itemValue}>{formatValue(item.value)}</Text>
            <Text style={styles.itemPercentage}>{item.percentage.toFixed(1)}%</Text>
          </View>
        </View>
        <AnimatedBar
          percentage={item.percentage}
          color={categoryColor}
          delay={index * ANIMATION_STAGGER}
          animated={animated}
        />
        <Text style={styles.transactionCount}>
          {item.transactionCount} transaction{item.transactionCount !== 1 ? 's' : ''}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function SubcategoryChart({
  data,
  categoryColor = colors.accent.primary,
  onItemPress,
  maxItems = 10,
  formatValue = defaultFormatValue,
  animated = true,
}: SubcategoryChartProps) {
  const displayData = useMemo(() => {
    return data.slice(0, maxItems);
  }, [data, maxItems]);

  const handleItemPress = useCallback(
    (item: SubcategoryDataPoint, index: number) => {
      onItemPress?.(item, index);
    },
    [onItemPress]
  );

  if (displayData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No subcategory data</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {displayData.map((item, index) => (
        <SubcategoryItem
          key={item.name}
          item={item}
          index={index}
          categoryColor={categoryColor}
          onPress={() => handleItemPress(item, index)}
          formatValue={formatValue}
          animated={animated}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  emptyContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.text.muted,
  },
  itemContainer: {
    paddingVertical: spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  itemName: {
    ...typography.bodyMedium,
    fontWeight: '500',
    color: colors.text.primary,
    flex: 1,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemValue: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.text.primary,
  },
  itemPercentage: {
    ...typography.caption,
    color: colors.text.muted,
    minWidth: 45,
    textAlign: 'right',
  },
  barContainer: {
    marginBottom: spacing.xs,
  },
  barBackground: {
    height: BAR_HEIGHT,
    backgroundColor: colors.background.tertiary,
    borderRadius: BAR_HEIGHT / 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: BAR_HEIGHT / 2,
  },
  transactionCount: {
    ...typography.caption,
    color: colors.text.muted,
    fontSize: 11,
  },
});
