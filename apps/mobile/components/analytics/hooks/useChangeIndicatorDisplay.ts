import { useMemo } from 'react';

import { useTranslation } from '@/hooks';
import { colors, spacing } from '@/styles';

import type { ChangeContext, ChangeIndicatorDisplayResult, IndicatorSize, IndicatorSizeConfig } from '../types';

const SIZE_CONFIG: Record<IndicatorSize, IndicatorSizeConfig> = {
  sm: { fontSize: 11, iconSize: 10, padding: spacing.xs },
  md: { fontSize: 13, iconSize: 12, padding: spacing.sm },
  lg: { fontSize: 15, iconSize: 14, padding: spacing.sm },
};

export function useChangeIndicatorDisplay(
  value: number | null,
  context: ChangeContext,
  size: IndicatorSize,
  label?: string
): ChangeIndicatorDisplayResult {
  const { t } = useTranslation();

  return useMemo(() => {
    const direction =
      value === null || value === 0 ? 'neutral' : value > 0 ? 'increase' : 'decrease';

    let textColor: string;
    let backgroundColor: string;

    if (direction === 'neutral') {
      textColor = colors.text.muted;
      backgroundColor = 'rgba(115, 115, 115, 0.15)';
    } else if (context === 'spending') {
      textColor = direction === 'increase' ? colors.accent.error : colors.accent.success;
      backgroundColor = direction === 'increase' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)';
    } else {
      textColor = direction === 'increase' ? colors.accent.success : colors.accent.error;
      backgroundColor = direction === 'increase' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)';
    }

    const iconName: 'arrow-up' | 'arrow-down' | 'minus' =
      direction === 'neutral' ? 'minus' : direction === 'increase' ? 'arrow-up' : 'arrow-down';

    const formattedValue = value !== null ? `${value >= 0 ? '+' : ''}${value.toFixed(1)}%` : '—';
    const displayLabel = label ?? (direction === 'neutral' ? t('common.noChange') : t('common.vsLastMonth'));
    const sizeConfig = SIZE_CONFIG[size];

    return {
      direction,
      textColor,
      backgroundColor,
      iconName,
      formattedValue,
      displayLabel,
      sizeConfig,
    };
  }, [t, value, context, size, label]);
}
