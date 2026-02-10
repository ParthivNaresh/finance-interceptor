import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { borderRadius, colors, spacing, typography } from '@/styles';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface GlassButtonProps {
  onPress: () => void;
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  md: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  lg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
};

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: colors.accent.primary,
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: colors.glass.background,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
};

const pressedVariantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: colors.accent.primary,
    opacity: 0.8,
  },
  secondary: {
    backgroundColor: colors.glass.backgroundHover,
  },
  ghost: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
};

function getTextColor(variant: ButtonVariant, disabled: boolean): string {
  if (disabled) {
    return colors.text.muted;
  }

  switch (variant) {
    case 'primary':
      return colors.background.primary;
    case 'secondary':
    case 'ghost':
      return colors.text.primary;
  }
}

export function GlassButton({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  fullWidth = false,
}: GlassButtonProps) {
  const handlePress = async () => {
    if (disabled || loading) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const textColor = getTextColor(variant, disabled);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={() => void handlePress()}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        sizeStyles[size],
        variantStyles[variant],
        pressed && !isDisabled && pressedVariantStyles[variant],
        isDisabled && styles.disabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={[styles.text, size === 'sm' && styles.textSm, { color: textColor }]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.button,
  },
  textSm: {
    ...typography.buttonSmall,
  },
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: '100%',
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
});
