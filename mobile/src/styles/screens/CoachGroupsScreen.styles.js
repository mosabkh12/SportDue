import { StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../../ui/tokens';

export const styles = StyleSheet.create({
  topSection: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    ...typography.body,
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  clearButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  loaderContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.h3,
    color: colors.textSecondary,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: spacing.md,
    minWidth: 200,
  },
  teamsList: {
    gap: spacing.md,
  },
  teamCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  teamCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  teamCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  teamIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  teamSchedule: {
    ...typography.caption,
    color: colors.textMuted,
  },
  teamCardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  miniButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  miniButtonText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sheetContent: {
    flex: 1,
  },
  sheetTitle: {
    ...typography.h2,
    marginBottom: spacing.lg,
  },
  trainingDaysSection: {
    marginBottom: spacing.md,
  },
  trainingDaysLabel: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  trainingDaysHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  trainingDaysGrid: {
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
  errorContainer: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.error + '15',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
  },
  sheetFooter: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sheetButton: {
    minHeight: 48,
  },
});

