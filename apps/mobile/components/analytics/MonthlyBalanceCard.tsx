import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { colors, spacing, typography } from '@/styles';
import { formatCurrency } from '@/utils/recurring';

type BalanceStatus = 'surplus' | 'deficit' | 'neutral';

interface MonthlyBalanceCardProps {
  income: number;
  expenses: number;
  savingsRate: number | null;
  runwayMonths: number | null;
  periodLabel?: string;
  isLoading?: boolean;
  onPress?: () => void;
}

function getBalanceStatus(income: number, expenses: number): BalanceStatus {
  const netFlow = income - expenses;
  if (netFlow > 0) return 'surplus';
  if (netFlow < 0) return 'deficit';
  return 'neutral';
}

function getStatusLabel(status: BalanceStatus): string {
  switch (status) {
    case 'surplus':
      return 'Surplus';
    case 'deficit':
      return 'Buffer Used';
    case 'neutral':
      return 'Balanced';
  }
}

function getStatusColor(status: BalanceStatus): string {
  switch (status) {
    case 'surplus':
      return colors.accent.success;
    case 'deficit':
      return colors.accent.error;
    case 'neutral':
      return colors.text.secondary;
  }
}

function formatSavingsRate(rate: number | null): string {
  if (rate === null) return '--';
  const rounded = Math.round(rate);
  return `${rounded}%`;
}

function formatRunway(months: number | null): string {
  if (months === null) return '--';
  if (months >= 12) {
    const years = Math.floor(months / 12);
    const remainingMonths = Math.round(months % 12);
    if (remainingMonths === 0) {
      return `${years}y`;
    }
    return `${years}y ${remainingMonths}mo`;
  }
  return `${months.toFixed(1)} mo`;
}

export function MonthlyBalanceCard({
  income,
  expenses,
  savingsRate,
  runwayMonths,
  periodLabel,
  isLoading = false,
  onPress,
}: MonthlyBalanceCardProps) {
  const netFlow = income - expenses;
  const status = getBalanceStatus(income, expenses);
  const statusLabel = getStatusLabel(status);
  const statusColor = getStatusColor(status);

  const progressRatio = income > 0 ? Math.min(expenses / income, 1) : expenses > 0 ? 1 : 0;
  const savingsRatio = income > 0 ? Math.max(0, 1 - progressRatio) : 0;

  const content = (
    <GlassCard variant="elevated" padding="lg" style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>This Month</Text>
        {periodLabel && <Text style={styles.periodLabel}>{periodLabel}</Text>}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <>
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Income</Text>
              <Text style={[styles.metricValue, styles.incomeValue]}>
                +{formatCurrency(income)}
              </Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Expenses</Text>
              <Text style={styles.metricValue}>{formatCurrency(expenses)}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Saved</Text>
              <Text style={styles.metricValue}>{formatSavingsRate(savingsRate)}</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressExpenses,
                  { flex: progressRatio },
                ]}
              />
              <View
                style={[
                  styles.progressSavings,
                  { flex: savingsRatio },
                ]}
              />
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusLabel}: {netFlow >= 0 ? '+' : ''}{formatCurrency(netFlow)}
              </Text>
            </View>
            {runwayMonths !== null && (
              <Text style={styles.runwayText}>
                Runway: {formatRunway(runwayMonths)}
              </Text>
            )}
          </View>
        </>
      )}
    </GlassCard>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.labelMedium,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  periodLabel: {
    ...typography.bodySmall,
    color: colors.text.muted,
  },
  loadingContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border.secondary,
  },
  metricLabel: {
    ...typography.labelSmall,
    color: colors.text.muted,
    marginBottom: spacing.xs,
  },
  metricValue: {
    ...typography.titleMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  incomeValue: {
    color: colors.accent.success,
  },
  progressContainer: {
    marginBottom: spacing.md,
  },
  progressBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.background.tertiary,
    overflow: 'hidden',
  },
  progressExpenses: {
    backgroundColor: colors.accent.error,
    opacity: 0.7,
  },
  progressSavings: {
    backgroundColor: colors.accent.success,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
  runwayText: {
    ...typography.bodySmall,
    color: colors.text.muted,
  },
  pressed: {
    opacity: 0.8,
  },
});
