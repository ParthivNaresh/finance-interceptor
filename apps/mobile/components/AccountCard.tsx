import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StyleSheet, Text, View } from 'react-native';

import { colors, glassStyles, spacing, typography } from '@/styles';
import type { Account, PlaidItemWithAccounts } from '@/types';

interface AccountCardProps {
  plaidItem: PlaidItemWithAccounts;
}

function formatCurrency(amount: number | null, currency: string = 'USD'): string {
  if (amount === null) {
    return '—';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

function formatDate(dateString: string | null): string {
  if (!dateString) {
    return 'Never';
  }
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return colors.accent.success;
    case 'error':
      return colors.accent.error;
    default:
      return colors.text.muted;
  }
}

function getAccountIcon(type: string): React.ComponentProps<typeof FontAwesome>['name'] {
  switch (type) {
    case 'depository':
      return 'bank';
    case 'credit':
      return 'credit-card';
    case 'investment':
      return 'line-chart';
    case 'loan':
      return 'money';
    default:
      return 'dollar';
  }
}

interface AccountRowProps {
  account: Account;
}

function AccountRow({ account }: AccountRowProps) {
  return (
    <View style={styles.accountRow}>
      <View style={styles.accountInfo}>
        <FontAwesome
          name={getAccountIcon(account.type)}
          size={16}
          color={colors.text.secondary}
          style={styles.accountIcon}
        />
        <View style={styles.accountDetails}>
          <Text style={styles.accountName}>{account.name}</Text>
          {account.mask && <Text style={styles.accountMask}>••••{account.mask}</Text>}
        </View>
      </View>
      <Text style={styles.accountBalance}>
        {formatCurrency(account.current_balance, account.iso_currency_code)}
      </Text>
    </View>
  );
}

export function AccountCard({ plaidItem }: AccountCardProps) {
  const institutionName = plaidItem.institution_name || 'Connected Bank';
  const statusColor = getStatusColor(plaidItem.status);

  return (
    <View style={[glassStyles.card, styles.card]}>
      <View style={styles.header}>
        <View style={styles.institutionInfo}>
          <FontAwesome name="university" size={20} color={colors.accent.primary} />
          <Text style={styles.institutionName}>{institutionName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{plaidItem.status}</Text>
        </View>
      </View>

      {plaidItem.error_message && (
        <View style={styles.errorBanner}>
          <FontAwesome name="exclamation-circle" size={14} color={colors.accent.error} />
          <Text style={styles.errorText}>{plaidItem.error_message}</Text>
        </View>
      )}

      <View style={styles.accountsList}>
        {plaidItem.accounts.map((account) => (
          <AccountRow key={account.id} account={account} />
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.syncText}>Last synced: {formatDate(plaidItem.last_successful_sync)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  institutionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  institutionName: {
    ...typography.titleMedium,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    ...typography.labelSmall,
    color: colors.background.primary,
    textTransform: 'capitalize',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    padding: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: 8,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.accent.error,
    flex: 1,
  },
  accountsList: {
    padding: spacing.md,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountIcon: {
    marginRight: spacing.sm,
    width: 20,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    ...typography.titleSmall,
  },
  accountMask: {
    ...typography.caption,
  },
  accountBalance: {
    ...typography.titleSmall,
    fontWeight: '600',
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
  },
  syncText: {
    ...typography.caption,
  },
});
