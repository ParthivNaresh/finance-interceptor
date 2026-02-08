import { StyleSheet } from 'react-native';

import { colors, spacing, typography } from '@/styles';

export const activityStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background.primary,
  },
  title: {
    ...typography.displaySmall,
  },
  separator: {
    marginVertical: spacing.lg,
    height: 1,
    width: '80%',
    backgroundColor: colors.border.primary,
  },
  placeholder: {
    ...typography.bodyLarge,
    textAlign: 'center',
    color: colors.text.secondary,
  },
});
