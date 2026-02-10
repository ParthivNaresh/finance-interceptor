import type { TimeRange } from '@/components/analytics';
import type {
  CategorySpendingSummary,
  LifestyleCreepSummary,
  MerchantSpendingSummary,
  MerchantStats,
  PacingMode,
  PacingStatus,
  SpendingSummaryResponse,
  TargetStatusResponse,
} from '@/types';

export interface MerchantDisplayItem {
  merchant_name: string;
  total_amount: number;
  transaction_count: number;
  percentage_of_total: number | null;
}

export interface InsightsHeaderProps {
  title: string;
}

export interface InsightsSummaryProps {
  totalIncome: number;
  netFlow: number;
}

export interface CategorySectionProps {
  categories: CategorySpendingSummary[];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  onCategoryPress: (category: CategorySpendingSummary) => void;
  isLoading: boolean;
}

export interface MerchantSectionProps {
  merchants: MerchantDisplayItem[];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  onMerchantPress: (merchant: MerchantSpendingSummary) => void;
  isLoading: boolean;
}

export interface StabilitySectionProps {
  mode: PacingMode;
  pacing: LifestyleCreepSummary | null;
  targetStatus: TargetStatusResponse | null;
  targetAmount: number;
  currentSpend: number;
  pacingPercentage: number;
  expectedPercentage: number;
  pacingStatus: PacingStatus;
  daysIntoMonth: number;
  totalDaysInMonth: number;
  stabilityScore: number | null;
  periodLabel: string;
  isLoading: boolean;
}

export interface InsightsDataResult {
  totalSpending: number;
  totalIncome: number;
  netFlow: number;
  monthOverMonthChange: number | null;
  summaryData: SpendingSummaryResponse | null;
  categories: CategorySpendingSummary[];
  rangeMerchants: MerchantSpendingSummary[];
  rangeTotalSpending: number;
  allTimeMerchants: MerchantStats[];
  targetStatus: TargetStatusResponse | null;
  pacing: LifestyleCreepSummary | null;
  pacingMode: PacingMode;
  pacingStatus: PacingStatus;
  targetAmount: number;
  currentSpend: number;
  pacingPercentage: number;
  expectedPercentage: number;
  daysIntoMonth: number;
  totalDaysInMonth: number;
  stabilityScore: number | null;
  isLoading: boolean;
  isCategoriesLoading: boolean;
  isRangeMerchantsLoading: boolean;
  isAllTimeMerchantsLoading: boolean;
  isStabilityLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => void;
  refreshCategories: () => void;
  refreshRangeMerchants: () => void;
  refreshAllTimeMerchants: () => void;
  refetchTargetStatus: () => void;
  refetchPacing: () => void;
}

export interface TimeRangeLabelMap {
  week: string;
  month: string;
  year: string;
  all: string;
}
