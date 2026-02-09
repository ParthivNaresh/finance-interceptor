import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';

import { useTranslation } from '@/hooks';
import { colors, spacing } from '@/styles';
import type {
  CategoryCreepSummary,
  CategorySpendingSummary,
  CreepSeverity,
  MerchantSpendingSummary,
  MerchantStats,
  PacingStatus,
} from '@/types';
import {
  formatCategoryName,
  formatCurrency,
  formatMerchantDateRange,
  getCategoryColor,
  getCategoryIcon,
  getMerchantColor,
  getMerchantInitials,
} from '@/utils';

import type {
  CardVariant,
  CategoryDisplayResult,
  ChangeContext,
  ChangeIndicatorDisplayResult,
  ChartDataPoint,
  ChartMetricsResult,
  DriftingCategoryDisplayResult,
  IndicatorSize,
  IndicatorSizeConfig,
  MerchantDisplayResult,
  MerchantStatsDisplayResult,
  MonthlyBalanceDisplayResult,
  PacingDisplayResult,
  PeriodOption,
  PeriodToggleResult,
  SpendingCardConfig,
  SpendingCardDisplayResult,
  StabilityDisplayResult,
  StabilityStatus,
  TargetComparisonResult,
  TrendAnimationResult,
  TrendDisplayResult,
  TrendMetricsResult,
  ViewMode,
  ViewToggleResult,
} from './types';

export type { ChartDataPoint } from './types';
export { formatCategoryName };

const DAYS_OF_WEEK_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

const SIZE_CONFIG: Record<IndicatorSize, IndicatorSizeConfig> = {
  sm: { fontSize: 11, iconSize: 10, padding: spacing.xs },
  md: { fontSize: 13, iconSize: 12, padding: spacing.sm },
  lg: { fontSize: 15, iconSize: 14, padding: spacing.sm },
};

export function useCategoryDisplay(category: CategorySpendingSummary): CategoryDisplayResult {
  const { t } = useTranslation();

  return useMemo(() => {
    const amount = parseFloat(category.total_amount);
    const percentage = category.percentage_of_total
      ? parseFloat(category.percentage_of_total)
      : null;
    const iconName = getCategoryIcon(category.category_primary);
    const categoryColor = getCategoryColor(category.category_primary);
    const displayName = formatCategoryName(category.category_primary);
    const transactionLabel = t('common.transactions', { count: category.transaction_count });

    return {
      amount,
      percentage,
      iconName,
      categoryColor,
      displayName,
      transactionLabel,
    };
  }, [t, category.total_amount, category.percentage_of_total, category.category_primary, category.transaction_count]);
}

export function useMerchantDisplay(merchant: MerchantSpendingSummary): MerchantDisplayResult {
  const { t } = useTranslation();

  return useMemo(() => {
    const amount = parseFloat(merchant.total_amount);
    const percentage = merchant.percentage_of_total
      ? parseFloat(merchant.percentage_of_total)
      : null;
    const initials = getMerchantInitials(merchant.merchant_name);
    const avatarColor = getMerchantColor(merchant.merchant_name);
    const transactionLabel = t('common.transactions', { count: merchant.transaction_count });

    return {
      amount,
      percentage,
      initials,
      avatarColor,
      transactionLabel,
    };
  }, [t, merchant.total_amount, merchant.percentage_of_total, merchant.merchant_name, merchant.transaction_count]);
}

export function useSpendingCardDisplay(
  variant: CardVariant,
  amount: number,
  transactionCount?: number
): SpendingCardDisplayResult {
  const { t } = useTranslation();

  return useMemo(() => {
    const title = t(`analytics.cardVariant.${variant}` as const);
    const config: SpendingCardConfig = {
      title,
      accentColor: variant === 'spending'
        ? colors.accent.error
        : variant === 'income'
          ? colors.accent.success
          : colors.accent.primary,
      changeContext: variant === 'spending' ? 'spending' : 'income',
    };
    const isPositive = amount >= 0;
    const displayAmount = variant === 'netFlow' ? amount : Math.abs(amount);
    const prefix = variant === 'netFlow' && isPositive ? '+' : '';
    const formattedAmount = `${prefix}${formatCurrency(displayAmount)}`;
    const amountColor = variant === 'netFlow'
      ? (isPositive ? colors.accent.success : colors.accent.error)
      : null;
    const transactionLabel = transactionCount !== undefined
      ? t('common.transactions', { count: transactionCount })
      : null;

    return {
      config,
      isPositive,
      displayAmount,
      formattedAmount,
      amountColor,
      transactionLabel,
    };
  }, [t, variant, amount, transactionCount]);
}

