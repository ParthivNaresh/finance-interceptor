import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useTranslation } from '@/hooks';
import { colors } from '@/styles';

import { categoryDetailStyles as styles } from './styles';

interface CategoryErrorProps {
  displayName: string;
  error: string;
  onRetry: () => void;
}

export function CategoryError({ displayName, error, onRetry }: CategoryErrorProps) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.errorContainer}>
      <Stack.Screen
        options={{
          title: displayName,
          headerStyle: { backgroundColor: colors.background.primary },
          headerTintColor: colors.text.primary,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <FontAwesome name="chevron-left" size={18} color={colors.text.primary} />
            </Pressable>
          ),
        }}
      />
      <FontAwesome name="exclamation-circle" size={48} color={colors.text.muted} />
      <Text style={styles.errorTitle}>{t('categories.unableToLoad')}</Text>
      <Text style={styles.errorText}>{error}</Text>
      <Pressable style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryText}>{t('common.retry')}</Text>
      </Pressable>
    </View>
  );
}
