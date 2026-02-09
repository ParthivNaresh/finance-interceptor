import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlertBadge } from '@/components/alerts';
import { GlassCard } from '@/components/glass';
import { useTranslation, useUnreadAlertCount } from '@/hooks';
import { colors, spacing } from '@/styles';

import { useProfileMenuNavigation } from './hooks';
import { ProfileMenuItem } from './ProfileMenuItem';
import { profileMenuStyles as styles } from './styles';
import type { ProfileMenuProps } from './types';

export function ProfileMenu({ visible, onClose, userEmail }: ProfileMenuProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { count: unreadAlertCount } = useUnreadAlertCount();
  const { handleAlerts, handleAccounts, handleSettings, handleSignOut } =
    useProfileMenuNavigation(onClose);

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
