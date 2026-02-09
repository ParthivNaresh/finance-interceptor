import FontAwesome from '@expo/vector-icons/FontAwesome';
import { View } from 'react-native';

import { colors } from '@/styles';
import { getAccountTypeIcon } from '@/utils';

import { accountTypeIconStyles as styles } from './styles';
import type { AccountIconSize, AccountTypeIconProps } from './types';

const SIZE_MAP: Record<AccountIconSize, { container: number; icon: number }> = {
  sm: { container: 32, icon: 14 },
  md: { container: 40, icon: 18 },
  lg: { container: 48, icon: 22 },
};

export function AccountTypeIcon({ type, size = 'md' }: AccountTypeIconProps) {
  const iconName = getAccountTypeIcon(type);
  const dimensions = SIZE_MAP[size];

  return (
    <View
      style={[
        styles.container,
        {
          width: dimensions.container,
          height: dimensions.container,
          borderRadius: dimensions.container / 2,
        },
      ]}
    >
      <FontAwesome name={iconName} size={dimensions.icon} color={colors.accent.primary} />
    </View>
  );
}
