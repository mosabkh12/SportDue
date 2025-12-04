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
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.bgTertiary,
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
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 20,
    lineHeight: 20,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
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
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 40,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
  },
  groupCard: {
    backgroundColor: colors.bgTertiary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  groupDescription: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 12,
    minHeight: 40,
  },
  groupInfo: {
    marginBottom: 12,
  },
  groupInfoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  groupInfoBold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  groupButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  groupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

