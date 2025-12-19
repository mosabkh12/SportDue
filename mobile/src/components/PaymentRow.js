import React, { memo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, alpha } from '../ui/tokens';

/**
 * PaymentRow - Memoized payment row component with edit functionality
 */
const PaymentRow = memo(({
  payment,
  isEditing,
  editForm,
  isDeleting,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onEdit,
  onDelete,
  formatDateDisplay,
  getPaymentStatus,
  isPaymentLate,
}) => {
  const amountDue = parseFloat(payment.amountDue || 0);
  const amountPaid = parseFloat(payment.amountPaid || 0);
  const outstanding = amountDue - amountPaid;
  const status = getPaymentStatus(payment);
  const isLate = isPaymentLate(payment);

  if (isEditing) {
    return (
      <View style={styles.container}>
        <View style={styles.editForm}>
          <Text style={styles.date}>{formatDateDisplay(payment.month)}</Text>
          <View style={styles.editInputs}>
            <View style={styles.editInputGroup}>
              <Text style={styles.editLabel}>Amount Due:</Text>
              <TextInput
                style={styles.editInput}
                value={editForm.amountDue}
                onChangeText={(value) => onEditChange('amountDue', value)}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={styles.editInputGroup}>
              <Text style={styles.editLabel}>Amount Paid:</Text>
              <TextInput
                style={styles.editInput}
                value={editForm.amountPaid}
                onChangeText={(value) => onEditChange('amountPaid', value)}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>
          <View style={styles.editActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSave]}
              onPress={onSaveEdit}
            >
              <Text style={styles.actionButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonCancel]}
              onPress={onCancelEdit}
            >
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.date}>{formatDateDisplay(payment.month)}</Text>
        <View style={styles.meta}>
          <View
            style={[
              styles.statusBadge,
              status === 'paid' && styles.statusBadgePaid,
              status === 'partial' && styles.statusBadgePartial,
              status === 'unpaid' && styles.statusBadgeUnpaid,
              isLate && styles.statusBadgeLate,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                status === 'paid' && styles.statusTextPaid,
                status === 'partial' && styles.statusTextPartial,
                status === 'unpaid' && styles.statusTextUnpaid,
                isLate && styles.statusTextLate,
              ]}
            >
              {isLate ? 'Late' : status === 'paid' ? 'Paid' : status === 'partial' ? 'Partial' : 'Unpaid'}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.amount}>
        <Text style={[
          styles.outstanding,
          isLate && styles.outstandingLate,
        ]}>
          ${outstanding > 0 ? outstanding.toFixed(2) : '0.00'}
        </Text>
        <Text style={styles.detail}>
          ${amountPaid.toFixed(2)} / ${amountDue.toFixed(2)}
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonEdit]}
          onPress={onEdit}
        >
          <Ionicons name="pencil-outline" size={16} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonDelete]}
          onPress={onDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <Ionicons name="trash-outline" size={16} color={colors.error} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
});

PaymentRow.displayName = 'PaymentRow';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  info: {
    marginBottom: spacing.sm,
  },
  date: {
    ...typography.body,
    fontWeight: '600',
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  statusBadgePaid: {
    backgroundColor: alpha(colors.success, 0.15),
    borderWidth: 1,
    borderColor: alpha(colors.success, 0.3),
  },
  statusBadgePartial: {
    backgroundColor: alpha(colors.warning, 0.15),
    borderWidth: 1,
    borderColor: alpha(colors.warning, 0.3),
  },
  statusBadgeUnpaid: {
    backgroundColor: alpha(colors.error, 0.15),
    borderWidth: 1,
    borderColor: alpha(colors.error, 0.3),
  },
  statusBadgeLate: {
    backgroundColor: alpha(colors.error, 0.25),
    borderColor: colors.error,
  },
  statusText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextPaid: {
    color: colors.success,
  },
  statusTextPartial: {
    color: colors.warning,
  },
  statusTextUnpaid: {
    color: colors.error,
  },
  statusTextLate: {
    color: colors.error,
    fontWeight: '700',
  },
  amount: {
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  outstanding: {
    ...typography.h3,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  outstandingLate: {
    color: colors.error,
  },
  detail: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionButton: {
    padding: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  actionButtonEdit: {
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonDelete: {
    backgroundColor: alpha(colors.error, 0.15),
    borderWidth: 1,
    borderColor: alpha(colors.error, 0.3),
  },
  actionButtonSave: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionButtonCancel: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    ...typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  editForm: {
    marginTop: spacing.sm,
  },
  editInputs: {
    marginBottom: spacing.md,
  },
  editInputGroup: {
    marginBottom: spacing.md,
  },
  editLabel: {
    ...typography.caption,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  editInput: {
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 16,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});

export default PaymentRow;

