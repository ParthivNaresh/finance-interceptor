import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { useTranslation } from '@/hooks';
import { colors } from '@/styles';

import { merchantDetailStyles as styles } from './styles';
import type { MerchantLoadingProps } from './types';

export function MerchantLoading({ merchantName, isComputing = false }: MerchantLoadingProps) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.loadingContainer}>
      <Stack.Screen
        options={{
          title: merchantName,
          headerStyle: { backgroundColor: colors.background.primary },
          headerTintColor: colors.text.primary,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <FontAwesome name="chevron-left" size={18} color={colors.text.primary} />
            </Pressable>
          ),
        }}
      />
      <ActivityIndicator size="large" color={colors.accent.primary} />
      {isComputing && <Text style={styles.computingText}>{t('merchants.computing')}</Text>}
    </View>
  );
}
