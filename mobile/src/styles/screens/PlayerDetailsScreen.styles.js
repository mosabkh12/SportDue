import { StyleSheet } from 'react-native';
import { colors, spacing, typography, shadows } from '../theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgPrimary,
  },
  loadingText: {
    color: colors.textMuted,
    marginTop: spacing.md,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgPrimary,
    padding: spacing.lg,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  backButton: {
    marginBottom: spacing.md,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.h3,
    flex: 1,
  },
  cardSubtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  editButton: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  editForm: {
    marginTop: spacing.md,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 16,
  },
  dateInputButton: {
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    minHeight: 50,
    justifyContent: 'center',
  },
  dateInputButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
  },
  dateInputButtonTextPlaceholder: {
    color: colors.textMuted,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  helpText: {
    ...typography.caption,
    marginTop: spacing.xs,
    fontSize: 12,
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPrimaryText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
  buttonOutlineText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
  detailsGrid: {
    marginTop: spacing.md,
  },
  detailItem: {
    marginBottom: spacing.md,
  },
  detailLabel: {
    ...typography.caption,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  detailValue: {
    ...typography.body,
    fontSize: 16,
  },
  detailValueMonospace: {
    ...typography.body,
    fontSize: 16,
    fontFamily: 'monospace',
  },
  detailValueLarge: {
    ...typography.h2,
    fontSize: 24,
    color: colors.primary,
  },
  detailValueMuted: {
    ...typography.caption,
    fontStyle: 'italic',
  },
  detailValueNotes: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  credentialBadge: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-start',
  },
  credentialBadgePassword: {
    borderColor: colors.primary,
  },
  credentialText: {
    color: colors.textPrimary,
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '600',
  },
  recordPaymentButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  recordPaymentButtonText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyState: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  emptyStateSubtext: {
    ...typography.caption,
    textAlign: 'center',
  },
  paymentItem: {
    backgroundColor: colors.bgTertiary,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  paymentDate: {
    ...typography.body,
    fontWeight: '600',
    fontSize: 16,
  },
  paymentStatusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  paymentStatusBadgePaid: {
    backgroundColor: `${colors.success}20`,
    borderWidth: 1,
    borderColor: colors.success,
  },
  paymentStatusBadgePartial: {
    backgroundColor: `${colors.warning}20`,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  paymentStatusBadgeUnpaid: {
    backgroundColor: `${colors.error}20`,
    borderWidth: 1,
    borderColor: colors.error,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  paymentAmounts: {
    marginBottom: spacing.md,
  },
  paymentAmountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  paymentAmountLabel: {
    ...typography.caption,
  },
  paymentAmountValue: {
    ...typography.body,
    fontWeight: '600',
  },
  paymentActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  paymentActionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  paymentActionButtonEdit: {
    backgroundColor: colors.bgSecondary,
    borderColor: colors.border,
  },
  paymentActionButtonDelete: {
    backgroundColor: `${colors.error}20`,
    borderColor: colors.error,
  },
  paymentActionButtonSave: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  paymentActionButtonCancel: {
    backgroundColor: colors.bgSecondary,
    borderColor: colors.border,
  },
  paymentActionButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  paymentEditForm: {
    marginTop: spacing.sm,
  },
  paymentEditInputs: {
    marginBottom: spacing.md,
  },
  paymentEditInputGroup: {
    marginBottom: spacing.md,
  },
  paymentEditLabel: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  paymentEditInput: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 16,
  },
  paymentEditActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  attendanceItem: {
    backgroundColor: colors.bgTertiary,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attendanceItemPresent: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  attendanceItemAbsent: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  attendanceDate: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
  },
  attendanceStatusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    marginHorizontal: spacing.sm,
  },
  attendanceStatusBadgePresent: {
    backgroundColor: `${colors.success}20`,
    borderWidth: 1,
    borderColor: colors.success,
  },
  attendanceStatusBadgeAbsent: {
    backgroundColor: `${colors.error}20`,
    borderWidth: 1,
    borderColor: colors.error,
  },
  attendanceStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  attendanceSignature: {
    ...typography.caption,
    flex: 1,
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    paddingTop: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: 'relative',
  },
  modalHandle: {
    position: 'absolute',
    top: spacing.xs,
    left: '50%',
    marginLeft: -20,
    width: 40,
    height: 4,
    backgroundColor: colors.textMuted,
    borderRadius: 2,
    opacity: 0.5,
  },
  modalTitle: {
    ...typography.h2,
    fontSize: 20,
  },
  modalClose: {
    fontSize: 24,
    color: colors.textMuted,
    fontWeight: '300',
  },
  modalScroll: {
    maxHeight: 400,
    paddingBottom: spacing.md,
  },
  modalSubtitle: {
    ...typography.caption,
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalBtnPrimary: {
    backgroundColor: colors.primary,
  },
  modalBtnDisabled: {
    opacity: 0.5,
  },
  modalBtnText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
  modalBtnTextPrimary: {
    color: colors.textPrimary,
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContent: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: spacing.lg,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.border,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  datePickerTitle: {
    ...typography.h3,
    fontSize: 18,
  },
  datePickerClose: {
    fontSize: 24,
    color: colors.textMuted,
    fontWeight: '300',
  },
  datePickerInputs: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  datePickerInputGroup: {
    flex: 1,
  },
  datePickerLabel: {
    ...typography.caption,
    marginBottom: spacing.xs,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  datePickerInput: {
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
  datePickerDoneButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  datePickerDoneButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});
