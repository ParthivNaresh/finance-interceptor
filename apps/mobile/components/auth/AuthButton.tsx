import { ActivityIndicator, Pressable, Text } from 'react-native';

import { colors } from '@/styles';

import { authStyles } from './styles';
import type { AuthButtonProps } from './types';

export function AuthButton({
  onPress,
  title,
  loading = false,
  disabled = false,
}: AuthButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={[authStyles.button, isDisabled && authStyles.buttonDisabled]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color={colors.background.primary} />
      ) : (
        <Text style={authStyles.buttonText}>{title}</Text>
      )}
    </Pressable>
  );
}
