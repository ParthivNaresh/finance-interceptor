import { StyleSheet, Platform } from 'react-native';

import { colors } from './colors';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const fontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

export const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export const typography = StyleSheet.create({
  displayLarge: {
    fontFamily,
    fontSize: fontSizes['5xl'],
    fontWeight: fontWeights.bold,
    color: colors.text.primary,
    letterSpacing: -1,
  },

  displayMedium: {
    fontFamily,
    fontSize: fontSizes['4xl'],
    fontWeight: fontWeights.bold,
    color: colors.text.primary,
    letterSpacing: -0.5,
  },

  displaySmall: {
    fontFamily,
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    color: colors.text.primary,
  },

  headlineLarge: {
    fontFamily,
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.semibold,
    color: colors.text.primary,
  },

  headlineMedium: {
    fontFamily,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    color: colors.text.primary,
  },

  headlineSmall: {
    fontFamily,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    color: colors.text.primary,
  },

  titleLarge: {
    fontFamily,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    color: colors.text.primary,
  },

  titleMedium: {
    fontFamily,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    color: colors.text.primary,
  },

  titleSmall: {
    fontFamily,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.text.primary,
  },

  bodyLarge: {
    fontFamily,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    color: colors.text.primary,
    lineHeight: fontSizes.md * lineHeights.normal,
  },

  bodyMedium: {
    fontFamily,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    color: colors.text.primary,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },

  bodySmall: {
    fontFamily,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    color: colors.text.secondary,
    lineHeight: fontSizes.xs * lineHeights.normal,
  },

  labelLarge: {
    fontFamily,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.text.primary,
    letterSpacing: 0.5,
  },

  labelMedium: {
    fontFamily,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: colors.text.secondary,
    letterSpacing: 0.5,
  },

  labelSmall: {
    fontFamily,
    fontSize: 10,
    fontWeight: fontWeights.medium,
    color: colors.text.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  button: {
    fontFamily,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.text.primary,
  },

  buttonSmall: {
    fontFamily,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.text.primary,
  },

  link: {
    fontFamily,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.accent.primary,
  },

  caption: {
    fontFamily,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    color: colors.text.muted,
  },

  overline: {
    fontFamily,
    fontSize: 10,
    fontWeight: fontWeights.semibold,
    color: colors.text.secondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  mono: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontSize: fontSizes.sm,
    color: colors.text.primary,
  },

  title: {
    fontFamily,
    fontSize: 28,
    fontWeight: fontWeights.bold,
    color: colors.text.primary,
  },

  subtitle: {
    fontFamily,
    fontSize: 16,
    fontWeight: fontWeights.regular,
    color: colors.text.secondary,
  },

  body: {
    fontFamily,
    fontSize: 14,
    fontWeight: fontWeights.regular,
    color: colors.text.primary,
  },
});

export type TypographyName = keyof typeof typography;
