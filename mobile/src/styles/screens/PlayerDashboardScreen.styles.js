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
  welcomeCard: {
    backgroundColor: colors.bgSecondary,
    padding: 20,
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
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
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginRight: 8,
    width: 80,
  },
  infoValue: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  notesContainer: {
    marginTop: 8,
  },
  notesText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 20,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentMonth: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: 14,
    color: colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgepaid: {
    backgroundColor: '#10b98120',
  },
  statusBadgepartial: {
    backgroundColor: '#f59e0b20',
  },
  statusBadgeunpaid: {
    backgroundColor: '#ef444420',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  attendanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: colors.bgTertiary,
    borderRadius: 12,
  },
  attendanceStat: {
    alignItems: 'center',
  },
  attendanceStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  attendanceStatLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  attendancePresent: {
    backgroundColor: '#10b98120',
  },
  attendanceAbsent: {
    backgroundColor: '#ef444420',
  },
  attendanceDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  attendanceStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  loader: {
    marginVertical: 40,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
});

