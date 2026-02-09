import type FontAwesome from '@expo/vector-icons/FontAwesome';
import type { Animated } from 'react-native';

import type {
  CategoryCreepSummary,
  CategorySpendingSummary,
  CreepSeverity,
  MerchantSpendingSummary,
  MerchantStats,
  PacingMode,
  PacingStatus,
} from '@/types';

export type FontAwesomeIconName = React.ComponentProps<typeof FontAwesome>['name'];

export type CardVariant = 'spending' | 'income' | 'netFlow';

export type ChangeContext = 'spending' | 'income';

export type IndicatorSize = 'sm' | 'md' | 'lg';

export type TrendDirection = 'up' | 'down' | 'stable';

export type ChangeDirection = 'increase' | 'decrease' | 'neutral';

export type BalanceStatus = 'surplus' | 'deficit' | 'neutral';

export type TimeRange = 'week' | 'month' | 'year' | 'all';

export type PeriodOption = 6 | 12;

export type ViewMode = 'breakdown' | 'trend';

export type StabilityStatus = 'excellent' | 'good' | 'caution' | 'alert';

export interface ChartDataPoint {
  label: string;
  value: number;
  date?: string;
}

export interface SubcategoryDataPoint {
  name: string;
  value: number;
  percentage: number;
  transactionCount: number;
}

export interface TimeRangeOption {
  value: TimeRange;
  label: string;
}

export interface CategoryItemProps {
  category: CategorySpendingSummary;
  onPress?: (category: CategorySpendingSummary) => void;
}

export interface MerchantItemProps {
  merchant: MerchantSpendingSummary;
  rank?: number;
  onPress?: (merchant: MerchantSpendingSummary) => void;
}

export interface SpendingCardProps {
  variant?: CardVariant;
  amount: number;
  changePercentage: number | null;
  transactionCount?: number;
  periodLabel?: string;
}

export interface TrendSummaryProps {
  average: number;
  changePercentage: number | null;
  periodLabel?: string;
  formatValue?: (value: number) => string;
  animated?: boolean;
}

export interface ChangeIndicatorProps {
  value: number | null;
  context?: ChangeContext;
  size?: IndicatorSize;
  showIcon?: boolean;
  showLabel?: boolean;
  label?: string;
}

export interface MonthlyBalanceCardProps {
  income: number;
  expenses: number;
  savingsRate: number | null;
  runwayMonths: number | null;
  periodLabel?: string;
  isLoading?: boolean;
  onPress?: () => void;
}

export interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export interface SpendingBarChartProps {
  data: ChartDataPoint[];
  height?: number;
  barColor?: string;
  onBarPress?: (item: ChartDataPoint, index: number) => void;
  showAverage?: boolean;
  showTopLabels?: boolean;
  formatValue?: (value: number) => string;
  animated?: boolean;
}

export interface SubcategoryChartProps {
  data: SubcategoryDataPoint[];
  categoryColor?: string;
  onItemPress?: (item: SubcategoryDataPoint, index: number) => void;
  maxItems?: number;
  formatValue?: (value: number) => string;
  animated?: boolean;
}

export interface MerchantStatsCardProps {
  merchant: MerchantStats;
  rank?: number;
  onPress?: (merchant: MerchantStats) => void;
  showDetails?: boolean;
}

export interface SpendingTrendCardProps {
  title?: string;
  data: ChartDataPoint[];
  isLoading?: boolean;
  error?: string | null;
  barColor?: string;
  onBarPress?: (item: ChartDataPoint, index: number) => void;
  onPeriodChange?: (months: PeriodOption) => void;
  initialPeriod?: PeriodOption;
  showTopLabels?: boolean;
  showAverage?: boolean;
  chartHeight?: number;
}

export interface TimeRangeSelectorProps {
  selected: TimeRange;
  onSelect: (range: TimeRange) => void;
  compact?: boolean;
}

export interface SubcategoryTrendCardProps {
  title?: string;
  data: SubcategoryDataPoint[];
  isLoading?: boolean;
  error?: string | null;
  categoryColor?: string;
  onItemPress?: (item: SubcategoryDataPoint, index: number) => void;
  maxItems?: number;
  showViewToggle?: boolean;
}

export interface KickoffStateProps {
  targetAmount: number;
  currentSpend: number;
}

