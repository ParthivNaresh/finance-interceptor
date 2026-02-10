import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  Text,
  View,
} from 'react-native';

import { useTranslation } from '@/hooks';
import { colors } from '@/styles';

import { subcategoryChartStyles as styles } from './styles';
import type {
  AnimatedBarProps,
  SubcategoryChartProps,
  SubcategoryDataPoint,
  SubcategoryItemProps,
} from './types';

export type { SubcategoryDataPoint } from './types';

const MAX_BAR_WIDTH_PERCENT = 0.6;
const ANIMATION_DURATION = 400;
const ANIMATION_STAGGER = 50;

function defaultFormatValue(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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

function SubcategoryItem({
  item,
  index,
  categoryColor,
  onPress,
  formatValue,
  animated,
  transactionLabel,
}: SubcategoryItemProps & { transactionLabel: string }) {
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
        <Text style={styles.transactionCount}>{transactionLabel}</Text>
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
  const { t } = useTranslation();

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
        <Text style={styles.emptyText}>{t('analytics.subcategory.noData')}</Text>
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
          transactionLabel={t('common.transactions', { count: item.transactionCount })}
        />
      ))}
    </View>
  );
}
