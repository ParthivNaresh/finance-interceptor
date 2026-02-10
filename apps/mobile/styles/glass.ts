import { StyleSheet } from 'react-native';

import { colors } from './colors';
import { spacing } from './spacing';

export const GLASS_BLUR_INTENSITY = 20;
export const GLASS_BLUR_TINT = 'dark' as const;

export const glassStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.glass.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glass.border,
    overflow: 'hidden',
  },

  cardSmall: {
    backgroundColor: colors.glass.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glass.border,
    overflow: 'hidden',
  },

  cardLarge: {
    backgroundColor: colors.glass.background,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.glass.border,
    overflow: 'hidden',
  },

  cardContent: {
    padding: spacing.md,
  },

  cardContentLarge: {
    padding: spacing.lg,
  },

  button: {
    backgroundColor: colors.glass.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glass.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
  },

  buttonPressed: {
    backgroundColor: colors.glass.backgroundHover,
  },

  input: {
    backgroundColor: colors.glass.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glass.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },

  inputFocused: {
    borderColor: colors.accent.primary,
  },

  listItem: {
    backgroundColor: colors.glass.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.secondary,
  },

  listItemFirst: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  listItemLast: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomWidth: 0,
  },

  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  modal: {
    backgroundColor: colors.background.secondary,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.glass.border,
    overflow: 'hidden',
  },
});

export type GlassStyleName = keyof typeof glassStyles;
