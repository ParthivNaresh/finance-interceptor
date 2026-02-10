import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { useTranslation } from '@/hooks';
import { colors } from '@/styles';

import { merchantPatternsStyles as styles } from './styles';
import type { MerchantPatternsProps } from './types';

export function MerchantPatterns({ dayOfWeekLabel, hourLabel }: MerchantPatternsProps) {
  const { t } = useTranslation();

  if (!dayOfWeekLabel && !hourLabel) {
    return null;
  }

  return (
    <GlassCard variant="subtle" padding="md">
      <Text style={styles.title}>{t('merchants.spendingPatterns')}</Text>
      <View style={styles.row}>
        {dayOfWeekLabel && (
          <View style={styles.item}>
            <FontAwesome name="calendar-o" size={14} color={colors.text.muted} />
            <Text style={styles.text}>{t('merchants.usuallyOn', { day: dayOfWeekLabel })}</Text>
          </View>
        )}
        {hourLabel && (
          <View style={styles.item}>
            <FontAwesome name="clock-o" size={14} color={colors.text.muted} />
            <Text style={styles.text}>{t('merchants.around', { time: hourLabel })}</Text>
          </View>
        )}
      </View>
    </GlassCard>
  );
}
