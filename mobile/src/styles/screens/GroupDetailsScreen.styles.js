import { StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    marginTop: 100,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  backIcon: {
    fontSize: 18,
    color: colors.textPrimary,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 14,
  },
  headerSchedule: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 4,
    fontWeight: '600',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 16,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: colors.bgSecondary,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 3,
  },
  quickStatLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 10,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 6,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
  },
  secondaryBtn: {
    backgroundColor: '#3b82f6',
  },
  configBtn: {
    backgroundColor: '#8b5cf6',
  },
  reminderBtn: {
    backgroundColor: '#f59e0b',
  },
  actionBtnIcon: {
    fontSize: 14,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    padding: 10,
    paddingTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: 6,
  },
  sectionCount: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  playerAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  playerPhone: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  playerBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  badge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  badgePassword: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'monospace',
  },
  playerFee: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  playerFeeAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  playerFeeLabel: {
    fontSize: 9,
    color: colors.textMuted,
  },
  chevron: {
    fontSize: 18,
    color: colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderTopWidth: 2,
    borderTopColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalClose: {
    fontSize: 24,
    color: colors.textMuted,
    width: 32,
    height: 32,
    textAlign: 'center',
    lineHeight: 32,
  },
  modalBody: {
    padding: 20,
    maxHeight: 500,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.bgTertiary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  inputHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 8,
  },
  infoBox: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    marginTop: 8,
  },
  infoBoxText: {
    fontSize: 13,
    color: '#22c55e',
    fontWeight: '600',
    lineHeight: 18,
  },
  resultBox: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 2,
  },
  resultBoxSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10b981',
  },
  resultBoxError: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#ef4444',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  resultTitleSuccess: {
    color: '#10b981',
  },
  resultTitleError: {
    color: '#ef4444',
  },
  resultText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  testModeWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  testModeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f59e0b',
    marginBottom: 8,
  },
  testModeText: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 20,
    marginTop: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
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
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalBtnTextPrimary: {
    color: '#fff',
  },
});

