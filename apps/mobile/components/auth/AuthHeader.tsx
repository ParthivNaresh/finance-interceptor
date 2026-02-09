import { Text } from 'react-native';

import { authStyles } from './styles';
import type { AuthHeaderProps } from './types';

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <>
      <Text style={authStyles.title}>{title}</Text>
      <Text style={authStyles.subtitle}>{subtitle}</Text>
    </>
  );
}