export function useTrendDisplay(changePercentage: number | null): TrendDisplayResult {
  return useMemo(() => {
    const direction =
      changePercentage === null || Math.abs(changePercentage) < 1
        ? 'stable'
        : changePercentage > 0
          ? 'up'
          : 'down';

    const trendColor =
      direction === 'up'
        ? colors.accent.error
        : direction === 'down'
          ? colors.accent.success
          : colors.text.muted;

    const trendIcon: 'arrow-up' | 'arrow-down' | 'minus' =
      direction === 'up' ? 'arrow-up' : direction === 'down' ? 'arrow-down' : 'minus';

    const changeText =
      changePercentage !== null
        ? `${changePercentage > 0 ? '+' : ''}${changePercentage.toFixed(1)}%`
        : '0.0%';

    return {
      direction,
      trendColor,
      trendIcon,
      changeText,
    };
  }, [changePercentage]);
}

export function useTrendAnimation(
  average: number,
  changePercentage: number | null,
  animated: boolean
): TrendAnimationResult {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (animated) {
      fadeAnim.setValue(0);
      slideAnim.setValue(10);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          delay: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          delay: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(1);
      slideAnim.setValue(0);
    }
  }, [average, changePercentage, animated, fadeAnim, slideAnim]);

  return { fadeAnim, slideAnim };
}

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

export function useMonthlyBalanceDisplay(
  income: number,
  expenses: number,
  savingsRate: number | null,
  runwayMonths: number | null
): MonthlyBalanceDisplayResult {
  const { t } = useTranslation();

  return useMemo(() => {
    const netFlow = income - expenses;

    const status = netFlow > 0 ? 'surplus' : netFlow < 0 ? 'deficit' : 'neutral';

    const statusLabel =
      status === 'surplus'
        ? t('analytics.balance.surplus')
        : status === 'deficit'
          ? t('analytics.balance.bufferUsed')
          : t('analytics.balance.balanced');

    const statusColor =
      status === 'surplus'
        ? colors.accent.success
        : status === 'deficit'
          ? colors.accent.error
          : colors.text.secondary;

    const progressRatio = income > 0 ? Math.min(expenses / income, 1) : expenses > 0 ? 1 : 0;
    const savingsRatio = income > 0 ? Math.max(0, 1 - progressRatio) : 0;

    const formattedIncome = `+${formatCurrency(income)}`;
    const formattedExpenses = formatCurrency(expenses);
    const formattedSavingsRate = savingsRate === null ? '--' : `${Math.round(savingsRate)}%`;
    const formattedNetFlow = `${netFlow >= 0 ? '+' : ''}${formatCurrency(netFlow)}`;

    let formattedRunway: string | null = null;
    if (runwayMonths !== null) {
      if (runwayMonths >= 12) {
        const years = Math.floor(runwayMonths / 12);
        const remainingMonths = Math.round(runwayMonths % 12);
        formattedRunway = remainingMonths === 0 ? `${years}y` : `${years}y ${remainingMonths}mo`;
      } else {
        formattedRunway = `${runwayMonths.toFixed(1)} mo`;
      }
    }

    return {
      netFlow,
      status,
      statusLabel,
      statusColor,
      progressRatio,
      savingsRatio,
      formattedIncome,
      formattedExpenses,
      formattedSavingsRate,
      formattedNetFlow,
      formattedRunway,
    };
  }, [t, income, expenses, savingsRate, runwayMonths]);
}

