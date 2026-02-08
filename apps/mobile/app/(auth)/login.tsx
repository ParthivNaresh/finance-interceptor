import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { authStyles } from '@/features/auth';
import { useAuth, useTranslation } from '@/hooks';
import { colors } from '@/styles';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('common.error'), t('errors.invalidCredentials'));
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('errors.authError');
      Alert.alert(t('common.error'), message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={authStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={authStyles.content}>
        <Text style={authStyles.title}>{t('auth.loginTitle')}</Text>
        <Text style={authStyles.subtitle}>{t('auth.loginSubtitle')}</Text>

        <View style={authStyles.form}>
          <TextInput
            style={authStyles.input}
            placeholder={t('auth.email')}
            placeholderTextColor={colors.text.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            editable={!isLoading}
          />

          <TextInput
            style={authStyles.input}
            placeholder={t('auth.password')}
            placeholderTextColor={colors.text.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
            editable={!isLoading}
          />

          <Pressable
            style={[authStyles.button, isLoading && authStyles.buttonDisabled]}
            onPress={() => void handleSignIn()}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.background.primary} />
            ) : (
              <Text style={authStyles.buttonText}>{t('auth.login')}</Text>
            )}
          </Pressable>
        </View>

        <View style={authStyles.footer}>
          <Text style={authStyles.footerText}>{t('auth.noAccount')} </Text>
          <Link href="/(auth)/register" asChild>
            <Pressable>
              <Text style={authStyles.linkText}>{t('auth.register')}</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
