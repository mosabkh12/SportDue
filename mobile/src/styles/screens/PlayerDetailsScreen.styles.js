import { StyleSheet, Platform } from 'react-native';
import { colors, spacing, radius, typography, shadow, alpha } from '../../ui/tokens';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderRadius: radius.sm,
  },
  retryButtonText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  // Header Row
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    minHeight: 56,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  headerTitle: {
    ...typography.h2,
    flex: 1,
    fontWeight: '700',
  },
  headerMoreBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Profile Card
  profileCard: {
    backgroundColor: colors.bgSecondary,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  profileAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  profileInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  profileName: {
    ...typography.h3,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  profileContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  profileContactText: {
    ...typography.body,
    fontSize: 12,
    color: colors.textMuted,
    flex: 1,
  },
  activePill: {
    backgroundColor: alpha(colors.success, 0.15),
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: alpha(colors.success, 0.3),
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  activePillText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: colors.success,
  },
  profileChipsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  profileChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: alpha(colors.textMuted, 0.1),
    borderWidth: 1,
    borderColor: alpha(colors.textMuted, 0.2),
  },
  profileChipPaid: {
    backgroundColor: alpha(colors.success, 0.15),
    borderColor: alpha(colors.success, 0.3),
  },
  profileChipLate: {
    backgroundColor: alpha(colors.error, 0.15),
    borderColor: alpha(colors.error, 0.3),
  },
  profileChipUnpaid: {
    backgroundColor: alpha(colors.warning, 0.15),
    borderColor: alpha(colors.warning, 0.3),
  },
  profileChipText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  profileChipTextPaid: {
    color: colors.success,
  },
  profileChipTextLate: {
    color: colors.error,
  },
  profileChipTextUnpaid: {
    color: colors.warning,
  },
  statusTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  statusTagPaid: {
    backgroundColor: alpha(colors.success, 0.15),
    borderColor: alpha(colors.success, 0.3),
  },
  statusTagLate: {
    backgroundColor: alpha(colors.error, 0.15),
    borderColor: alpha(colors.error, 0.3),
  },
  statusTagUnpaid: {
    backgroundColor: alpha(colors.warning, 0.15),
    borderColor: alpha(colors.warning, 0.3),
  },
  statusTagText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
  },
  // Tab Content
  tabContent: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  tabView: {
    flex: 1,
  },
  // Info Tab
  infoListContainer: {
    marginTop: spacing.sm,
  },
  infoListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoListItemIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoListItemTitle: {
    ...typography.body,
    fontWeight: '500',
    color: colors.textPrimary,
    flex: 1,
  },
  infoListItemValue: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: spacing.md,
    textAlign: 'right',
    maxWidth: '40%',
  },
  credentialValueContainer: {
    marginLeft: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: '40%',
  },
  credentialValue: {
    ...typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  infoSection: {
    padding: spacing.md,
  },
  infoRow: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: alpha(colors.border, 0.5),
  },
  infoLabel: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  infoValue: {
    ...typography.body,
    fontSize: 16,
    fontWeight: '500',
  },
  infoValueLarge: {
    ...typography.h2,
    fontSize: 24,
    color: colors.primary,
  },
  infoValueNotes: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  credentialBadge: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
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
  // Attendance Tab
  attendanceStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  attendanceItem: {
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
  attendanceItemPresent: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  attendanceItemAbsent: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  attendanceItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  attendanceItemInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  attendanceDate: {
    ...typography.body,
    fontWeight: '600',
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  attendanceSignature: {
    ...typography.caption,
    color: colors.textMuted,
  },
  attendanceStatusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  attendanceStatusBadgePresent: {
    backgroundColor: alpha(colors.success, 0.15),
    borderWidth: 1,
    borderColor: alpha(colors.success, 0.3),
  },
  attendanceStatusBadgeAbsent: {
    backgroundColor: alpha(colors.error, 0.15),
    borderWidth: 1,
    borderColor: alpha(colors.error, 0.3),
  },
  attendanceStatusText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },
  // Payments Tab
  paymentsHeader: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  filterChips: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#0B0F0D',
  },
  paymentRow: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentInfo: {
    marginBottom: spacing.sm,
  },
  paymentDate: {
    ...typography.body,
    fontWeight: '600',
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  paymentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentStatusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  paymentStatusBadgePaid: {
    backgroundColor: alpha(colors.success, 0.15),
    borderWidth: 1,
    borderColor: alpha(colors.success, 0.3),
  },
  paymentStatusBadgePartial: {
    backgroundColor: alpha(colors.warning, 0.15),
    borderWidth: 1,
    borderColor: alpha(colors.warning, 0.3),
  },
  paymentStatusBadgeUnpaid: {
    backgroundColor: alpha(colors.error, 0.15),
    borderWidth: 1,
    borderColor: alpha(colors.error, 0.3),
  },
  paymentStatusBadgeLate: {
    backgroundColor: alpha(colors.error, 0.25),
    borderColor: colors.error,
  },
  paymentStatusText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },
  paymentStatusTextPaid: {
    color: colors.success,
  },
  paymentStatusTextPartial: {
    color: colors.warning,
  },
  paymentStatusTextUnpaid: {
    color: colors.error,
  },
  paymentStatusTextLate: {
    color: colors.error,
    fontWeight: '700',
  },
  paymentAmount: {
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  paymentOutstanding: {
    ...typography.h3,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  paymentOutstandingLate: {
    color: colors.error,
  },
  paymentDetail: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  paymentActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  paymentActionButton: {
    padding: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  paymentActionButtonEdit: {
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentActionButtonDelete: {
    backgroundColor: alpha(colors.error, 0.15),
    borderWidth: 1,
    borderColor: alpha(colors.error, 0.3),
  },
  paymentActionButtonSave: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  paymentActionButtonCancel: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentActionButtonText: {
    ...typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
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
    fontWeight: '600',
  },
  paymentEditInput: {
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 16,
  },
  paymentEditActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  // Notes Tab
  notesContainer: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  notesLabel: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  notesInput: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 14,
    minHeight: 200,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  saveNotesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    gap: spacing.sm,
  },
  saveNotesButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Floating Bottom Action Bar
  bottomActionBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18,18,22,0.92)',
    borderRadius: 26,
    padding: 10,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    ...(Platform.OS === 'android' && {
      elevation: 12,
    }),
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  primaryActionText: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  secondaryActionBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 22,
  },
  // Menu Items
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.bgTertiary,
    gap: spacing.md,
  },
  menuItemDanger: {
    backgroundColor: alpha(colors.error, 0.1),
  },
  menuItemText: {
    ...typography.body,
    flex: 1,
    fontWeight: '500',
  },
  menuItemTextDanger: {
    color: colors.error,
  },
  // Form Styles
  keyboardAvoidingView: {
    flex: 1,
  },
  formScroll: {
    flex: 1,
  },
  formScrollContent: {
    paddingBottom: spacing.md,
  },
  statusSegmentedControl: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  inputHint: {
    ...typography.caption,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    color: colors.textMuted,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  formFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  formBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formBtnCancel: {
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formBtnPrimary: {
    backgroundColor: colors.primary,
  },
  formBtnDisabled: {
    opacity: 0.5,
  },
  formBtnText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  formBtnTextPrimary: {
    color: '#ffffff',
  },
  // Date Picker
  dateInputButton: {
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    minHeight: 50,
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  dateInputButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
  },
  dateInputButtonTextPlaceholder: {
    color: colors.textMuted,
    fontSize: 16,
  },
  datePickerContainer: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  datePickerTitle: {
    ...typography.h3,
    fontSize: 16,
  },
  datePickerInputs: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  datePickerInputGroup: {
    flex: 1,
  },
  datePickerLabel: {
    ...typography.caption,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  datePickerInput: {
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
  datePickerDoneButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  datePickerDoneButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Empty States
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.body,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.textMuted,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 120,
  },
  listContent: {
    paddingBottom: 120,
  },
});
