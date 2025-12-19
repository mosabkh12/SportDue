import { StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../../ui/tokens';

export const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  profileHeaderCard: {
    marginBottom: spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  profileEmail: {
    ...typography.body,
    color: colors.textMuted,
  },
  sectionCard: {
    marginBottom: spacing.lg,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleItemLast: {
    borderBottomWidth: 0,
  },
  listItemNoBorder: {
    borderBottomWidth: 0,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleIcon: {
    marginRight: spacing.md,
  },
  toggleContent: {
    flex: 1,
  },
  toggleTitle: {
    ...typography.body,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  toggleSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  sheetContent: {
    flex: 1,
  },
  sheetTitle: {
    ...typography.h2,
    marginBottom: spacing.lg,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
    color: colors.textPrimary,
  },
  input: {
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48,
  },
  inputDisabled: {
    opacity: 0.6,
    backgroundColor: colors.bgQuaternary,
  },
  inputHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  errorContainer: {
    marginBottom: spacing.md,
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