export interface PacingStateProps {
  targetAmount: number;
  currentSpend: number;
  pacingPercentage: number;
  expectedPercentage: number;
  pacingStatus: PacingStatus;
  daysIntoMonth: number;
  totalDaysInMonth: number;
}

export interface StabilityStateProps {
  stabilityScore: number;
  overallSeverity: CreepSeverity;
  targetAmount: number;
  currentSpend: number;
  pacingPercentage: number;
  expectedPercentage: number;
  pacingStatus: PacingStatus;
  topDriftingCategory: CategoryCreepSummary | null;
}

export interface SpendingStabilityCardProps {
  mode: PacingMode;
  kickoffState?: KickoffStateProps;
  pacingState?: PacingStateProps;
  stabilityState?: StabilityStateProps;
  periodLabel?: string;
  isLoading?: boolean;
  hasTarget?: boolean;
  onPress?: () => void;
}

export interface TooltipData {
  item: ChartDataPoint;
  index: number;
  x: number;
  y: number;
}

export interface AnimatedBarProps {
  percentage: number;
  color: string;
  delay: number;
  animated: boolean;
}

export interface SubcategoryItemProps {
  item: SubcategoryDataPoint;
  index: number;
  categoryColor: string;
  onPress?: () => void;
  formatValue: (value: number) => string;
  animated: boolean;
}

export interface CategoryDisplayResult {
  amount: number;
  percentage: number | null;
  iconName: FontAwesomeIconName;
  categoryColor: string;
  displayName: string;
  transactionLabel: string;
}

export interface MerchantDisplayResult {
  amount: number;
  percentage: number | null;
  initials: string;
  avatarColor: string;
  transactionLabel: string;
}

export interface SpendingCardConfig {
  title: string;
  accentColor: string;
  changeContext: ChangeContext;
}

export interface SpendingCardDisplayResult {
  config: SpendingCardConfig;
  isPositive: boolean;
  displayAmount: number;
  formattedAmount: string;
  amountColor: string | null;
  transactionLabel: string | null;
}

export interface TrendDisplayResult {
  direction: TrendDirection;
  trendColor: string;
  trendIcon: 'arrow-up' | 'arrow-down' | 'minus';
  changeText: string;
}

export interface TrendAnimationResult {
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}

export interface IndicatorSizeConfig {
  fontSize: number;
  iconSize: number;
  padding: number;
}

export interface ChangeIndicatorDisplayResult {
  direction: ChangeDirection;
  textColor: string;
  backgroundColor: string;
  iconName: 'arrow-up' | 'arrow-down' | 'minus';
  formattedValue: string;
  displayLabel: string;
  sizeConfig: IndicatorSizeConfig;
}

export interface MonthlyBalanceDisplayResult {
  netFlow: number;
  status: BalanceStatus;
  statusLabel: string;
  statusColor: string;
  progressRatio: number;
  savingsRatio: number;
  formattedIncome: string;
  formattedExpenses: string;
  formattedSavingsRate: string;
  formattedNetFlow: string;
  formattedRunway: string | null;
}

export interface ChartMetricsResult {
  maxValue: number;
  average: number;
}

export interface TrendMetricsResult {
  average: number;
  changePercentage: number | null;
}

export interface PeriodToggleResult {
  selectedPeriod: PeriodOption;
  handlePeriodChange: (period: PeriodOption) => void;
}

export interface ViewToggleResult {
  viewMode: ViewMode;
  handleViewModeChange: (mode: ViewMode) => void;
}

export interface MerchantStatsDisplayResult {
  lifetimeSpend: number;
  avgTransaction: number | null;
  initials: string;
  avatarColor: string;
  dateRange: string;
  dayOfWeek: string | null;
  formattedLifetimeSpend: string;
  formattedAvgTransaction: string | null;
  formattedCategory: string | null;
  formattedFrequency: string | null;
  formattedMedian: string | null;
}

export interface PacingDisplayResult {
  statusColor: string;
  statusLabel: string;
  statusEmoji: string;
}

export interface StabilityDisplayResult {
  status: StabilityStatus;
  statusLabel: string;
  statusColor: string;
}

export interface DriftingCategoryDisplayResult {
  categoryName: string;
  changeIndicator: string;
  changeColor: string;
}

export interface TargetComparisonResult {
  changeFromTarget: number;
  formattedChange: string;
  changeColor: string;
}
