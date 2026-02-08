import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { useTranslation } from '@/hooks';
import { colors, spacing, typography } from '@/styles';
import type { Account } from '@/types';
import { formatSectionTotal, getAccountTypeIcon } from '@/utils';
import type { GroupedAccounts } from '@/utils';

import { AccountRow } from './AccountRow';

interface AccountSectionProps {
  group: GroupedAccounts;
  onAccountPress?: (account: Account) => void;
}

export function AccountSection({ group, onAccountPress }: AccountSectionProps) {
  const { t } = useTranslation();
  const { type, accounts, total } = group;

  const typeLabel = t(`accountTypes.${type}` as const);
  const iconName = getAccountTypeIcon(type);
  const formattedTotal = formatSectionTotal(total);
  const isNegativeTotal = total < 0;

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
        {accounts.map((account, index) => (
          <AccountRow
            key={account.id}
            account={account}
            onPress={onAccountPress}
            isLast={index === accounts.length - 1}
          />
        ))}
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  typeLabel: {
    ...typography.titleMedium,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  total: {
    ...typography.titleMedium,
    fontWeight: '600',
  },
  negativeTotal: {
    color: colors.accent.error,
  },
});
