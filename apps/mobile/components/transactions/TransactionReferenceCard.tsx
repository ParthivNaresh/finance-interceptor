import { View } from 'react-native';

import { useTranslation } from '@/hooks';
import { glassStyles } from '@/styles';

import { DetailRow } from './DetailRow';
import { transactionSectionStyles as styles } from './styles';
import type { TransactionReferenceCardProps } from './types';

export function TransactionReferenceCard({ transactionId }: TransactionReferenceCardProps) {
  const { t } = useTranslation();

  return (
    <View style={[glassStyles.card, styles.card]}>
      <DetailRow label={t('transactionDetail.transactionId')} value={transactionId} />
    </View>
  );
}
