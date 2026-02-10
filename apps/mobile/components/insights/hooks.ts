import { useMemo } from 'react';

import type { TimeRange } from '@/components/analytics';
import { useTranslation } from '@/hooks';
import type { MerchantSpendingSummary, MerchantStats } from '@/types';

import type { MerchantDisplayItem, TimeRangeLabelMap } from './types';

export function useTimeRangeLabels(): TimeRangeLabelMap {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      week: t('insights.timeRange.week'),
      month: t('insights.timeRange.month'),
      year: t('insights.timeRange.year'),
      all: t('insights.timeRange.all'),
    }),
    [t]
  );
}

export function useTimeRangeLabel(range: TimeRange): string {
  const labels = useTimeRangeLabels();
  return labels[range];
}

export function useMerchantDisplayItems(
  isAllTime: boolean,
  allTimeMerchants: MerchantStats[],
  rangeMerchants: MerchantSpendingSummary[],
  _rangeTotalSpending: number,
  limit: number = 5
): MerchantDisplayItem[] {
  return useMemo(() => {
    if (isAllTime) {
      const totalAllTimeSpending = allTimeMerchants.reduce(
        (sum, m) => sum + parseFloat(m.total_lifetime_spend),
        0
      );
      return allTimeMerchants.slice(0, limit).map((stats) => {
        const amount = parseFloat(stats.total_lifetime_spend);
        return {
          merchant_name: stats.merchant_name,
          total_amount: amount,
          transaction_count: stats.total_transaction_count,
          percentage_of_total: totalAllTimeSpending > 0 ? (amount / totalAllTimeSpending) * 100 : null,
        };
      });
    }

    return rangeMerchants.slice(0, limit).map((summary) => ({
      merchant_name: summary.merchant_name,
      total_amount: parseFloat(summary.total_amount),
      transaction_count: summary.transaction_count,
      percentage_of_total: summary.percentage_of_total ? parseFloat(summary.percentage_of_total) : null,
    }));
  }, [isAllTime, allTimeMerchants, rangeMerchants, limit]);
}

export function usePeriodLabel(periodStart: string | undefined): string {
  const { t } = useTranslation();

  return useMemo(() => {
    if (!periodStart) return t('insights.thisMonth');
    const [year, month] = periodStart.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [periodStart, t]);
}
