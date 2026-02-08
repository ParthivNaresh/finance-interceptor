import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/styles';
import type { Account } from '@/types';
import { formatAccountBalance, formatSubtype, LIABILITY_TYPES } from '@/utils';

interface AccountRowProps {
  account: Account;
  onPress?: (account: Account) => void;
  isLast?: boolean;
}

function parseBalance(balance: number | string | null | undefined): number {
  if (balance === null || balance === undefined) {
    return 0;
  }
  const parsed = typeof balance === 'string' ? parseFloat(balance) : balance;
  return isNaN(parsed) ? 0 : parsed;
}

export function AccountRow({ account, onPress, isLast = false }: AccountRowProps) {
  const handlePress = () => {
    onPress?.(account);
  };

  const balance = parseBalance(account.current_balance);
  const isLiability = LIABILITY_TYPES.has(account.type.toLowerCase());
  const displayBalance = formatAccountBalance(account.current_balance, account.type, account.iso_currency_code);
  const isNegative = isLiability && balance > 0;
  const subtypeLabel = formatSubtype(account.subtype);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        !isLast && styles.withBorder,
        pressed && styles.pressed,
      ]}
      onPress={handlePress}
    >
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {account.name}
        </Text>
        <View style={styles.meta}>
          {subtypeLabel && <Text style={styles.subtype}>{subtypeLabel}</Text>}
          {account.mask && (
            <>
              {subtypeLabel && <Text style={styles.separator}>•</Text>}
              <Text style={styles.mask}>••••{account.mask}</Text>
            </>
          )}
        </View>
      </View>
      <Text style={[styles.balance, isNegative && styles.negativeBalance]}>{displayBalance}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  withBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.secondary,
  },
  pressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  info: {
    flex: 1,
    marginRight: spacing.md,
  },
  name: {
    ...typography.titleSmall,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  subtype: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  separator: {
    ...typography.caption,
    color: colors.text.muted,
    marginHorizontal: spacing.xs,
  },
  mask: {
    ...typography.caption,
    color: colors.text.muted,
  },
  balance: {
    ...typography.titleSmall,
    fontWeight: '600',
  },
  negativeBalance: {
    color: colors.accent.error,
  },
});
