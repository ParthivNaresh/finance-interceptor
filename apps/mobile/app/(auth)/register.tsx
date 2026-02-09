import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, View } from 'react-native';

import { AuthButton, AuthFooter, AuthHeader, AuthInput, authStyles } from '@/components/auth';
import { useAuth, useTranslation } from '@/hooks';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('auth.passwordsDoNotMatch'));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('common.error'), t('errors.weakPassword'));
      return;
    }

    setIsLoading(true);
    try {
      await signUp(email.trim(), password);
      Alert.alert(
        t('auth.success'),
        t('auth.accountCreated'),
        [{ text: t('common.ok'), onPress: () => router.replace('/(auth)/login') }]
      );
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
          title={t('auth.registerTitle')}
          subtitle={t('auth.registerSubtitle')}
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
            type="newPassword"
            disabled={isLoading}
          />

          <AuthInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder={t('auth.confirmPassword')}
            type="newPassword"
            disabled={isLoading}
          />

          <AuthButton
            onPress={() => void handleSignUp()}
            title={t('auth.register')}
            loading={isLoading}
          />
        </View>

        <AuthFooter
          message={t('auth.hasAccount')}
          linkText={t('auth.login')}
          linkHref="/(auth)/login"
        />
      </View>
    </KeyboardAvoidingView>
  );
}
