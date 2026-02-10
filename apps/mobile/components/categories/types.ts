import type { SubcategoryDataPoint, TimeRange } from '@/components/analytics';
import type { CategoryDetailResponse, MerchantSpendingSummary, SubcategorySpendingSummary } from '@/types';
import type { FontAwesomeIconName } from '@/utils';

export interface CategoryHeaderProps {
  categoryName: string;
  timeRange: TimeRange;
  totalAmount: number;
  transactionCount: number;
  percentageOfTotal: number | null;
  averageTransaction: number | null;
}

export interface CategoryMerchantsProps {
  merchants: MerchantSpendingSummary[];
  onMerchantPress: (merchant: MerchantSpendingSummary) => void;
}

export interface CategoryDetailDisplayResult {
  categoryIcon: FontAwesomeIconName;
  categoryColor: string;
  displayName: string;
  formattedTotal: string;
  formattedAverage: string | null;
  percentageLabel: string | null;
  transactionLabel: string;
}

export interface CategoryDetailDataResult {
  data: CategoryDetailResponse | null;
  totalAmount: number;
  averageTransaction: number | null;
  percentageOfTotal: number | null;
  subcategories: SubcategorySpendingSummary[];
  topMerchants: MerchantSpendingSummary[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export interface SubcategoryTransformResult {
  subcategoryData: SubcategoryDataPoint[];
}
