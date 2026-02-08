import { Text as DefaultText, View as DefaultView } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';

interface ThemeProps {
  lightColor?: string;
  darkColor?: string;
}

export type TextProps = ThemeProps & DefaultText['props'];
export type ViewProps = ThemeProps & DefaultView['props'];

function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof (typeof Colors)['light']
): string {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }

  return Colors[theme][colorName];
}

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
