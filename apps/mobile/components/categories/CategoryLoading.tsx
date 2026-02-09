import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { colors } from '@/styles';

import { categoryDetailStyles as styles } from './styles';

interface CategoryLoadingProps {
  displayName: string;
}

export function CategoryLoading({ displayName }: CategoryLoadingProps) {
  const router = useRouter();

  return (
    <View style={styles.loadingContainer}>
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
      <ActivityIndicator size="large" color={colors.accent.primary} />
    </View>
  );
}
