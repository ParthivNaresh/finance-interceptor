import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/styles';
import { getAccountTypeIcon } from '@/utils';

interface AccountTypeIconProps {
  type: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { container: 32, icon: 14 },
  md: { container: 40, icon: 18 },
  lg: { container: 48, icon: 22 },
} as const;

export function AccountTypeIcon({ type, size = 'md' }: AccountTypeIconProps) {
  const iconName = getAccountTypeIcon(type);
  const dimensions = sizeMap[size];

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

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
});
