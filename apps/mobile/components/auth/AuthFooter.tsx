import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { authStyles } from './styles';
import type { AuthFooterProps } from './types';

export function AuthFooter({ message, linkText, linkHref }: AuthFooterProps) {
  return (
    <View style={authStyles.footer}>
      <Text style={authStyles.footerText}>{message} </Text>
      <Link href={linkHref} asChild>
        <Pressable>
          <Text style={authStyles.linkText}>{linkText}</Text>
        </Pressable>
      </Link>
    </View>
  );
}
