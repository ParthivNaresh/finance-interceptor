import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, View } from 'react-native';

import { AuthButton, AuthFooter, AuthHeader, AuthInput, authStyles } from '@/components/auth';
import { useAuth, useTranslation } from '@/hooks';

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
        <AuthHeader
          title={t('auth.loginTitle')}
          subtitle={t('auth.loginSubtitle')}
        />

        <View style={authStyles.form}>
          <AuthInput
            value={email}
            onChangeText={setEmail}
            placeholder={t('auth.email')}
            type="email"
            disabled={isLoading}
            autoFocus
          />

          <AuthInput
            value={password}
            onChangeText={setPassword}
            placeholder={t('auth.password')}
            type="password"
            disabled={isLoading}
          />

          <AuthButton
            onPress={() => void handleSignIn()}
            title={t('auth.login')}
            loading={isLoading}
          />
        </View>

        <AuthFooter
          message={t('auth.noAccount')}
          linkText={t('auth.register')}
          linkHref="/(auth)/register"
        />
      </View>
    </KeyboardAvoidingView>
  );
}
