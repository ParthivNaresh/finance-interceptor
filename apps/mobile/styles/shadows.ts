import { StyleSheet, Platform } from 'react-native';

const createShadow = (
  offsetY: number,
  radius: number,
  opacity: number
) => {
  if (Platform.OS === 'android') {
    return {
      elevation: Math.round(radius / 2),
    };
  }

  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
  };
};

export const shadows = StyleSheet.create({
  none: {},

  sm: createShadow(1, 2, 0.1),

  md: createShadow(2, 4, 0.15),

  lg: createShadow(4, 8, 0.2),

  xl: createShadow(8, 16, 0.25),

  glow: {
    ...createShadow(0, 20, 0.3),
    shadowColor: '#2DD4BF',
  },

  glowSubtle: {
    ...createShadow(0, 12, 0.15),
    shadowColor: '#2DD4BF',
  },
});

export type ShadowName = keyof typeof shadows;
