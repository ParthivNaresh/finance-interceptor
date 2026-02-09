import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Animated, Text, View } from 'react-native';

import { useTranslation } from '@/hooks';

import { useTrendAnimation, useTrendDisplay } from './hooks';
import { trendSummaryStyles as styles } from './styles';
import type { TrendSummaryProps } from './types';

function defaultFormatValue(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function TrendSummary({
  average,
  changePercentage,
  periodLabel,
  formatValue = defaultFormatValue,
  animated = true,
}: TrendSummaryProps) {
  const { t } = useTranslation();
  const { trendColor, trendIcon, changeText } = useTrendDisplay(changePercentage);
  const { fadeAnim, slideAnim } = useTrendAnimation(average, changePercentage, animated);

  const displayPeriodLabel = periodLabel ?? t('recurring.frequency.monthly').toLowerCase();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.averageSection}>
        <Text style={styles.label}>{t('analytics.trend.average')}</Text>
        <Text style={styles.averageValue}>
          {formatValue(average)} <Text style={styles.periodLabel}>{displayPeriodLabel}</Text>
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.changeSection}>
        <Text style={styles.label}>{t('analytics.trend.vsPrevious')}</Text>
        <View style={styles.changeRow}>
          <View style={[styles.iconContainer, { backgroundColor: `${trendColor}15` }]}>
            <FontAwesome name={trendIcon} size={10} color={trendColor} />
          </View>
          <Text style={[styles.changeValue, { color: trendColor }]}>{changeText}</Text>
        </View>
      </View>
    </Animated.View>
  );
}
