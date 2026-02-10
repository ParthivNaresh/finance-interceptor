import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable } from 'react-native';

import { ProfileMenu } from '@/components/profile';
import { colors } from '@/styles';

import { useProfileMenu } from './hooks';
import { headerProfileButtonStyles as styles } from './styles';

export function HeaderProfileButton() {
  const { menuVisible, userEmail, handlePress, handleClose } = useProfileMenu();

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
        userEmail={userEmail}
      />
    </>
  );
}
