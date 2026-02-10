import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';

import {
  borderRadius as borderRadiusTokens,
  colors,
  GLASS_BLUR_INTENSITY,
  GLASS_BLUR_TINT,
  gradients,
  spacing,
} from '@/styles';

type CardVariant = 'default' | 'elevated' | 'subtle';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';
type CardBorderRadius = 'sm' | 'md' | 'lg' | 'xl';

interface GlassCardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  borderRadius?: CardBorderRadius;
  style?: StyleProp<ViewStyle>;
  withGradient?: boolean;
}

const paddingMap: Record<CardPadding, number> = {
  none: 0,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
};

const borderRadiusMap: Record<CardBorderRadius, number> = {
  sm: borderRadiusTokens.md,
  md: borderRadiusTokens.lg,
  lg: borderRadiusTokens.xl,
  xl: borderRadiusTokens['2xl'],
};

const variantStyles: Record<CardVariant, ViewStyle> = {
  default: {
    backgroundColor: colors.glass.background,
    borderColor: colors.glass.border,
    borderWidth: 1,
  },
  elevated: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
  },
  subtle: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
  },
};

export function GlassCard({
  children,
  variant = 'default',
  padding = 'md',
  borderRadius = 'lg',
  style,
  withGradient = false,
}: GlassCardProps) {
  const containerStyle: ViewStyle = {
    ...variantStyles[variant],
    borderRadius: borderRadiusMap[borderRadius],
    overflow: 'hidden',
  };

  const contentStyle: ViewStyle = {
    padding: paddingMap[padding],
  };

  if (withGradient) {
    const gradientColors: readonly [ColorValue, ColorValue, ...ColorValue[]] = [
      gradients.glass.colors[0],
      gradients.glass.colors[1],
    ];

    return (
      <View style={[containerStyle, style]}>
        <LinearGradient
          colors={gradientColors}
          start={gradients.glass.start}
          end={gradients.glass.end}
          style={StyleSheet.absoluteFill}
        />
        <BlurView
          intensity={GLASS_BLUR_INTENSITY}
          tint={GLASS_BLUR_TINT}
          style={StyleSheet.absoluteFill}
        />
        <View style={contentStyle}>{children}</View>
      </View>
    );
  }

  return (
    <View style={[containerStyle, style]}>
      <View style={contentStyle}>{children}</View>
    </View>
  );
}
