import { Text, View } from 'react-native';

import { useAlertBadgeDisplay } from './hooks';
import { alertBadgeStyles as styles } from './styles';
import type { AlertBadgeProps } from './types';

export function AlertBadge({ count, size = 'small' }: AlertBadgeProps) {
  const { displayCount, isVisible } = useAlertBadgeDisplay(count);

  if (!isVisible) {
    return null;
  }

  const isSmall = size === 'small';

  return (
    <View style={[styles.container, isSmall ? styles.small : styles.medium]}>
      <Text style={[styles.text, isSmall ? styles.textSmall : styles.textMedium]}>
        {displayCount}
      </Text>
    </View>
  );
}
