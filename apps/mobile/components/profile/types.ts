import type FontAwesome from '@expo/vector-icons/FontAwesome';
import type { ReactNode } from 'react';

export type FontAwesomeIconName = React.ComponentProps<typeof FontAwesome>['name'];

export type MenuItemVariant = 'default' | 'danger';

export interface ProfileMenuProps {
  visible: boolean;
  onClose: () => void;
  userEmail?: string;
}

export interface ProfileMenuItemProps {
  icon: FontAwesomeIconName;
  label: string;
  onPress: () => void;
  variant?: MenuItemVariant;
  showDivider?: boolean;
  rightElement?: ReactNode;
}

export interface ProfileMenuNavigationResult {
  handleAlerts: () => void;
  handleAccounts: () => void;
  handleSettings: () => void;
  handleSignOut: () => void;
}

export interface MenuItemColorsResult {
  iconColor: string;
  textColor: string;
}
