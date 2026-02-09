import { Pressable, ScrollView, Text, View } from 'react-native';

import { timeRangeSelectorStyles as styles } from './styles';
import type { TimeRangeOption, TimeRangeSelectorProps } from './types';

export type { TimeRange } from './types';

const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
];

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
