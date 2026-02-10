import { useMemo } from 'react';

import type { ChartDataPoint, ChartMetricsResult, TrendMetricsResult } from '../types';

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
