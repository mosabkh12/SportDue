import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../ui/tokens';

const getInitials = (name) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getStatusColor = (status) => {
  switch (status) {
    case 'present':
      return colors.success;
    case 'absent':
      return colors.error;
    case 'late':
      return colors.warning;
    default:
      return colors.textMuted;
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'present':
      return 'Present';
    case 'absent':
      return 'Absent';
    case 'late':
      return 'Late';
    default:
      return 'Unmarked';
  }
};

const PlayerAttendanceRow = React.memo(({ player, status, onSetStatus }) => {
  const isPresent = status === 'present';
  const isAbsent = status === 'absent';
  const isLate = status === 'late';

  return (
    <View style={styles.playerRow}>
      <View style={styles.playerAvatar}>
        <Text style={styles.playerInitials}>{getInitials(player.fullName)}</Text>
      </View>
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{player.fullName}</Text>
        {status && (
          <View style={[styles.statusPill, { backgroundColor: getStatusColor(status) + '20', borderColor: getStatusColor(status) }]}>
            <Text style={[styles.statusPillText, { color: getStatusColor(status) }]}>
              {getStatusLabel(status)}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.statusButtons}>
        <TouchableOpacity
          style={[
            styles.statusButton,
            isPresent && styles.statusButtonActive,
            isPresent && { backgroundColor: colors.success + '20', borderColor: colors.success },
          ]}
          onPress={() => onSetStatus(player._id, isPresent ? '' : 'present')}
        >
          <Ionicons 
            name="checkmark-circle" 
            size={20} 
            color={isPresent ? colors.success : colors.textMuted} 
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.statusButton,
            isAbsent && styles.statusButtonActive,
            isAbsent && { backgroundColor: colors.error + '20', borderColor: colors.error },
          ]}
          onPress={() => onSetStatus(player._id, isAbsent ? '' : 'absent')}
        >
          <Ionicons 
            name="close-circle" 
            size={20} 
            color={isAbsent ? colors.error : colors.textMuted} 
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.statusButton,
            isLate && styles.statusButtonActive,
            isLate && { backgroundColor: colors.warning + '20', borderColor: colors.warning },
          ]}
          onPress={() => onSetStatus(player._id, isLate ? '' : 'late')}
        >
          <Ionicons 
            name="time" 
            size={20} 
            color={isLate ? colors.warning : colors.textMuted} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
});

PlayerAttendanceRow.displayName = 'PlayerAttendanceRow';

const styles = StyleSheet.create({
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerInitials: {
    ...typography.body,
    fontWeight: '700',
    color: colors.primary,
  },
  playerInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  playerName: {
    ...typography.body,
    fontWeight: '600',
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  statusPillText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 10,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  statusButton: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgTertiary,
  },
  statusButtonActive: {
    borderWidth: 2,
  },
});

export default PlayerAttendanceRow;

