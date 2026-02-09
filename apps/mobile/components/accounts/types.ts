import type FontAwesome from '@expo/vector-icons/FontAwesome';

import type { Account } from '@/types';
import type { GroupedAccounts } from '@/utils';

export type AccountIconSize = 'sm' | 'md' | 'lg';

export type FontAwesomeIconName = React.ComponentProps<typeof FontAwesome>['name'];

export interface AccountRowProps {
  account: Account;
  onPress?: (account: Account) => void;
  isLast?: boolean;
}

export interface AccountSectionProps {
  group: GroupedAccounts;
  onAccountPress?: (account: Account) => void;
}

export interface AccountTypeIconProps {
  type: string;
  size?: AccountIconSize;
}

export interface AccountDisplayResult {
  balance: number;
  isLiability: boolean;
  displayBalance: string;
  isNegative: boolean;
  subtypeLabel: string | null;
}

export interface AccountSectionDisplayResult {
  typeLabel: string;
  iconName: FontAwesomeIconName;
  formattedTotal: string;
  isNegativeTotal: boolean;
}
