import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ProfileMenu } from '@/components/profile';
import { useAuth } from '@/hooks';
import { colors, spacing } from '@/styles';

export function HeaderProfileButton() {
  const [menuVisible, setMenuVisible] = useState(false);
  const { user } = useAuth();

  const handlePress = () => {
    setMenuVisible(true);
  };

  const handleClose = () => {
    setMenuVisible(false);
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        onPress={handlePress}
      >
        <FontAwesome name="user-circle-o" size={24} color={colors.accent.primary} />
      </Pressable>

      <ProfileMenu
        visible={menuVisible}
        onClose={handleClose}
        userEmail={user?.email}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
});
