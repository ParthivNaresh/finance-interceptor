import { StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '@/styles';

interface AlertBadgeProps {
  count: number;
  size?: 'small' | 'medium';
}

export function AlertBadge({ count, size = 'small' }: AlertBadgeProps) {
  if (count <= 0) {
    return null;
  }

  const displayCount = count > 99 ? '99+' : count.toString();
  const isSmall = size === 'small';

  return (
    <View style={[styles.container, isSmall ? styles.small : styles.medium]}>
      <Text style={[styles.text, isSmall ? styles.textSmall : styles.textMedium]}>
        {displayCount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.accent.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  small: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  medium: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
  },
  text: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  textSmall: {
    fontSize: 10,
  },
  textMedium: {
    ...typography.caption,
  },
});
