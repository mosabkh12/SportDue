import { StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../../ui/tokens';

export const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    ...typography.h1,
    marginBottom: spacing.xs,
  },
  date: {
    ...typography.body,
    color: colors.textSecondary,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextSessionCard: {
    marginBottom: spacing.xl,
  },
  nextSessionContent: {
    gap: spacing.lg,
  },
  nextSessionInfo: {
    gap: spacing.sm,
  },
  nextSessionTeam: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  nextSessionDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  nextSessionTime: {
    ...typography.body,
    color: colors.textSecondary,
  },
  nextSessionIcon: {
    marginLeft: spacing.sm,
  },
  nextSessionLocation: {
    ...typography.body,
    color: colors.textSecondary,
  },
  nextSessionActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  nextSessionButton: {
    flex: 1,
    minHeight: 48,
  },
  noSessionContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  noSessionText: {
    ...typography.body,
    color: colors.textMuted,
  },
  noSessionButton: {
    minWidth: 200,
    minHeight: 48,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionHeaderLeft: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  sectionHeaderRight: {
    marginLeft: spacing.md,
  },
  sectionHeaderSpacing: {
    marginTop: spacing.xl,
  },
  viewAllText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  quickActionsContainer: {
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  quickActionTile: {
    width: 120,
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    gap: spacing.md,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionTitle: {
    ...typography.body,
    textAlign: 'center',
    fontWeight: '600',
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
  teamCardHeader: {
    marginBottom: spacing.md,
  },
  teamCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
    gap: spacing.md,
  },
  teamActionButton: {
    flex: 1,
    minHeight: 44,
  },
  loaderContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
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
});

