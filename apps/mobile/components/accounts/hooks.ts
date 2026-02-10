import { useMemo } from 'react';

import { useTranslation } from '@/hooks';
import type { Account } from '@/types';
import { formatAccountBalance, formatSectionTotal, formatSubtype, getAccountTypeIcon, LIABILITY_TYPES } from '@/utils';
import type { GroupedAccounts } from '@/utils';

import type { AccountDisplayResult, AccountSectionDisplayResult } from './types';

function parseBalance(balance: number | string | null | undefined): number {
  if (balance === null || balance === undefined) {
    return 0;
  }
  const parsed = typeof balance === 'string' ? parseFloat(balance) : balance;
  return isNaN(parsed) ? 0 : parsed;
}

export function useAccountDisplay(account: Account): AccountDisplayResult {
  return useMemo(() => {
    const balance = parseBalance(account.current_balance);
    const isLiability = LIABILITY_TYPES.has(account.type.toLowerCase());
    const displayBalance = formatAccountBalance(
      account.current_balance,
      account.type,
      account.iso_currency_code
    );
    const isNegative = isLiability && balance > 0;
    const subtypeLabel = formatSubtype(account.subtype);

    return {
      balance,
      isLiability,
      displayBalance,
      isNegative,
      subtypeLabel,
    };
  }, [account.current_balance, account.type, account.iso_currency_code, account.subtype]);
}

export function useAccountSectionDisplay(group: GroupedAccounts): AccountSectionDisplayResult {
  const { t } = useTranslation();

  return useMemo(() => {
    const typeLabel = t(`accountTypes.${group.type}` as const);
    const iconName = getAccountTypeIcon(group.type);
    const formattedTotal = formatSectionTotal(group.total);
    const isNegativeTotal = group.total < 0;

    return {
      typeLabel,
      iconName,
      formattedTotal,
      isNegativeTotal,
    };
  }, [t, group.type, group.total]);
}
