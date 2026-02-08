import { StyleSheet } from 'react-native';

import { colors, spacing, typography } from '@/styles';

export const connectStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background.primary,
  },
  title: {
    ...typography.displaySmall,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyLarge,
    textAlign: 'center',
    marginTop: spacing.sm,
    color: colors.text.secondary,
  },
  separator: {
    marginVertical: spacing.lg,
    height: 1,
    width: '80%',
    backgroundColor: colors.border.primary,
  },
  centerContent: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  statusText: {
    ...typography.bodyMedium,
    marginTop: spacing.sm,
    color: colors.text.secondary,
  },
  errorText: {
    ...typography.bodyMedium,
    color: colors.accent.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  linkButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginTop: spacing.xl,
  },
  retryButton: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  buttonText: {
    ...typography.button,
    color: colors.background.primary,
  },
});
