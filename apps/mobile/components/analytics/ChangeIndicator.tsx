import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/styles';

type ChangeDirection = 'increase' | 'decrease' | 'neutral';
type ChangeContext = 'spending' | 'income';
type IndicatorSize = 'sm' | 'md' | 'lg';

interface ChangeIndicatorProps {
  value: number | null;
  context?: ChangeContext;
  size?: IndicatorSize;
  showIcon?: boolean;
  showLabel?: boolean;
  label?: string;
}

const sizeConfig: Record<IndicatorSize, { fontSize: number; iconSize: number; padding: number }> = {
  sm: { fontSize: 11, iconSize: 10, padding: spacing.xs },
  md: { fontSize: 13, iconSize: 12, padding: spacing.sm },
  lg: { fontSize: 15, iconSize: 14, padding: spacing.sm },
};

function getDirection(value: number | null): ChangeDirection {
  if (value === null || value === 0) return 'neutral';
  return value > 0 ? 'increase' : 'decrease';
}

function getColor(direction: ChangeDirection, context: ChangeContext): string {
  if (direction === 'neutral') return colors.text.muted;

  if (context === 'spending') {
    return direction === 'increase' ? colors.accent.error : colors.accent.success;
  }

  return direction === 'increase' ? colors.accent.success : colors.accent.error;
}

function getBackgroundColor(direction: ChangeDirection, context: ChangeContext): string {
  if (direction === 'neutral') return 'rgba(115, 115, 115, 0.15)';

  if (context === 'spending') {
    return direction === 'increase' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)';
  }

  return direction === 'increase' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)';
}

function getIconName(direction: ChangeDirection): 'arrow-up' | 'arrow-down' | 'minus' {
  if (direction === 'neutral') return 'minus';
  return direction === 'increase' ? 'arrow-up' : 'arrow-down';
}

export function ChangeIndicator({
  value,
  context = 'spending',
  size = 'md',
  showIcon = true,
  showLabel = false,
  label,
}: ChangeIndicatorProps) {
  const direction = getDirection(value);
  const textColor = getColor(direction, context);
  const backgroundColor = getBackgroundColor(direction, context);
  const iconName = getIconName(direction);
  const config = sizeConfig[size];

  const formattedValue =
    value !== null ? `${value >= 0 ? '+' : ''}${value.toFixed(1)}%` : '—';

  const displayLabel = label ?? (direction === 'neutral' ? 'No change' : 'vs last month');

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { backgroundColor, paddingHorizontal: config.padding }]}>
        {showIcon && (
          <FontAwesome
            name={iconName}
            size={config.iconSize}
            color={textColor}
            style={styles.icon}
          />
        )}
        <Text style={[styles.value, { fontSize: config.fontSize, color: textColor }]}>
          {formattedValue}
        </Text>
      </View>
      {showLabel && <Text style={styles.label}>{displayLabel}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  icon: {
    marginRight: 2,
  },
  value: {
    ...typography.labelMedium,
    fontWeight: '600',
  },
  label: {
    ...typography.bodySmall,
    color: colors.text.muted,
  },
});
