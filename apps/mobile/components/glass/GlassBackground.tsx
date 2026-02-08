import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { gradients } from '@/styles';
import type { GradientName } from '@/styles';

type BackgroundGradient = 'default' | 'accent' | 'subtle';

interface GlassBackgroundProps {
  children: React.ReactNode;
  gradient?: BackgroundGradient;
  style?: StyleProp<ViewStyle>;
  safeArea?: boolean;
}

const gradientMap: Record<BackgroundGradient, GradientName> = {
  default: 'background',
  accent: 'accentSubtle',
  subtle: 'backgroundRadial',
};

export function GlassBackground({
  children,
  gradient = 'default',
  style,
  safeArea = false,
}: GlassBackgroundProps) {
  const insets = useSafeAreaInsets();
  const gradientConfig = gradients[gradientMap[gradient]];

  const safeAreaStyle: ViewStyle = safeArea
    ? {
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }
    : {};

  const gradientColors: readonly [ColorValue, ColorValue, ...ColorValue[]] = [
    gradientConfig.colors[0],
    gradientConfig.colors[1],
  ];

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={gradientColors}
        start={gradientConfig.start}
        end={gradientConfig.end}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.content, safeAreaStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
