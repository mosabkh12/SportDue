import { StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../../ui/tokens';

export const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.md,
  },
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekNavButton: {
    padding: spacing.sm,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekNavCurrent: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  weekNavText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  filterSection: {
    marginBottom: spacing.lg,
  },
  filterLabel: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
    color: colors.textSecondary,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgTertiary,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  filterCheckIcon: {
    marginLeft: spacing.xs,
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
    paddingHorizontal: spacing.lg,
  },
  emptyButton: {
    marginTop: spacing.md,
    minWidth: 200,
  },
  daysList: {
    gap: spacing.md,
  },
  dayCard: {
    marginBottom: 0,
  },
  dayCardToday: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  dayCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dayCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dayName: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  dayNameToday: {
    color: colors.primary,
  },
  dayDate: {
    ...typography.body,
    color: colors.textMuted,
  },
  dayDateToday: {
    color: colors.primary,
    fontWeight: '600',
  },
  todayBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  todayBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  sessionsList: {
    gap: spacing.sm,
  },
  sessionCard: {
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  sessionCardContent: {
    padding: spacing.md,
  },
  sessionInfo: {
    marginBottom: spacing.md,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  sessionTeamName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  sessionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sessionBadgeText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
    fontSize: 10,
  },
  sessionTime: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 26, // Align with team name (icon width + gap)
  },
  sessionActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sessionActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  sessionActionButtonSecondary: {
    backgroundColor: colors.bgSecondary,
    borderColor: colors.border,
  },
  sessionActionText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary,
  },
  sessionActionTextSecondary: {
    color: colors.textSecondary,
  },
});

