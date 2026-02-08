import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { GlassButton, GlassCard } from '@/components';
import { useAuth, useTranslation } from '@/hooks';
import { colors, spacing, typography } from '@/styles';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { signOut } = useAuth();

  const handleSignOut = () => {
    void signOut();
  };

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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
        <GlassCard padding="none">
          <View style={styles.menuItem}>
            <View style={styles.menuItemContent}>
              <FontAwesome name="sign-out" size={20} color={colors.accent.error} />
              <Text style={[styles.menuItemText, styles.signOutText]}>{t('auth.logout')}</Text>
            </View>
            <GlassButton
              title={t('auth.logout')}
              variant="ghost"
              size="sm"
              onPress={handleSignOut}
            />
          </View>
        </GlassCard>
      </View>

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
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.overline,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuItemText: {
    ...typography.bodyLarge,
  },
  signOutText: {
    color: colors.accent.error,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  versionText: {
    ...typography.caption,
  },
});
