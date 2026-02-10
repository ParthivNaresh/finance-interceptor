import { TextInput } from 'react-native';

import { colors } from '@/styles';

import { useAuthInputConfig } from './hooks';
import { authStyles } from './styles';
import type { AuthInputProps } from './types';

export function AuthInput({
  value,
  onChangeText,
  placeholder,
  type = 'email',
  disabled = false,
  autoFocus = false,
}: AuthInputProps) {
  const config = useAuthInputConfig(type);

  return (
    <TextInput
      style={authStyles.input}
      placeholder={placeholder}
      placeholderTextColor={colors.text.muted}
      value={value}
      onChangeText={onChangeText}
      keyboardType={config.keyboardType}
      textContentType={config.textContentType}
      secureTextEntry={config.secureTextEntry}
      autoCapitalize={config.autoCapitalize}
      autoCorrect={config.autoCorrect}
      editable={!disabled}
      autoFocus={autoFocus}
    />
  );
}
