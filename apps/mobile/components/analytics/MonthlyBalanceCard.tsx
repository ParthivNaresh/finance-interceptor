import { Pressable, Text, View } from 'react-native';

import { GlassCard } from '@/components/glass';

import { useMonthlyBalanceDisplay } from './hooks';
import { monthlyBalanceCardStyles as styles } from './styles';
import type { MonthlyBalanceCardProps } from './types';

export function MonthlyBalanceCard({
  income,
  expenses,
  savingsRate,
  runwayMonths,
  periodLabel,
  isLoading = false,
  onPress,
}: MonthlyBalanceCardProps) {
  const {
    statusLabel,
    statusColor,
    progressRatio,
    savingsRatio,
    formattedIncome,
    formattedExpenses,
    formattedSavingsRate,
    formattedNetFlow,
    formattedRunway,
  } = useMonthlyBalanceDisplay(income, expenses, savingsRate, runwayMonths);

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
              <Text style={[styles.metricValue, styles.incomeValue]}>{formattedIncome}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Expenses</Text>
              <Text style={styles.metricValue}>{formattedExpenses}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Saved</Text>
              <Text style={styles.metricValue}>{formattedSavingsRate}</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressExpenses, { flex: progressRatio }]} />
              <View style={[styles.progressSavings, { flex: savingsRatio }]} />
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusLabel}: {formattedNetFlow}
              </Text>
            </View>
            {formattedRunway !== null && (
              <Text style={styles.runwayText}>Runway: {formattedRunway}</Text>
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
