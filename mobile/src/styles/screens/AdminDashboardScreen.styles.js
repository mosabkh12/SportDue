import { StyleSheet } from 'react-native';
import { colors } from '../theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  logoutText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: 20,
    margin: 16,
    marginTop: 0,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.bgTertiary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 2,
    borderColor: colors.border,
  },
  sportTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  sportButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.bgTertiary,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  sportButtonActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}20`,
  },
  sportButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 40,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  coachCard: {
    backgroundColor: colors.bgTertiary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  coachHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  coachName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  coachEmail: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 4,
  },
  coachPassword: {
    fontSize: 12,
    color: colors.primary,
    fontFamily: 'monospace',
  },
  sportBadge: {
    backgroundColor: colors.bgSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sportBadgeText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  coachStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  coachStat: {
    fontSize: 12,
    color: colors.textMuted,
  },
  coachActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButton: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deleteButton: {
    backgroundColor: `${colors.error}20`,
    borderWidth: 1,
    borderColor: colors.error,
  },
  actionButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  modalBody: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  modalList: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 8,
  },
  modalWarning: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.error,
    marginTop: 12,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonDelete: {
    backgroundColor: colors.error,
  },
  modalButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

