import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import type { CategoryCreepSummary, CreepSeverity, PacingMode, PacingStatus } from '@/types';
import { colors, spacing, typography } from '@/styles';
import { formatCurrency } from '@/utils/recurring';

type StabilityStatus = 'excellent' | 'good' | 'caution' | 'alert';

interface KickoffStateProps {
  targetAmount: number;
  currentSpend: number;
}

interface PacingStateProps {
  targetAmount: number;
  currentSpend: number;
  pacingPercentage: number;
  expectedPercentage: number;
  pacingStatus: PacingStatus;
  daysIntoMonth: number;
  totalDaysInMonth: number;
}

interface StabilityStateProps {
  stabilityScore: number;
  overallSeverity: CreepSeverity;
  targetAmount: number;
  currentSpend: number;
  pacingPercentage: number;
  expectedPercentage: number;
  pacingStatus: PacingStatus;
  topDriftingCategory: CategoryCreepSummary | null;
}

interface SpendingStabilityCardProps {
  mode: PacingMode;
  kickoffState?: KickoffStateProps;
  pacingState?: PacingStateProps;
  stabilityState?: StabilityStateProps;
  periodLabel?: string;
  isLoading?: boolean;
  hasTarget?: boolean;
  onPress?: () => void;
}

function getStabilityStatus(severity: CreepSeverity): StabilityStatus {
  switch (severity) {
    case 'none':
      return 'excellent';
    case 'low':
      return 'good';
    case 'medium':
      return 'caution';
    case 'high':
      return 'alert';
  }
}

function getStatusLabel(status: StabilityStatus): string {
  switch (status) {
    case 'excellent':
      return 'Excellent';
    case 'good':
      return 'Good';
    case 'caution':
      return 'Caution';
    case 'alert':
      return 'Alert';
  }
}

function getStatusColor(status: StabilityStatus): string {
  switch (status) {
    case 'excellent':
      return colors.accent.success;
    case 'good':
      return '#2DD4BF';
    case 'caution':
      return colors.accent.warning;
    case 'alert':
      return colors.accent.error;
  }
}

function getPacingStatusLabel(status: PacingStatus): string {
  switch (status) {
    case 'behind':
      return 'Spending slower than usual';
    case 'on_track':
      return 'On pace with your target';
    case 'ahead':
      return 'Spending faster than usual';
  }
}

function getPacingStatusColor(status: PacingStatus): string {
  switch (status) {
    case 'behind':
      return colors.accent.success;
    case 'on_track':
      return '#2DD4BF';
    case 'ahead':
      return colors.accent.warning;
  }
}

function getPacingStatusEmoji(status: PacingStatus): string {
  switch (status) {
    case 'behind':
      return '✓';
    case 'on_track':
      return '→';
    case 'ahead':
      return '!';
  }
}

