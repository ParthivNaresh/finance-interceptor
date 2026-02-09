import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { colors } from '@/styles';

import { AccountRow } from './AccountRow';
import { useAccountSectionDisplay } from './hooks';
import { accountSectionStyles as styles } from './styles';
import type { AccountSectionProps } from './types';

export function AccountSection({ group, onAccountPress }: AccountSectionProps) {
  const { typeLabel, iconName, formattedTotal, isNegativeTotal } = useAccountSectionDisplay(group);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <FontAwesome name={iconName} size={16} color={colors.accent.primary} />
          </View>
          <Text style={styles.typeLabel}>{typeLabel}</Text>
        </View>
        <Text style={[styles.total, isNegativeTotal && styles.negativeTotal]}>{formattedTotal}</Text>
      </View>

      <GlassCard padding="none">
        {group.accounts.map((account, index) => (
          <AccountRow
            key={account.id}
            account={account}
            onPress={onAccountPress}
            isLast={index === group.accounts.length - 1}
          />
        ))}
      </GlassCard>
    </View>
  );
}
