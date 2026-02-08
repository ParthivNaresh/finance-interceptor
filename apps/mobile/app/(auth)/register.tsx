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

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert(t('common.error'), 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), 'Passwords do not match');
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
        'Success',
        'Account created! Please check your email to verify your account.',
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
        <Text style={authStyles.title}>{t('auth.registerTitle')}</Text>
        <Text style={authStyles.subtitle}>{t('auth.registerSubtitle')}</Text>

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
            textContentType="newPassword"
            editable={!isLoading}
          />

          <TextInput
            style={authStyles.input}
            placeholder={t('auth.confirmPassword')}
            placeholderTextColor={colors.text.muted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            textContentType="newPassword"
            editable={!isLoading}
          />

          <Pressable
            style={[authStyles.button, isLoading && authStyles.buttonDisabled]}
            onPress={() => void handleSignUp()}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.background.primary} />
            ) : (
              <Text style={authStyles.buttonText}>{t('auth.register')}</Text>
            )}
          </Pressable>
        </View>

        <View style={authStyles.footer}>
          <Text style={authStyles.footerText}>{t('auth.hasAccount')} </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text style={authStyles.linkText}>{t('auth.login')}</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
