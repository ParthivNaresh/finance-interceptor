import { StyleSheet } from 'react-native';

import { colors, spacing, typography } from '@/styles';

export const transactionDetailStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    paddingBottom: spacing.xl,
  },
});

export const transactionHeaderStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  merchantName: {
    ...typography.headlineMedium,
    textAlign: 'center',
  },
  amount: {
    ...typography.displayMedium,
    marginTop: spacing.sm,
  },
  income: {
    color: colors.accent.success,
  },
  expense: {
    color: colors.text.primary,
  },
  date: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  pendingBadge: {
    backgroundColor: colors.accent.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: spacing.sm,
  },
  pendingText: {
    ...typography.labelSmall,
    color: colors.background.primary,
  },
});

export const transactionSectionStyles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  title: {
    ...typography.overline,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    padding: spacing.md,
  },
});

export const detailRowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  label: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  value: {
    ...typography.bodyMedium,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing.md,
  },
});

export const transactionLocationStyles = StyleSheet.create({
  text: {
    ...typography.bodyMedium,
    lineHeight: 20,
  },
});

export const transactionWebsiteStyles = StyleSheet.create({
  text: {
    ...typography.bodyMedium,
    color: colors.accent.primary,
  },
});
