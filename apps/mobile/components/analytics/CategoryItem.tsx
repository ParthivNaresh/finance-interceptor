import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/styles';
import { formatCurrency } from '@/utils/recurring';

import { useCategoryDisplay } from './hooks';
import { categoryItemStyles as styles } from './styles';
import type { CategoryItemProps } from './types';

export function CategoryItem({ category, onPress }: CategoryItemProps) {
  const { amount, percentage, iconName, categoryColor, displayName, transactionLabel } =
    useCategoryDisplay(category);

  const content = (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: `${categoryColor}20` }]}>
        <FontAwesome name={iconName} size={16} color={categoryColor} />
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.amount}>{formatCurrency(amount)}</Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(percentage ?? 0, 100)}%`,
                  backgroundColor: categoryColor,
                },
              ]}
            />
          </View>
          <Text style={styles.percentage}>
            {percentage !== null ? `${percentage.toFixed(1)}%` : '—'}
          </Text>
        </View>

        <Text style={styles.transactionCount}>{transactionLabel}</Text>
      </View>

      {onPress && (
        <FontAwesome name="chevron-right" size={12} color={colors.text.muted} style={styles.chevron} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={() => onPress(category)}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}
