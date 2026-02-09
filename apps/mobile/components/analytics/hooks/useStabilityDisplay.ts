import { useMemo } from 'react';

import { useTranslation } from '@/hooks';
import { colors } from '@/styles';
import type { CategoryCreepSummary, CreepSeverity, PacingStatus } from '@/types';
import { formatCategoryName } from '@/utils';

import type { DriftingCategoryDisplayResult, PacingDisplayResult, StabilityDisplayResult, TargetComparisonResult } from '../types';

export function usePacingDisplay(pacingStatus: PacingStatus): PacingDisplayResult {
  const { t } = useTranslation();

  return useMemo(() => {
    let statusColor: string;
    let statusLabel: string;
    let statusEmoji: string;

    switch (pacingStatus) {
      case 'behind':
        statusColor = colors.accent.success;
        statusLabel = t('analytics.stability.pacing.behind');
        statusEmoji = '✓';
        break;
      case 'on_track':
        statusColor = '#2DD4BF';
        statusLabel = t('analytics.stability.pacing.onTrack');
        statusEmoji = '→';
        break;
      case 'ahead':
        statusColor = colors.accent.warning;
        statusLabel = t('analytics.stability.pacing.ahead');
        statusEmoji = '!';
        break;
    }

    return { statusColor, statusLabel, statusEmoji };
  }, [t, pacingStatus]);
}

export function useStabilityDisplay(severity: CreepSeverity): StabilityDisplayResult {
  const { t } = useTranslation();

  return useMemo(() => {
    let status: 'excellent' | 'good' | 'caution' | 'alert';
    let statusLabel: string;
    let statusColor: string;

    switch (severity) {
      case 'none':
        status = 'excellent';
        statusLabel = t('analytics.stability.status.excellent');
        statusColor = colors.accent.success;
        break;
      case 'low':
        status = 'good';
        statusLabel = t('analytics.stability.status.good');
        statusColor = '#2DD4BF';
        break;
      case 'medium':
        status = 'caution';
        statusLabel = t('analytics.stability.status.caution');
        statusColor = colors.accent.warning;
        break;
      case 'high':
        status = 'alert';
        statusLabel = t('analytics.stability.status.alert');
        statusColor = colors.accent.error;
        break;
    }

    return { status, statusLabel, statusColor };
  }, [t, severity]);
}

export function useDriftingCategoryDisplay(
  category: CategoryCreepSummary | null
): DriftingCategoryDisplayResult | null {
  return useMemo(() => {
    if (!category) return null;

    const percentageChange = parseFloat(category.percentage_change);
    const categoryName = formatCategoryName(category.category_primary);
    const sign = percentageChange >= 0 ? '↑' : '↓';
    const changeIndicator = `${sign} ${Math.abs(percentageChange).toFixed(0)}%`;
    const changeColor = percentageChange >= 0 ? colors.accent.error : colors.accent.success;

    return { categoryName, changeIndicator, changeColor };
  }, [category]);
}

export function useTargetComparison(
  targetAmount: number,
  currentSpend: number
): TargetComparisonResult {
  return useMemo(() => {
    const changeFromTarget = targetAmount > 0
      ? ((currentSpend - targetAmount) / targetAmount) * 100
      : 0;
    const formattedChange = `${changeFromTarget >= 0 ? '+' : ''}${changeFromTarget.toFixed(1)}%`;
    const changeColor = changeFromTarget <= 0 ? colors.accent.success : colors.accent.error;

    return { changeFromTarget, formattedChange, changeColor };
  }, [targetAmount, currentSpend]);
}
