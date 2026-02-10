import { Text, View } from 'react-native';

import { MerchantItem } from '@/components/analytics';
import { GlassCard } from '@/components/glass';
import { useTranslation } from '@/hooks';

import { categoryMerchantsStyles as styles } from './styles';
import type { CategoryMerchantsProps } from './types';

export function CategoryMerchants({ merchants, onMerchantPress }: CategoryMerchantsProps) {
  const { t } = useTranslation();

  if (merchants.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('categories.topMerchants')}</Text>
      <GlassCard variant="subtle" padding="none">
        {merchants.map((merchant, index) => (
          <View key={merchant.merchant_name}>
            <MerchantItem merchant={merchant} rank={index + 1} onPress={onMerchantPress} />
            {index < merchants.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </GlassCard>
    </View>
  );
}
