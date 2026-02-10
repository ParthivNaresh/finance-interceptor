import { Text as DefaultText, View as DefaultView } from 'react-native';

import { useThemeColor } from './hooks';
import type { TextProps, ViewProps } from './types';

export type { TextProps, ViewProps } from './types';

export function Text({ style, lightColor, darkColor, ...otherProps }: TextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  return <DefaultText style={[{ color }, style]} {...otherProps} />;
}

export function View({ style, lightColor, darkColor, ...otherProps }: ViewProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'background'
  );
  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}
