import { View } from 'react-native';

import { useTranslation } from '@/hooks';
import { glassStyles } from '@/styles';

import { DetailRow } from './DetailRow';
import { useTransactionDetailsDisplay } from './hooks';
import { transactionSectionStyles as styles } from './styles';
import type { TransactionDetailsCardProps } from './types';

export function TransactionDetailsCard({ transaction }: TransactionDetailsCardProps) {
  const { t } = useTranslation();
  const { description, merchantName, category, subcategory, paymentMethod, authorizedDate } =
    useTransactionDetailsDisplay(transaction);

  return (
    <View style={[glassStyles.card, styles.card]}>
      <DetailRow label={t('transactionDetail.description')} value={description} />
      <DetailRow label={t('transactionDetail.merchant')} value={merchantName} />
      <DetailRow label={t('transactionDetail.category')} value={category} />
      <DetailRow label={t('transactionDetail.subcategory')} value={subcategory} />
      <DetailRow label={t('transactionDetail.paymentMethod')} value={paymentMethod} />
      <DetailRow label={t('transactionDetail.authorizedDate')} value={authorizedDate} />
    </View>
  );
}
