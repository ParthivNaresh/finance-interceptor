import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing } from 'react-native';

import { colors } from '@/styles';

import type { TrendAnimationResult, TrendDisplayResult } from '../types';

export function useTrendDisplay(changePercentage: number | null): TrendDisplayResult {
  return useMemo(() => {
    const direction =
      changePercentage === null || Math.abs(changePercentage) < 1
        ? 'stable'
        : changePercentage > 0
          ? 'up'
          : 'down';

    const trendColor =
      direction === 'up'
        ? colors.accent.error
        : direction === 'down'
          ? colors.accent.success
          : colors.text.muted;

    const trendIcon: 'arrow-up' | 'arrow-down' | 'minus' =
      direction === 'up' ? 'arrow-up' : direction === 'down' ? 'arrow-down' : 'minus';

    const changeText =
      changePercentage !== null
        ? `${changePercentage > 0 ? '+' : ''}${changePercentage.toFixed(1)}%`
        : '0.0%';

    return {
      direction,
      trendColor,
      trendIcon,
      changeText,
    };
  }, [changePercentage]);
}

export function useTrendAnimation(
  average: number,
  changePercentage: number | null,
  animated: boolean
): TrendAnimationResult {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

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

  return { fadeAnim, slideAnim };
}
