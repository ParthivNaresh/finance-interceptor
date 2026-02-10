import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/styles';

import { useMenuItemColors } from './hooks';
import { profileMenuItemStyles as styles } from './styles';
import type { ProfileMenuItemProps } from './types';

export function ProfileMenuItem({
  icon,
  label,
  onPress,
  variant = 'default',
  showDivider = true,
  rightElement,
}: ProfileMenuItemProps) {
  const { iconColor, textColor } = useMenuItemColors(variant);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        showDivider && styles.withDivider,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.iconContainer}>
        <FontAwesome name={icon} size={20} color={iconColor} />
      </View>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
      <FontAwesome name="chevron-right" size={14} color={colors.text.muted} />
    </Pressable>
  );
}
