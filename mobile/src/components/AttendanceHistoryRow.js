import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, alpha } from '../ui/tokens';

/**
 * AttendanceHistoryRow - Memoized attendance record row component
 */
const AttendanceHistoryRow = memo(({ record }) => {
  const date = new Date(record.date);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const isPresent = record.isPresent;

  return (
    <View
      style={[
        styles.container,
        isPresent && styles.containerPresent,
        !isPresent && styles.containerAbsent,
      ]}
    >
      <View style={styles.left}>
        <Ionicons
          name={isPresent ? 'checkmark-circle' : 'close-circle'}
          size={24}
          color={isPresent ? colors.success : colors.error}
        />
        <View style={styles.info}>
          <Text style={styles.date}>{formattedDate}</Text>
          {record.signature && (
            <Text style={styles.signature}>{record.signature}</Text>
          )}
        </View>
      </View>
      <View
        style={[
          styles.badge,
          isPresent && styles.badgePresent,
          !isPresent && styles.badgeAbsent,
        ]}
      >
        <Text style={styles.badgeText}>
          {isPresent ? 'Present' : 'Absent'}
        </Text>
      </View>
    </View>
  );
});

AttendanceHistoryRow.displayName = 'AttendanceHistoryRow';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  containerPresent: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  containerAbsent: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  info: {
    marginLeft: spacing.md,
    flex: 1,
  },
  date: {
    ...typography.body,
    fontWeight: '600',
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  signature: {
    ...typography.caption,
    color: colors.textMuted,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  badgePresent: {
    backgroundColor: alpha(colors.success, 0.15),
    borderWidth: 1,
    borderColor: alpha(colors.success, 0.3),
  },
  badgeAbsent: {
    backgroundColor: alpha(colors.error, 0.15),
    borderWidth: 1,
    borderColor: alpha(colors.error, 0.3),
  },
  badgeText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },
});

export default AttendanceHistoryRow;

