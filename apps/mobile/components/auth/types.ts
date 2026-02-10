import type { KeyboardTypeOptions, TextInputProps } from 'react-native';

export type AuthInputType = 'email' | 'password' | 'newPassword';

export type TextContentType = TextInputProps['textContentType'];

export interface AuthInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  type?: AuthInputType;
  disabled?: boolean;
  autoFocus?: boolean;
}

export interface AuthButtonProps {
  onPress: () => void;
  title: string;
  loading?: boolean;
  disabled?: boolean;
}

export interface AuthFooterProps {
  message: string;
  linkText: string;
  linkHref: '/(auth)/login' | '/(auth)/register';
}

export interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export interface AuthInputConfig {
  keyboardType: KeyboardTypeOptions;
  textContentType: TextContentType;
  secureTextEntry: boolean;
  autoCapitalize: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect: boolean;
}
