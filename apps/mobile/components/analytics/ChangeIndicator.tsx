import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, View } from 'react-native';

import { useChangeIndicatorDisplay } from './hooks';
import { changeIndicatorStyles as styles } from './styles';
import type { ChangeIndicatorProps } from './types';

export function ChangeIndicator({
  value,
  context = 'spending',
  size = 'md',
  showIcon = true,
  showLabel = false,
  label,
}: ChangeIndicatorProps) {
  const { textColor, backgroundColor, iconName, formattedValue, displayLabel, sizeConfig } =
    useChangeIndicatorDisplay(value, context, size, label);

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { backgroundColor, paddingHorizontal: sizeConfig.padding }]}>
        {showIcon && (
          <FontAwesome
            name={iconName}
            size={sizeConfig.iconSize}
            color={textColor}
            style={styles.icon}
          />
        )}
        <Text style={[styles.value, { fontSize: sizeConfig.fontSize, color: textColor }]}>
          {formattedValue}
        </Text>
      </View>
      {showLabel && <Text style={styles.label}>{displayLabel}</Text>}
    </View>
  );
}
