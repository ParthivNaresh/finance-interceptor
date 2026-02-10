export const palette = {
  black: '#000000',
  white: '#FFFFFF',

  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0A0A0A',
  },

  navy: {
    900: '#0A0A1A',
    800: '#12122A',
    700: '#1A1A2E',
    600: '#252542',
  },

  teal: {
    50: '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#14B8A6',
    600: '#0D9488',
    700: '#0F766E',
    800: '#115E59',
    900: '#134E4A',
  },

  cyan: {
    400: '#22D3EE',
    500: '#06B6D4',
    600: '#0891B2',
  },

  green: {
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
  },

  red: {
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
  },

  amber: {
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
  },
} as const;

export const darkTheme = {
  background: {
    primary: palette.navy[900],
    secondary: palette.navy[800],
    tertiary: palette.navy[700],
    elevated: palette.navy[600],
  },

  text: {
    primary: palette.white,
    secondary: palette.gray[400],
    muted: palette.gray[500],
    inverse: palette.gray[900],
  },

  accent: {
    primary: palette.teal[400],
    secondary: palette.cyan[400],
    success: palette.green[400],
    error: palette.red[400],
    warning: palette.amber[400],
  },

  border: {
    primary: 'rgba(255, 255, 255, 0.1)',
    secondary: 'rgba(255, 255, 255, 0.05)',
  },

  glass: {
    background: 'rgba(255, 255, 255, 0.08)',
    backgroundHover: 'rgba(255, 255, 255, 0.12)',
    border: 'rgba(255, 255, 255, 0.15)',
  },
} as const;

export const lightTheme = {
  background: {
    primary: palette.white,
    secondary: palette.gray[50],
    tertiary: palette.gray[100],
    elevated: palette.white,
  },

  text: {
    primary: palette.gray[900],
    secondary: palette.gray[600],
    muted: palette.gray[400],
    inverse: palette.white,
  },

  accent: {
    primary: palette.teal[600],
    secondary: palette.cyan[600],
    success: palette.green[600],
    error: palette.red[600],
    warning: palette.amber[600],
  },

  border: {
    primary: palette.gray[200],
    secondary: palette.gray[100],
  },

  glass: {
    background: 'rgba(255, 255, 255, 0.7)',
    backgroundHover: 'rgba(255, 255, 255, 0.8)',
    border: 'rgba(0, 0, 0, 0.1)',
  },
} as const;

export type Theme = typeof darkTheme;
export type ThemeColors = keyof Theme;

export const colors = darkTheme;

export type ColorName = keyof typeof colors;
