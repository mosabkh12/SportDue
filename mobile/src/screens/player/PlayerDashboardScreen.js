import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import StatCard from '../../components/StatCard';
import { styles } from '../../styles/screens/PlayerDashboardScreen.styles';
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

export default PlayerDashboardScreen;


