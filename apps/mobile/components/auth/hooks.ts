import { useMemo } from 'react';

import type { AuthInputConfig, AuthInputType } from './types';

const INPUT_CONFIGS: Record<AuthInputType, AuthInputConfig> = {
  email: {
    keyboardType: 'email-address',
    textContentType: 'emailAddress',
    secureTextEntry: false,
    autoCapitalize: 'none',
    autoCorrect: false,
  },
  password: {
    keyboardType: 'default',
    textContentType: 'password',
    secureTextEntry: true,
    autoCapitalize: 'none',
    autoCorrect: false,
  },
  newPassword: {
    keyboardType: 'default',
    textContentType: 'newPassword',
    secureTextEntry: true,
    autoCapitalize: 'none',
    autoCorrect: false,
  },
};

export function useAuthInputConfig(type: AuthInputType): AuthInputConfig {
  return useMemo(() => INPUT_CONFIGS[type], [type]);
}
