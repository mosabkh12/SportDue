import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
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
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [cancelledDates, setCancelledDates] = useState(new Set());
  const [addedDates, setAddedDates] = useState(new Set());

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
      
      // Initialize cancelled and added dates from group data
      if (playerRes.data?.group) {
        const cancelled = new Set(playerRes.data.group.cancelledDates || []);
        const added = new Set(playerRes.data.group.addedDates || []);
        setCancelledDates(cancelled);
        setAddedDates(added);
      }
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

  // Calendar helper functions
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayShortNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const getDateKey = (date) => {
    if (typeof date === 'string') {
      return date.includes('T') ? date.split('T')[0] : date;
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getCalendarDates = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const dates = [];
    const currentDate = new Date(startDate);
    
    // Generate 6 weeks of dates (42 days)
    for (let i = 0; i < 42; i++) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const isDateSelected = (date) => {
    if (!player?.group?.trainingDays || player.group.trainingDays.length === 0) return false;
    
    const dayOfWeek = date.getDay();
    const dateKey = getDateKey(date);
    
    // Check if it's a cancelled date
    if (cancelledDates.has(dateKey)) {
      return false;
    }
    
    // Check if it's an added date
    if (addedDates.has(dateKey)) {
      return true;
    }
    
    // Check if it's a recurring training day
    return player.group.trainingDays.includes(dayOfWeek);
  };

  const isDateCancelled = (date) => {
    const dateKey = getDateKey(date);
    return cancelledDates.has(dateKey);
  };

  const isDateAdded = (date) => {
    const dateKey = getDateKey(date);
    return addedDates.has(dateKey);
  };

  const isDateInCurrentMonth = (date) => {
    return date.getMonth() === currentMonth;
  };

  const handleDateClick = (date) => {
    const dateKey = getDateKey(date);
    if (selectedDate && getDateKey(selectedDate) === dateKey) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
    }
  };

  const getTimeForDate = (date) => {
    if (!player?.group?.trainingTime) return null;
    
    const dateKey = getDateKey(date);
    // Check if there's a custom time for this specific date
    if (player.group.dateTimes && player.group.dateTimes[dateKey]) {
      return {
        startTime: player.group.dateTimes[dateKey].startTime || player.group.trainingTime.startTime || '18:00',
        endTime: player.group.dateTimes[dateKey].endTime || player.group.trainingTime.endTime || '19:30',
      };
    }
    // Otherwise return default time
    return {
      startTime: player.group.trainingTime.startTime || '18:00',
      endTime: player.group.trainingTime.endTime || '19:30',
    };
  };

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

            {player?.group && player.group.trainingDays && player.group.trainingDays.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>📅 Training Schedule</Text>
                
                {/* Selected Days Indicator */}
                {player.group.trainingDays.length > 0 && (
                  <View style={styles.selectedDaysPreview}>
                    <Text style={styles.selectedDaysPreviewText}>
                      ✓ {player.group.trainingDays.length} day{player.group.trainingDays.length > 1 ? 's' : ''} selected: {player.group.trainingDays.map((d) => dayNames[d]).join(', ')}
                    </Text>
                  </View>
                )}

                {/* Month/Year Navigation */}
                <View style={styles.monthNavigation}>
                  <TouchableOpacity
                    style={styles.monthNavButton}
                    onPress={() => navigateMonth('prev')}
                  >
                    <Text style={styles.monthNavButtonText}>←</Text>
                  </TouchableOpacity>
                  <View style={styles.monthYearContainer}>
                    <Text style={styles.monthYearText}>
                      {monthNames[currentMonth]} {currentYear}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.monthNavButton}
                    onPress={() => navigateMonth('next')}
                  >
                    <Text style={styles.monthNavButtonText}>→</Text>
                  </TouchableOpacity>
                </View>

                {/* Calendar Grid */}
                <View style={styles.calendarContainer}>
                  {/* Day Headers */}
                  <View style={styles.calendarHeader}>
                    {dayShortNames.map((day, index) => (
                      <View key={index} style={styles.calendarHeaderCell}>
                        <Text style={styles.calendarHeaderText}>{day}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Calendar Dates */}
                  <View style={styles.calendarGrid}>
                    {getCalendarDates().map((date, index) => {
                      const isSelected = isDateSelected(date);
                      const isCancelled = isDateCancelled(date);
                      const isAdded = isDateAdded(date);
                      const isCurrentMonth = isDateInCurrentMonth(date);
                      const dateNumber = date.getDate();
                      const dateKey = getDateKey(date);
                      const isThisDateSelected = selectedDate && getDateKey(selectedDate) === dateKey;
                      
                      return (
                        <View key={index} style={styles.calendarCell}>
                          <TouchableOpacity
                            style={[
                              styles.calendarDayButton,
                              !isCurrentMonth && styles.calendarDayButtonOtherMonth,
                              isSelected && isCurrentMonth && !isCancelled && styles.calendarDayButtonSelected,
                              isCancelled && isCurrentMonth && styles.calendarDayButtonCancelled,
                              isAdded && isCurrentMonth && styles.calendarDayButtonAdded,
                              isThisDateSelected && styles.calendarDayButtonSelectedDate,
                            ]}
                            onPress={() => {
                              if (isCurrentMonth && isSelected) {
                                handleDateClick(date);
                              }
                            }}
                            activeOpacity={0.7}
                            disabled={!isCurrentMonth || !isSelected}
                          >
                            <Text
                              style={[
                                styles.calendarDayText,
                                !isCurrentMonth && styles.calendarDayTextOtherMonth,
                                isSelected && isCurrentMonth && !isCancelled && styles.calendarDayTextSelected,
                                isCancelled && isCurrentMonth && styles.calendarDayTextCancelled,
                                isAdded && isCurrentMonth && styles.calendarDayTextAdded,
                              ]}
                            >
                              {dateNumber}
                            </Text>
                            {isCancelled && isCurrentMonth && (
                              <View style={styles.cancelledIndicator}>
                                <Text style={styles.cancelledIndicatorText}>✕</Text>
                              </View>
                            )}
                            {isAdded && isCurrentMonth && (
                              <View style={styles.addedIndicator}>
                                <Text style={styles.addedIndicatorText}>+</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Time Display for Selected Date */}
                {selectedDate && isDateSelected(selectedDate) && (
                  <View style={styles.selectedDateTimeContainer}>
                    <Text style={styles.selectedDateTitle}>
                      {dayNames[selectedDate.getDay()]}, {monthNames[selectedDate.getMonth()]} {selectedDate.getDate()}
                    </Text>
                    {getTimeForDate(selectedDate) && (
                      <View style={styles.timeDisplayContainer}>
                        <View style={styles.timeSlot}>
                          <Text style={styles.timeSlotLabel}>Start Time</Text>
                          <Text style={styles.timeSlotValue}>{getTimeForDate(selectedDate).startTime}</Text>
                        </View>
                        <View style={styles.timeSlot}>
                          <Text style={styles.timeSlotLabel}>End Time</Text>
                          <Text style={styles.timeSlotValue}>{getTimeForDate(selectedDate).endTime}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Default Time (shown when no date is selected) */}
                {!selectedDate && player.group.trainingTime && (
                  <View style={styles.defaultTimeContainer}>
                    <Text style={styles.defaultTimeTitle}>Default Session Time</Text>
                    <Text style={styles.defaultTimeSubtitle}>
                      Tap on a blue date above to see the time for that day
                    </Text>
                    <View style={styles.timeDisplayContainer}>
                      <View style={styles.timeSlot}>
                        <Text style={styles.timeSlotLabel}>Start Time</Text>
                        <Text style={styles.timeSlotValue}>{player.group.trainingTime.startTime || '18:00'}</Text>
                      </View>
                      <View style={styles.timeSlot}>
                        <Text style={styles.timeSlotLabel}>End Time</Text>
                        <Text style={styles.timeSlotValue}>{player.group.trainingTime.endTime || '19:30'}</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}

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


