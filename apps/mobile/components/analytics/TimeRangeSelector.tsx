import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/styles';

export type TimeRange = 'week' | 'month' | 'year' | 'all';

interface TimeRangeOption {
  value: TimeRange;
  label: string;
}

const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
];

interface TimeRangeSelectorProps {
  selected: TimeRange;
  onSelect: (range: TimeRange) => void;
  compact?: boolean;
}

export function TimeRangeSelector({ selected, onSelect, compact = false }: TimeRangeSelectorProps) {
  if (compact) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.compactContainer}
      >
        {TIME_RANGE_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            style={[
              styles.compactChip,
              selected === option.value && styles.compactChipSelected,
            ]}
          >
            <Text
              style={[
                styles.compactChipText,
                selected === option.value && styles.compactChipTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      {TIME_RANGE_OPTIONS.map((option) => (
        <Pressable
          key={option.value}
          onPress={() => onSelect(option.value)}
          style={[styles.option, selected === option.value && styles.optionSelected]}
        >
          <Text
            style={[styles.optionText, selected === option.value && styles.optionTextSelected]}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 4,
  },
  option: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: 10,
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: colors.accent.primary,
  },
  optionText: {
    ...typography.labelSmall,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: colors.background.primary,
    fontWeight: '600',
  },
  compactContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  compactChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.background.secondary,
  },
  compactChipSelected: {
    backgroundColor: colors.accent.primary,
  },
  compactChipText: {
    ...typography.labelSmall,
    color: colors.text.secondary,
  },
  compactChipTextSelected: {
    color: colors.background.primary,
    fontWeight: '600',
  },
});
