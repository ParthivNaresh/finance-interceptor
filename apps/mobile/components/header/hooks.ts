import { useCallback, useState } from 'react';

import { useAuth } from '@/hooks';

import type { ProfileMenuState } from './types';

export function useProfileMenu(): ProfileMenuState {
  const [menuVisible, setMenuVisible] = useState(false);
  const { user } = useAuth();

  const handlePress = useCallback(() => {
    setMenuVisible(true);
  }, []);

  const handleClose = useCallback(() => {
    setMenuVisible(false);
  }, []);

  return {
    menuVisible,
    userEmail: user?.email,
    handlePress,
    handleClose,
  };
}
