import { StyleSheet } from 'react-native';

import { spacing } from '@/styles';

export const headerProfileButtonStyles = StyleSheet.create({
  button: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
});
