import { Pressable, Text, View } from 'react-native';

import { useAccountDisplay } from './hooks';
import { accountRowStyles as styles } from './styles';
import type { AccountRowProps } from './types';

export function AccountRow({ account, onPress, isLast = false }: AccountRowProps) {
  const { displayBalance, isNegative, subtypeLabel } = useAccountDisplay(account);

  const handlePress = () => {
    onPress?.(account);
  };

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
