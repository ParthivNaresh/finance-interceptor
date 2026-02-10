import type FontAwesome from '@expo/vector-icons/FontAwesome';
import type { Text as DefaultText, View as DefaultView } from 'react-native';

import type Colors from '@/constants/Colors';
import type { Transaction } from '@/types';

export type FontAwesomeIconName = React.ComponentProps<typeof FontAwesome>['name'];

export type ColorSchemeName = 'light' | 'dark';

export type ThemeColorName = keyof (typeof Colors)['light'];

export type LoadingSpinnerSize = 'small' | 'large';

export interface ThemeProps {
  lightColor?: string;
  darkColor?: string;
}

export type TextProps = ThemeProps & DefaultText['props'];

export type ViewProps = ThemeProps & DefaultView['props'];

export interface TransactionItemProps {
  transaction: Transaction;
  onPress?: (transaction: Transaction) => void;
}

export interface EmptyStateProps {
  icon: FontAwesomeIconName;
  title: string;
  message: string;
}

export interface LoadingSpinnerProps {
  size?: LoadingSpinnerSize;
}

export interface TransactionDisplayResult {
  isIncome: boolean;
  displayName: string;
  categoryIcon: FontAwesomeIconName;
  formattedAmount: string;
  amountPrefix: string;
  formattedDate: string;
}

export interface CategoryIconMapping {
  keywords: string[];
  icon: FontAwesomeIconName;
}

export interface ThemeColorProps {
  light?: string;
  dark?: string;
}
