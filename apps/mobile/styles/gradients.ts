import { palette } from './colors';

export interface GradientConfig {
  colors: readonly string[];
  start: { x: number; y: number };
  end: { x: number; y: number };
}

export const gradients = {
  background: {
    colors: [palette.navy[900], palette.navy[700]] as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },

  backgroundRadial: {
    colors: [palette.navy[700], palette.navy[900]] as const,
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },

  accent: {
    colors: [palette.teal[400], palette.cyan[400]] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  accentSubtle: {
    colors: ['rgba(45, 212, 191, 0.2)', 'rgba(34, 211, 238, 0.1)'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  success: {
    colors: [palette.green[400], palette.teal[400]] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  error: {
    colors: [palette.red[400], palette.red[500]] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  glass: {
    colors: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'] as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },

  glassHover: {
    colors: ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.08)'] as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },

  shimmer: {
    colors: [
      'rgba(255, 255, 255, 0)',
      'rgba(255, 255, 255, 0.1)',
      'rgba(255, 255, 255, 0)',
    ] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
} as const;

export type GradientName = keyof typeof gradients;