export function useChartMetrics(data: ChartDataPoint[]): ChartMetricsResult {
  return useMemo(() => {
    if (data.length === 0) {
      return { maxValue: 100, average: 0 };
    }

    const values = data.map((d) => d.value);
    const max = Math.max(...values);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;

    const paddedMax = max * 1.15;
    const roundedMax = Math.ceil(paddedMax / 100) * 100 || 100;

    return { maxValue: roundedMax, average: avg };
  }, [data]);
}

export function useTrendMetrics(data: ChartDataPoint[]): TrendMetricsResult {
  return useMemo(() => {
    if (data.length === 0) {
      return { average: 0, changePercentage: null };
    }

    const values = data.map((d) => d.value);
    const average = values.reduce((sum, v) => sum + v, 0) / values.length;

    if (data.length < 2) {
      return { average, changePercentage: null };
    }

    const midpoint = Math.floor(data.length / 2);
    const recentValues = values.slice(midpoint);
    const olderValues = values.slice(0, midpoint);

    const recentAvg = recentValues.reduce((sum, v) => sum + v, 0) / recentValues.length;
    const olderAvg = olderValues.reduce((sum, v) => sum + v, 0) / olderValues.length;

    const changePercentage = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : null;

    return { average, changePercentage };
  }, [data]);
}

export function usePeriodToggle(
  initialPeriod: PeriodOption,
  onPeriodChange?: (months: PeriodOption) => void
): PeriodToggleResult {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>(initialPeriod);

  const handlePeriodChange = useCallback(
    (period: PeriodOption) => {
      setSelectedPeriod(period);
      onPeriodChange?.(period);
    },
    [onPeriodChange]
  );

  return { selectedPeriod, handlePeriodChange };
}

export function useViewToggle(initialMode: ViewMode = 'breakdown'): ViewToggleResult {
  const [viewMode, setViewMode] = useState<ViewMode>(initialMode);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  return { viewMode, handleViewModeChange };
}

export function useMerchantStatsDisplay(merchant: MerchantStats): MerchantStatsDisplayResult {
  const { t } = useTranslation();

  return useMemo(() => {
    const lifetimeSpend = parseFloat(merchant.total_lifetime_spend);
    const avgTransaction = merchant.average_transaction_amount
      ? parseFloat(merchant.average_transaction_amount)
      : null;
    const initials = getMerchantInitials(merchant.merchant_name);
    const avatarColor = getMerchantColor(merchant.merchant_name);
    const dateRange = formatMerchantDateRange(
      merchant.first_transaction_date,
      merchant.last_transaction_date
    );

    const dayOfWeekIndex = merchant.most_frequent_day_of_week;
    const dayOfWeek = dayOfWeekIndex !== null && dayOfWeekIndex >= 0 && dayOfWeekIndex < 7
      ? t(`daysOfWeek.${DAYS_OF_WEEK_KEYS[dayOfWeekIndex]}` as const)
      : null;

    const formattedLifetimeSpend = formatCurrency(lifetimeSpend);
    const formattedAvgTransaction = avgTransaction !== null ? formatCurrency(avgTransaction) : null;
    const formattedCategory = merchant.primary_category
      ? formatCategoryName(merchant.primary_category)
      : null;
    const formattedFrequency = merchant.average_days_between_transactions
      ? t('analytics.merchant.every', { days: Math.round(parseFloat(merchant.average_days_between_transactions)) })
      : null;
    const formattedMedian = merchant.median_transaction_amount
      ? formatCurrency(parseFloat(merchant.median_transaction_amount))
      : null;

    return {
      lifetimeSpend,
      avgTransaction,
      initials,
      avatarColor,
      dateRange,
      dayOfWeek,
      formattedLifetimeSpend,
      formattedAvgTransaction,
      formattedCategory,
      formattedFrequency,
      formattedMedian,
    };
  }, [
    t,
    merchant.total_lifetime_spend,
    merchant.average_transaction_amount,
    merchant.merchant_name,
    merchant.first_transaction_date,
    merchant.last_transaction_date,
    merchant.most_frequent_day_of_week,
    merchant.primary_category,
    merchant.average_days_between_transactions,
    merchant.median_transaction_amount,
  ]);
}

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
    let status: StabilityStatus;
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
