import { StyleSheet } from 'react-native';

import { colors } from './colors';
import { spacing } from './spacing';

export const commonStyles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  flexGrow: {
    flexGrow: 1,
  },

  flexShrink: {
    flexShrink: 1,
  },

  row: {
    flexDirection: 'row',
  },

  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  rowAround: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  column: {
    flexDirection: 'column',
  },

  columnCenter: {
    flexDirection: 'column',
    alignItems: 'center',
  },

  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  alignStart: {
    alignItems: 'flex-start',
  },

  alignEnd: {
    alignItems: 'flex-end',
  },

  alignCenter: {
    alignItems: 'center',
  },

  justifyStart: {
    justifyContent: 'flex-start',
  },

  justifyEnd: {
    justifyContent: 'flex-end',
  },

  justifyCenter: {
    justifyContent: 'center',
  },

  justifyBetween: {
    justifyContent: 'space-between',
  },

  wrap: {
    flexWrap: 'wrap',
  },

  screenContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  screenContent: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },

  screenContentPadded: {
    flex: 1,
    padding: spacing.md,
  },

  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  hidden: {
    display: 'none',
  },

  visible: {
    display: 'flex',
  },

  overflowHidden: {
    overflow: 'hidden',
  },

  gap: {
    gap: spacing.md,
  },

  gapSm: {
    gap: spacing.sm,
  },

  gapLg: {
    gap: spacing.lg,
  },

  gapXs: {
    gap: spacing.xs,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border.primary,
  },

  dividerVertical: {
    width: 1,
    backgroundColor: colors.border.primary,
  },
});

export type CommonStyleName = keyof typeof commonStyles;
