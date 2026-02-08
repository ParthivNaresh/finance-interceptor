import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/styles';
import type { UpcomingBill } from '@/types';
import { formatCurrency } from '@/utils';

interface UpcomingBillItemProps {
  bill: UpcomingBill;
  onPress?: (bill: UpcomingBill) => void;
}

function getDueDateLabel(daysUntil: number): string {
  if (daysUntil < 0) {
    return `${Math.abs(daysUntil)} days overdue`;
  }
  if (daysUntil === 0) {
    return 'Due today';
  }
  if (daysUntil === 1) {
    return 'Due tomorrow';
  }
  return `Due in ${daysUntil} days`;
}

function getDueDateColor(daysUntil: number): string {
  if (daysUntil < 0) {
    return colors.accent.error;
  }
  if (daysUntil <= 3) {
    return colors.accent.warning;
  }
  return colors.text.secondary;
}

export function UpcomingBillItem({ bill, onPress }: UpcomingBillItemProps) {
  const handlePress = () => {
    onPress?.(bill);
  };

  const displayName = bill.stream.merchant_name || bill.stream.description;
  const amount = formatCurrency(bill.expected_amount, bill.stream.iso_currency_code);
  const dueDateLabel = getDueDateLabel(bill.days_until_due);
  const dueDateColor = getDueDateColor(bill.days_until_due);

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={handlePress}
    >
      <View style={styles.iconContainer}>
        <FontAwesome name="calendar" size={16} color={colors.accent.primary} />
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={[styles.dueDate, { color: dueDateColor }]}>{dueDateLabel}</Text>
      </View>

      <Text style={styles.amount}>{amount}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.secondary,
  },
  pressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    ...typography.titleSmall,
  },
  dueDate: {
    ...typography.caption,
    marginTop: 2,
  },
  amount: {
    ...typography.titleSmall,
    fontWeight: '600',
  },
});
