import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';

import { useAuth } from '@/hooks';
import { colors } from '@/styles';

import type { MenuItemColorsResult, MenuItemVariant, ProfileMenuNavigationResult } from './types';

export function useProfileMenuNavigation(onClose: () => void): ProfileMenuNavigationResult {
  const router = useRouter();
  const { signOut } = useAuth();

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

  return {
    handleAlerts,
    handleAccounts,
    handleSettings,
    handleSignOut,
  };
}

export function useMenuItemColors(variant: MenuItemVariant): MenuItemColorsResult {
  return useMemo(() => {
    const isDanger = variant === 'danger';
    return {
      iconColor: isDanger ? colors.accent.error : colors.text.primary,
      textColor: isDanger ? colors.accent.error : colors.text.primary,
    };
  }, [variant]);
}
