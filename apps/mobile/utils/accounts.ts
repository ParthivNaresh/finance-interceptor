import type FontAwesome from '@expo/vector-icons/FontAwesome';

import type { Account } from '@/types';

type IconName = React.ComponentProps<typeof FontAwesome>['name'];

export type AccountType = 'depository' | 'investment' | 'credit' | 'loan' | 'other';

export const ACCOUNT_TYPE_ORDER: readonly AccountType[] = [
  'depository',
  'investment',
  'credit',
  'loan',
  'other',
] as const;

export const LIABILITY_TYPES: ReadonlySet<string> = new Set(['credit', 'loan']);

export interface GroupedAccounts {
  type: AccountType;
  accounts: Account[];
  total: number;
}

export function normalizeAccountType(type: string): AccountType {
  const normalized = type.toLowerCase();
  if (['depository', 'investment', 'credit', 'loan'].includes(normalized)) {
    return normalized as AccountType;
  }
  return 'other';
}

function parseBalance(balance: number | string | null | undefined): number {
  if (balance === null || balance === undefined) {
    return 0;
  }
  const parsed = typeof balance === 'string' ? parseFloat(balance) : balance;
  return isNaN(parsed) ? 0 : parsed;
}

export function groupAccountsByType(accounts: Account[]): GroupedAccounts[] {
  const groups = new Map<AccountType, Account[]>();

  for (const type of ACCOUNT_TYPE_ORDER) {
    groups.set(type, []);
  }

  for (const account of accounts) {
    const type = normalizeAccountType(account.type);
    const group = groups.get(type);
    if (group) {
      group.push(account);
    }
  }

  const result: GroupedAccounts[] = [];

  for (const type of ACCOUNT_TYPE_ORDER) {
    const typeAccounts = groups.get(type) ?? [];
    if (typeAccounts.length > 0) {
      result.push({
        type,
        accounts: typeAccounts,
        total: calculateSectionTotal(typeAccounts, type),
      });
    }
  }

  return result;
}

export function calculateSectionTotal(accounts: Account[], type: AccountType): number {
  let total = 0;

  for (const account of accounts) {
    const balance = parseBalance(account.current_balance);
    if (LIABILITY_TYPES.has(type)) {
      total -= balance;
    } else {
      total += balance;
    }
  }

  return total;
}

export function getAccountTypeIcon(type: string): IconName {
  switch (type.toLowerCase()) {
    case 'depository':
      return 'dollar';
    case 'investment':
      return 'line-chart';
    case 'credit':
      return 'credit-card';
    case 'loan':
      return 'home';
    default:
      return 'bank';
  }
}

export function formatSubtype(subtype: string | null | undefined): string {
  if (!subtype) {
    return '';
  }

  return subtype
    .split(/[\s_-]+/)
    .map((word) => {
      if (/^\d/.test(word) || word.toLowerCase() === 'ira' || word.toLowerCase() === 'hsa') {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

export function formatAccountBalance(
  balance: number | string | null | undefined,
  type: string,
  currency: string = 'USD'
): string {
  const parsedBalance = parseBalance(balance);

  if (balance === null || balance === undefined) {
    return '—';
  }

  const isLiability = LIABILITY_TYPES.has(type.toLowerCase());
  const displayValue = isLiability ? -parsedBalance : parsedBalance;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(displayValue);
}

export function formatSectionTotal(total: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(total);
}
