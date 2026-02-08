import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlertBadge } from '@/components/alerts';
import { GlassCard } from '@/components/glass';
import { useAuth, useTranslation, useUnreadAlertCount } from '@/hooks';
import { colors, spacing, typography } from '@/styles';

import { ProfileMenuItem } from './ProfileMenuItem';

interface ProfileMenuProps {
  visible: boolean;
  onClose: () => void;
  userEmail?: string;
}

export function ProfileMenu({ visible, onClose, userEmail }: ProfileMenuProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const { count: unreadAlertCount } = useUnreadAlertCount();

  const handleAlerts = useCallback(() => {
    onClose();
    router.push('/alerts');
  }, [onClose, router]);

  const handleAccounts = useCallback(() => {
    onClose();
    router.push('/accounts');
  }, [onClose, router]);

  const handleSettings = useCallback(() => {
    onClose();
    router.push('/settings');
  }, [onClose, router]);

  const handleSignOut = useCallback(() => {
    onClose();
    void signOut();
  }, [onClose, signOut]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.container, { paddingBottom: insets.bottom + spacing.md }]}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <GlassCard variant="elevated" padding="none">
              <View style={styles.header}>
                <View style={styles.avatarContainer}>
                  <FontAwesome name="user-circle" size={48} color={colors.accent.primary} />
                </View>
                {userEmail && (
                  <Text style={styles.email} numberOfLines={1}>
                    {userEmail}
                  </Text>
                )}
              </View>

              <View style={styles.menuItems}>
                <ProfileMenuItem
                  icon="bell"
                  label={t('profile.alerts')}
                  onPress={handleAlerts}
                  rightElement={
                    unreadAlertCount > 0 ? (
                      <AlertBadge count={unreadAlertCount} size="medium" />
                    ) : undefined
                  }
                />
                <ProfileMenuItem
                  icon="bank"
                  label={t('profile.accounts')}
                  onPress={handleAccounts}
                />
                <ProfileMenuItem
                  icon="cog"
                  label={t('profile.settings')}
                  onPress={handleSettings}
                />
                <ProfileMenuItem
                  icon="sign-out"
                  label={t('profile.signOut')}
                  onPress={handleSignOut}
                  variant="danger"
                  showDivider={false}
                />
              </View>
            </GlassCard>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    paddingHorizontal: spacing.md,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.secondary,
  },
  avatarContainer: {
    marginBottom: spacing.sm,
  },
  email: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  menuItems: {
    paddingVertical: spacing.xs,
  },
});
