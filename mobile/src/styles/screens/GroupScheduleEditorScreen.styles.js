import { StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../../ui/tokens';

export const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  sectionCard: {
    marginBottom: spacing.lg,
  },
  sectionHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  dayOfWeekGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dayButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgTertiary,
    minWidth: 50,
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  dayButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dayButtonTextSelected: {
    color: colors.primary,
  },
  selectedDaysPreview: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.primary + '10',
    borderRadius: radius.sm,
  },
  selectedDaysText: {
    ...typography.caption,
    color: colors.primary,
  },
  timeInputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timeInputGroup: {
    flex: 1,
  },
  timeLabel: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
    color: colors.textPrimary,
  },
  timeInput: {
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48,
  },
  removeButton: {
    marginTop: spacing.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  removeButtonText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  monthYearText: {
    ...typography.h3,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarHeaderCell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  calendarHeaderText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textMuted,
  },
  calendarCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    position: 'relative',
  },
  calendarCellOtherMonth: {
    opacity: 0.3,
  },
  calendarCellSelected: {
    backgroundColor: colors.primary + '20',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  calendarCellCancelled: {
    backgroundColor: colors.error + '15',
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  calendarCellAdded: {
    backgroundColor: colors.success + '15',
    borderWidth: 1,
    borderColor: colors.success + '40',
  },
  calendarCellActive: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  calendarCellText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  calendarCellTextOtherMonth: {
    color: colors.textMuted,
  },
  calendarCellTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  calendarCellTextCancelled: {
    color: colors.error,
  },
  calendarCellTextAdded: {
    color: colors.success,
  },
  cancelledIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  addedIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  summaryText: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  summaryTextCancelled: {
    ...typography.body,
    color: colors.error,
    marginBottom: spacing.xs,
  },
  summaryTextAdded: {
    ...typography.body,
    color: colors.success,
    marginBottom: spacing.xs,
  },
  saveButton: {
    marginTop: spacing.lg,
    minHeight: 56,
  },
});

