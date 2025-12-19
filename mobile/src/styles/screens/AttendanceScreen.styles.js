import { StyleSheet, Platform } from 'react-native';
import { colors, spacing, radius, typography } from '../../ui/tokens';

export const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.08,
  },
  blob1: {
    width: 300,
    height: 300,
    top: -100,
    right: -100,
    backgroundColor: colors.primary,
  },
  blob2: {
    width: 200,
    height: 200,
    bottom: -50,
    left: -50,
    backgroundColor: colors.accent,
  },
  blob3: {
    width: 150,
    height: 150,
    top: '40%',
    right: '20%',
    backgroundColor: colors.secondary,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  discardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.error + '15',
    gap: spacing.xs,
  },
  discardButtonText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
  },
  calendarButton: {
    padding: spacing.sm,
  },
  statusSummary: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  statValue: {
    ...typography.h2,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  filtersSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  filterChips: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
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
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.primary,
  },
  searchInput: {
    marginBottom: 0,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100, // Space for bottom bar
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  bottomBarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
    minHeight: 56,
  },
  bottomBarButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  saveButton: {
    flex: 1,
    minHeight: 56,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h2,
  },
  calendarContainer: {
    padding: spacing.lg,
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
  },
  calendarCellOtherMonth: {
    opacity: 0.3,
  },
  calendarCellSelected: {
    backgroundColor: colors.primary + '20',
    borderWidth: 2,
    borderColor: colors.primary,
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
});
