import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import StatCard from '../../components/StatCard';
import { colors } from '../../styles/theme';

const PlayerDashboardScreen = () => {
  const { user, logout } = useAuth();
  const [player, setPlayer] = useState(null);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [playerRes, paymentRes, attendanceRes] = await Promise.all([
        apiClient.get('/player/me'),
        apiClient.get('/player/me/payments'),
        apiClient.get('/player/me/attendance'),
      ]);
      setPlayer(playerRes.data);
      setPayments(paymentRes.data || []);
      setAttendance(attendanceRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user]);

  const paymentSummary = payments.reduce(
    (acc, payment) => {
      const amountDue = parseFloat(payment.amountDue || 0);
      const amountPaid = parseFloat(payment.amountPaid || 0);
      acc.totalDue += isNaN(amountDue) ? 0 : amountDue;
      acc.totalPaid += isNaN(amountPaid) ? 0 : amountPaid;
      return acc;
    },
    { totalDue: 0, totalPaid: 0 }
  );

  const outstandingBalance = paymentSummary.totalDue > 0 
    ? paymentSummary.totalDue - paymentSummary.totalPaid
    : 0;

  const attendanceSummary = attendance.reduce(
    (acc, record) => {
      if (record.isPresent) acc.present++;
      else acc.absent++;
      acc.total++;
      return acc;
    },
    { present: 0, absent: 0, total: 0 }
  );

  const attendanceRate =
    attendanceSummary.total > 0
      ? Math.round((attendanceSummary.present / attendanceSummary.total) * 100)
      : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Player Portal</Text>
        <Text style={styles.logoutText} onPress={logout}>Logout</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>
            Welcome, {player?.fullName || user?.fullName || 'Player'}
          </Text>
          {player?.group && (
            <View style={styles.badgeContainer}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>👥 {player.group.name}</Text>
              </View>
              {player.group.sportType && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {player.group.sportType === 'basketball' ? '🏀' : '⚽'} {player.group.sportType}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {loading && !player ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : error && !player ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : player ? (
          <>
            <View style={styles.statsContainer}>
              <StatCard 
                label="Monthly Fee" 
                value={parseFloat(player.monthlyFee || 0)} 
                format="currency"
              />
              <StatCard
                label="Total Paid"
                value={paymentSummary.totalPaid}
                accent="#10b981"
                format="currency"
              />
              <StatCard
                label="Outstanding Balance"
                value={outstandingBalance}
                accent={outstandingBalance > 0 ? '#ef4444' : '#10b981'}
                format="currency"
              />
              {attendanceSummary.total > 0 && (
                <StatCard
                  label="Attendance Rate"
                  value={attendanceRate}
                  accent="#6366f1"
                  format="percentage"
                />
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Contact Information</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone:</Text>
                <Text style={styles.infoValue}>{player.phone}</Text>
              </View>
              {player?.group && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Group:</Text>
                  <Text style={styles.infoValue}>{player.group.name}</Text>
                </View>
              )}
              {player.notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.infoLabel}>Notes:</Text>
                  <Text style={styles.notesText}>{player.notes}</Text>
                </View>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Payment History</Text>
              {!payments.length ? (
                <Text style={styles.emptyText}>No payment records yet.</Text>
              ) : (
                <FlatList
                  data={payments || []}
                  keyExtractor={(item) => item._id}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <View style={styles.paymentRow}>
                      <View style={styles.paymentInfo}>
                        <Text style={styles.paymentMonth}>{item.month}</Text>
                        <Text style={styles.paymentAmount}>
                          ${parseFloat(item.amountPaid || 0).toFixed(2)} / ${parseFloat(item.amountDue || 0).toFixed(2)}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, styles[`statusBadge${item.status}`]]}>
                        <Text style={styles.statusText}>
                          {item.status === 'paid' ? '✓ Paid' : item.status === 'partial' ? '○ Partial' : '✗ Unpaid'}
                        </Text>
                      </View>
                    </View>
                  )}
                />
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Attendance History</Text>
              {!attendance.length ? (
                <Text style={styles.emptyText}>No attendance records yet.</Text>
              ) : (
                <>
                  <View style={styles.attendanceStats}>
                    <View style={styles.attendanceStat}>
                      <Text style={styles.attendanceStatValue}>{attendanceSummary.present}</Text>
                      <Text style={styles.attendanceStatLabel}>Present</Text>
                    </View>
                    <View style={styles.attendanceStat}>
                      <Text style={[styles.attendanceStatValue, { color: '#ef4444' }]}>
                        {attendanceSummary.absent}
                      </Text>
                      <Text style={styles.attendanceStatLabel}>Absent</Text>
                    </View>
                    <View style={styles.attendanceStat}>
                      <Text style={styles.attendanceStatValue}>{attendanceSummary.total}</Text>
                      <Text style={styles.attendanceStatLabel}>Total</Text>
                    </View>
                  </View>
                  <FlatList
                    data={(attendance || []).slice(0, 10)}
                    keyExtractor={(item) => item._id}
                    scrollEnabled={false}
                    renderItem={({ item }) => {
                      const date = new Date(item.date);
                      const formattedDate = date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      });
                      return (
                        <View style={[styles.attendanceRow, item.isPresent ? styles.attendancePresent : styles.attendanceAbsent]}>
                          <Text style={styles.attendanceDate}>{formattedDate}</Text>
                          <Text style={styles.attendanceStatus}>
                            {item.isPresent ? '✓ Present' : '✗ Absent'}
                          </Text>
                        </View>
                      );
                    }}
                  />
                </>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
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

export default PlayerDashboardScreen;


