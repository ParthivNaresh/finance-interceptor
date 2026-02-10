import { Pressable, Text, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { useTranslation } from '@/hooks';
import { formatCurrency } from '@/utils/recurring';

import {
  useDriftingCategoryDisplay,
  usePacingDisplay,
  useStabilityDisplay,
  useTargetComparison,
} from './hooks';
import { spendingStabilityCardStyles as styles } from './styles';
import type {
  KickoffStateProps,
  PacingStateProps,
  SpendingStabilityCardProps,
  StabilityStateProps,
} from './types';

function KickoffContent({ targetAmount, currentSpend }: KickoffStateProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.kickoffContainer}>
      <Text style={styles.kickoffEmoji}>🚀</Text>
      <Text style={styles.kickoffTitle}>{t('analytics.stability.kickoff.title')}</Text>
      <Text style={styles.kickoffSubtitle}>
        {t('analytics.stability.kickoff.targetLabel')}{' '}
        <Text style={styles.kickoffHighlight}>{formatCurrency(targetAmount)}</Text>
      </Text>
      <View style={styles.kickoffSpendRow}>
        <Text style={styles.kickoffSpendLabel}>{t('analytics.stability.kickoff.spentSoFar')}</Text>
        <Text style={styles.kickoffSpendValue}>{formatCurrency(currentSpend)}</Text>
      </View>
      <Text style={styles.kickoffNote}>{t('analytics.stability.kickoff.note')}</Text>
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
  const { t } = useTranslation();
  const { statusColor, statusLabel, statusEmoji } = usePacingDisplay(pacingStatus);

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
            {t('analytics.stability.labels.dayProgress', { current: daysIntoMonth, total: totalDaysInMonth })}
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
          <Text style={styles.pacingStatLabel}>{t('analytics.stability.labels.used')}</Text>
          <Text style={styles.pacingStatValue}>{pacingPercentage.toFixed(0)}%</Text>
        </View>
        <View style={styles.pacingStatDivider} />
        <View style={styles.pacingStat}>
          <Text style={styles.pacingStatLabel}>{t('analytics.stability.labels.expected')}</Text>
          <Text style={styles.pacingStatValue}>{expectedPercentage.toFixed(0)}%</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {t('analytics.stability.labels.ofTarget', {
            current: formatCurrency(currentSpend),
            target: formatCurrency(targetAmount),
          })}
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
  const { t } = useTranslation();
  const { statusLabel, statusColor } = useStabilityDisplay(overallSeverity);
  const { statusColor: pacingStatusColor, statusLabel: pacingStatusLabel } = usePacingDisplay(pacingStatus);
  const { formattedChange, changeColor } = useTargetComparison(targetAmount, currentSpend);
  const driftingDisplay = useDriftingCategoryDisplay(topDriftingCategory);

  return (
    <>
      <View style={styles.scoreContainer}>
        <View style={styles.scoreCircle}>
          <Text style={[styles.scoreValue, { color: statusColor }]}>{stabilityScore}%</Text>
          <Text style={styles.scoreLabel}>{t('analytics.stability.labels.stability')}</Text>
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
        <Text style={styles.comparisonLabel}>{t('analytics.stability.labels.vsTarget')}</Text>
        <Text style={[styles.comparisonValue, { color: changeColor }]}>{formattedChange}</Text>
      </View>

      {driftingDisplay && (
        <View style={styles.driftingContainer}>
          <Text style={styles.driftingLabel}>{t('analytics.stability.labels.topDrifting')}</Text>
          <View style={styles.driftingCategory}>
            <Text style={styles.driftingCategoryName}>{driftingDisplay.categoryName}</Text>
            <Text style={[styles.driftingCategoryChange, { color: driftingDisplay.changeColor }]}>
              {driftingDisplay.changeIndicator}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {t('analytics.stability.labels.target')} {formatCurrency(targetAmount)}{t('analytics.stability.labels.perMonth')}
        </Text>
        <Text style={styles.footerText}>
          {t('analytics.stability.labels.current')} {formatCurrency(currentSpend)}{t('analytics.stability.labels.perMonth')}
        </Text>
      </View>
    </>
  );
}

function BuildingContent() {
  const { t } = useTranslation();

  return (
    <View style={styles.buildingContainer}>
      <Text style={styles.buildingTitle}>{t('analytics.stability.building.title')}</Text>
      <Text style={styles.buildingSubtext}>{t('analytics.stability.building.subtitle')}</Text>
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
  const { t } = useTranslation();

  const isKickoff = mode === 'kickoff';
  const isPacing = mode === 'pacing';
  const isStability = mode === 'stability';

  const cardTitle = isKickoff
    ? t('analytics.stability.cardTitle.kickoff')
    : isPacing
      ? t('analytics.stability.cardTitle.pacing')
      : t('analytics.stability.cardTitle.stability');

  const content = (
    <GlassCard variant="elevated" padding="lg" style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{cardTitle}</Text>
        {periodLabel && <Text style={styles.periodLabel}>{periodLabel}</Text>}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('insights.computing')}</Text>
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
          <Text style={styles.noDataText}>{t('analytics.stability.errors.unableToLoad')}</Text>
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