function formatCategoryName(name: string): string {
  return name
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function formatChangeIndicator(percentageChange: number): string {
  const sign = percentageChange >= 0 ? '↑' : '↓';
  return `${sign} ${Math.abs(percentageChange).toFixed(0)}%`;
}

function KickoffContent({ targetAmount, currentSpend }: KickoffStateProps) {
  return (
    <View style={styles.kickoffContainer}>
      <Text style={styles.kickoffEmoji}>🚀</Text>
      <Text style={styles.kickoffTitle}>New month!</Text>
      <Text style={styles.kickoffSubtitle}>
        Your target is{' '}
        <Text style={styles.kickoffHighlight}>{formatCurrency(targetAmount)}</Text>
      </Text>
      <View style={styles.kickoffSpendRow}>
        <Text style={styles.kickoffSpendLabel}>Spent so far:</Text>
        <Text style={styles.kickoffSpendValue}>{formatCurrency(currentSpend)}</Text>
      </View>
      <Text style={styles.kickoffNote}>
        {"We'll start tracking your pacing in a few days."}
      </Text>
    </View>
  );
}

function PacingContent({
  targetAmount,
  currentSpend,
  pacingPercentage,
  expectedPercentage,
  pacingStatus,
  daysIntoMonth,
  totalDaysInMonth,
}: PacingStateProps) {
  const statusColor = getPacingStatusColor(pacingStatus);
  const statusLabel = getPacingStatusLabel(pacingStatus);
  const statusEmoji = getPacingStatusEmoji(pacingStatus);

  return (
    <View style={styles.pacingContainer}>
      <View style={styles.progressSection}>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(100, pacingPercentage)}%`,
                  backgroundColor: statusColor,
                },
              ]}
            />
            <View
              style={[
                styles.todayMarker,
                { left: `${Math.min(100, expectedPercentage)}%` },
              ]}
            />
          </View>
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabelLeft}>$0</Text>
          <Text style={styles.progressLabelCenter}>
            Day {daysIntoMonth} of {totalDaysInMonth}
          </Text>
          <Text style={styles.progressLabelRight}>{formatCurrency(targetAmount)}</Text>
        </View>
      </View>

      <View style={[styles.statusBadgeLarge, { backgroundColor: `${statusColor}20` }]}>
        <Text style={[styles.statusEmoji, { color: statusColor }]}>{statusEmoji}</Text>
        <Text style={[styles.statusLabelLarge, { color: statusColor }]}>{statusLabel}</Text>
      </View>

      <View style={styles.pacingStats}>
        <View style={styles.pacingStat}>
          <Text style={styles.pacingStatLabel}>Used</Text>
          <Text style={styles.pacingStatValue}>{pacingPercentage.toFixed(0)}%</Text>
        </View>
        <View style={styles.pacingStatDivider} />
        <View style={styles.pacingStat}>
          <Text style={styles.pacingStatLabel}>Expected</Text>
          <Text style={styles.pacingStatValue}>{expectedPercentage.toFixed(0)}%</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {formatCurrency(currentSpend)} of {formatCurrency(targetAmount)} target
        </Text>
      </View>
    </View>
  );
}

function StabilityContent({
  stabilityScore,
  overallSeverity,
  targetAmount,
  currentSpend,
  pacingPercentage,
  expectedPercentage,
  pacingStatus,
  topDriftingCategory,
}: StabilityStateProps) {
  const status = getStabilityStatus(overallSeverity);
  const statusLabel = getStatusLabel(status);
  const statusColor = getStatusColor(status);
  const pacingStatusColor = getPacingStatusColor(pacingStatus);
  const pacingStatusLabel = getPacingStatusLabel(pacingStatus);

  const changeFromTarget =
    targetAmount > 0 ? ((currentSpend - targetAmount) / targetAmount) * 100 : 0;

  return (
    <>
      <View style={styles.scoreContainer}>
        <View style={styles.scoreCircle}>
          <Text style={[styles.scoreValue, { color: statusColor }]}>{stabilityScore}%</Text>
          <Text style={styles.scoreLabel}>Stability</Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.miniProgressSection}>
        <View style={styles.miniProgressBar}>
          <View
            style={[
              styles.miniProgressFill,
              {
                width: pacingPercentage > 0 ? `${Math.min(100, pacingPercentage)}%` : 4,
                backgroundColor: pacingStatusColor,
              },
            ]}
          />
          <View
            style={[
              styles.miniTodayMarker,
              { left: `${Math.min(100, expectedPercentage)}%` },
            ]}
          />
        </View>
        <Text style={[styles.pacingInsight, { color: pacingStatusColor }]}>
          {pacingStatusLabel}
        </Text>
      </View>

      <View style={styles.comparisonContainer}>
        <Text style={styles.comparisonLabel}>vs Your Target</Text>
        <Text
          style={[
            styles.comparisonValue,
            { color: changeFromTarget <= 0 ? colors.accent.success : colors.accent.error },
          ]}
        >
          {changeFromTarget >= 0 ? '+' : ''}
          {changeFromTarget.toFixed(1)}%
        </Text>
      </View>

      {topDriftingCategory && (
        <View style={styles.driftingContainer}>
          <Text style={styles.driftingLabel}>Top drifting category</Text>
          <View style={styles.driftingCategory}>
            <Text style={styles.driftingCategoryName}>
              {formatCategoryName(topDriftingCategory.category_primary)}
            </Text>
            <Text
              style={[
                styles.driftingCategoryChange,
                {
                  color:
                    parseFloat(topDriftingCategory.percentage_change) >= 0
                      ? colors.accent.error
                      : colors.accent.success,
                },
              ]}
            >
              {formatChangeIndicator(parseFloat(topDriftingCategory.percentage_change))}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Target: {formatCurrency(targetAmount)}/mo</Text>
        <Text style={styles.footerText}>Current: {formatCurrency(currentSpend)}/mo</Text>
      </View>
    </>
  );
}

function BuildingContent() {
  return (
    <View style={styles.buildingContainer}>
      <Text style={styles.buildingTitle}>Building your target...</Text>
      <Text style={styles.buildingSubtext}>
        We need at least 3 months of spending data to establish your target.
      </Text>
    </View>
  );
}

export function SpendingStabilityCard({
  mode,
  kickoffState,
  pacingState,
  stabilityState,
  periodLabel,
  isLoading = false,
  hasTarget = true,
  onPress,
}: SpendingStabilityCardProps) {
  const isKickoff = mode === 'kickoff';
  const isPacing = mode === 'pacing';
  const isStability = mode === 'stability';

  const cardTitle = isKickoff
    ? 'MONTH KICKOFF'
    : isPacing
      ? 'SPENDING PROGRESS'
      : 'SPENDING STABILITY';

  const content = (
    <GlassCard variant="elevated" padding="lg" style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{cardTitle}</Text>
        {periodLabel && <Text style={styles.periodLabel}>{periodLabel}</Text>}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Analyzing spending...</Text>
        </View>
      ) : !hasTarget ? (
        <BuildingContent />
      ) : isKickoff && kickoffState ? (
        <KickoffContent
          targetAmount={kickoffState.targetAmount}
          currentSpend={kickoffState.currentSpend}
        />
      ) : isPacing && pacingState ? (
        <PacingContent
          targetAmount={pacingState.targetAmount}
          currentSpend={pacingState.currentSpend}
          pacingPercentage={pacingState.pacingPercentage}
          expectedPercentage={pacingState.expectedPercentage}
          pacingStatus={pacingState.pacingStatus}
          daysIntoMonth={pacingState.daysIntoMonth}
          totalDaysInMonth={pacingState.totalDaysInMonth}
        />
      ) : isStability && stabilityState ? (
        <StabilityContent
          stabilityScore={stabilityState.stabilityScore}
          overallSeverity={stabilityState.overallSeverity}
          targetAmount={stabilityState.targetAmount}
          currentSpend={stabilityState.currentSpend}
          pacingPercentage={stabilityState.pacingPercentage}
          expectedPercentage={stabilityState.expectedPercentage}
          pacingStatus={stabilityState.pacingStatus}
          topDriftingCategory={stabilityState.topDriftingCategory}
        />
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>Unable to load stability data</Text>
        </View>
      )}
    </GlassCard>
  );

  if (onPress && isStability && !isLoading) {
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
  noDataContainer: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  noDataText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  buildingContainer: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buildingTitle: {
    ...typography.titleSmall,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  buildingSubtext: {
    ...typography.bodySmall,
    color: colors.text.muted,
    textAlign: 'center',
  },
  kickoffContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  kickoffEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  kickoffTitle: {
    ...typography.headlineSmall,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  kickoffSubtitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  kickoffHighlight: {
    color: colors.accent.primary,
    fontWeight: '600',
  },
  kickoffSpendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.tertiary,
    borderRadius: 8,
  },
  kickoffSpendLabel: {
    ...typography.bodySmall,
    color: colors.text.muted,
  },
  kickoffSpendValue: {
    ...typography.titleSmall,
    color: colors.text.primary,
    fontWeight: '600',
  },
  kickoffNote: {
    ...typography.bodySmall,
    color: colors.text.muted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  pacingContainer: {
    paddingVertical: spacing.xs,
  },
  progressSection: {
    marginBottom: spacing.md,
  },
  progressBarContainer: {
    marginBottom: spacing.xs,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: colors.background.tertiary,
    borderRadius: 6,
    overflow: 'visible',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  todayMarker: {
    position: 'absolute',
    top: -4,
    width: 2,
    height: 20,
    backgroundColor: colors.text.primary,
    marginLeft: -1,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  progressLabelLeft: {
    ...typography.labelSmall,
    color: colors.text.muted,
  },
  progressLabelCenter: {
    ...typography.labelSmall,
    color: colors.text.secondary,
  },
  progressLabelRight: {
    ...typography.labelSmall,
    color: colors.text.muted,
  },
  statusBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  statusEmoji: {
    ...typography.titleMedium,
    fontWeight: '700',
  },
  statusLabelLarge: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
  pacingStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  pacingStat: {
    flex: 1,
    alignItems: 'center',
  },
  pacingStatLabel: {
    ...typography.labelSmall,
    color: colors.text.muted,
    marginBottom: 2,
  },
  pacingStatValue: {
    ...typography.titleMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  pacingStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border.secondary,
  },
  miniProgressSection: {
    marginBottom: spacing.md,
  },
  miniProgressBar: {
    height: 6,
    backgroundColor: colors.background.tertiary,
    borderRadius: 3,
    overflow: 'visible',
    position: 'relative',
    marginBottom: spacing.xs,
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  miniTodayMarker: {
    position: 'absolute',
    top: -2,
    width: 2,
    height: 10,
    backgroundColor: colors.text.primary,
    marginLeft: -1,
  },
  pacingInsight: {
    ...typography.labelSmall,
    textAlign: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  scoreCircle: {
    alignItems: 'center',
  },
  scoreValue: {
    ...typography.displaySmall,
    fontWeight: '700',
  },
  scoreLabel: {
    ...typography.labelSmall,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...typography.labelMedium,
    fontWeight: '600',
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.tertiary,
    borderRadius: 8,
  },
  comparisonLabel: {
    ...typography.bodySmall,
    color: colors.text.muted,
  },
  comparisonValue: {
    ...typography.titleSmall,
    fontWeight: '600',
  },
  driftingContainer: {
    marginBottom: spacing.md,
  },
  driftingLabel: {
    ...typography.labelSmall,
    color: colors.text.muted,
    marginBottom: spacing.xs,
  },
  driftingCategory: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background.tertiary,
    borderRadius: 8,
  },
  driftingCategoryName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  driftingCategoryChange: {
    ...typography.titleSmall,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.secondary,
  },
  footerText: {
    ...typography.bodySmall,
    color: colors.text.muted,
  },
  pressed: {
    opacity: 0.8,
  },
});
