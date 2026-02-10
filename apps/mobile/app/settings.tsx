import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components';
import { useTranslation } from '@/hooks';
import { colors, spacing, typography } from '@/styles';

export default function SettingsScreen() {
  const { t } = useTranslation();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <GlassCard variant="subtle" padding="lg">
        <View style={styles.comingSoonContainer}>
          <FontAwesome name="cog" size={48} color={colors.text.muted} />
          <Text style={styles.comingSoonTitle}>{t('settings.comingSoon')}</Text>
          <Text style={styles.comingSoonText}>
            Account settings, preferences, and more will be available here soon.
          </Text>
        </View>
      </GlassCard>

      <View style={styles.footer}>
        <Text style={styles.versionText}>{t('settings.version')} 0.1.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  comingSoonContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  comingSoonTitle: {
    ...typography.headlineMedium,
    marginTop: spacing.md,
  },
  comingSoonText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  versionText: {
    ...typography.caption,
  },
});
