import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from '../../context/NotificationContext';
import apiClient from '../../services/apiClient';
import StatCard from '../../components/StatCard';
import { styles } from '../../styles/screens/AttendanceScreen.styles';
import { colors } from '../../styles/theme';

const AttendanceScreen = ({ route }) => {
  const { groupId } = route.params;
  const navigation = useNavigation();
  const notifications = useNotifications();

  const today = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);
  const [date, setDate] = useState(today);
  const [players, setPlayers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [group, setGroup] = useState(null);
  const [trainingDays, setTrainingDays] = useState([]);
  const [trainingTime, setTrainingTime] = useState(null);
  const [trainingSchedule, setTrainingSchedule] = useState({
    trainingDays: [],
    trainingTime: { startTime: '18:00', endTime: '19:30' },
  });
  const [dayTimes, setDayTimes] = useState({}); // Store times per day
  const [modifiedDays, setModifiedDays] = useState(new Set()); // Track modified days
  const [selectedDayForTime, setSelectedDayForTime] = useState(null); // Day selected for time editing
  const [cancelledDates, setCancelledDates] = useState(new Set()); // Track cancelled specific dates
  const [addedDates, setAddedDates] = useState(new Set()); // Track added replacement dates
  const [selectedDate, setSelectedDate] = useState(null); // Currently selected date for actions
  const [selectedDateForTime, setSelectedDateForTime] = useState(null); // Specific date selected for time editing
  const [dateTimes, setDateTimes] = useState({}); // Store custom times for specific dates (YYYY-MM-DD format)
  const [lastTap, setLastTap] = useState({ date: null, time: 0 }); // Track double tap
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [updatingSchedule, setUpdatingSchedule] = useState(false);
  const [showScheduleConfig, setShowScheduleConfig] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchPlayers = useCallback(async () => {
    try {
      const { data } = await apiClient.get(`/groups/${groupId}`);
      setPlayers(data.players || []);
      setGroup(data.group);
      setTrainingDays(data.group?.trainingDays || []);
      setTrainingTime(data.group?.trainingTime || null);
      const defaultTime = data.group?.trainingTime || { startTime: '18:00', endTime: '19:30' };
      const days = data.group?.trainingDays || [];
      const initialDayTimes = {};
      days.forEach((day) => {
        initialDayTimes[day] = defaultTime;
      });
      setTrainingSchedule({
        trainingDays: days,
        trainingTime: defaultTime,
      });
      setDayTimes(initialDayTimes);
      setModifiedDays(new Set());
      // Load cancelled and added dates if they exist
      if (data.group?.cancelledDates && Array.isArray(data.group.cancelledDates)) {
        setCancelledDates(new Set(data.group.cancelledDates));
      } else {
        setCancelledDates(new Set());
      }
      if (data.group?.addedDates && Array.isArray(data.group.addedDates)) {
        setAddedDates(new Set(data.group.addedDates));
      } else {
        setAddedDates(new Set());
      }
      // Load per-date times from backend if they exist
      if (data.group?.dateTimes && typeof data.group.dateTimes === 'object') {
        setDateTimes(data.group.dateTimes);
      } else {
        setDateTimes({});
      }
    } catch (err) {
      notifications.error(err.message || 'Failed to load group');
    }
  }, [groupId, notifications]);

  const fetchAttendance = useCallback(
    async (targetDate) => {
      try {
        const { data } = await apiClient.get(`/attendance/group/${groupId}`, {
          params: { date: targetDate },
        });
        const mapped = {};
        data.forEach((item) => {
          mapped[item.playerId] = {
            status: item.isPresent ? 'present' : 'absent',
            isPresent: item.isPresent,
            signature: item.signature || '',
          };
        });
        setAttendance(mapped);
      } catch (err) {
        // Silent error - attendance might not exist for this date
      }
    },
    [groupId]
  );

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  useEffect(() => {
    fetchAttendance(date);
  }, [date, fetchAttendance]);

  const handleStatusChange = (playerId, value) => {
    setAttendance((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        status: value === '' ? null : value,
        isPresent: value === 'present',
      },
    }));
  };

  const handleSignatureChange = (playerId, value) => {
    setAttendance((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        signature: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries = players
        .filter((player) => {
          const playerAttendance = attendance[player._id];
          return playerAttendance?.status === 'present' || playerAttendance?.status === 'absent';
        })
        .map((player) => ({
          playerId: player._id,
          isPresent: attendance[player._id]?.status === 'present',
          signature: attendance[player._id]?.signature || '',
        }));

      if (entries.length === 0) {
        notifications.error('Please select status (Present or Absent) for at least one player');
        setSaving(false);
        return;
      }

      await apiClient.post('/attendance/mark', {
        groupId,
        date,
        records: entries,
      });
      notifications.success('Attendance saved successfully!');
      fetchAttendance(date);
    } catch (err) {
      notifications.error(err.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    const withStatus = players.filter((p) => {
      const status = attendance[p._id]?.status;
      return status === 'present' || status === 'absent';
    });
    const present = players.filter((p) => attendance[p._id]?.status === 'present').length;
    const absent = players.filter((p) => attendance[p._id]?.status === 'absent').length;
    const unmarked = players.length - withStatus.length;
    const percentage = withStatus.length > 0 ? Math.round((present / withStatus.length) * 100) : 0;
    return { present, absent, unmarked, total: players.length, withStatus: withStatus.length, percentage };
  }, [players, attendance]);

  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return players;
    const query = searchQuery.toLowerCase();
    return players.filter((p) => p.fullName.toLowerCase().includes(query));
  }, [players, searchQuery]);

  const markAllPresent = () => {
    const updated = {};
    players.forEach((player) => {
      updated[player._id] = {
        status: 'present',
        isPresent: true,
        signature: attendance[player._id]?.signature || '',
      };
    });
    setAttendance(updated);
  };

  const markAllAbsent = () => {
    const updated = {};
    players.forEach((player) => {
      updated[player._id] = {
        status: 'absent',
        isPresent: false,
        signature: attendance[player._id]?.signature || '',
      };
    });
    setAttendance(updated);
  };

  const isTrainingDay = (dateString) => {
    if (trainingDays.length === 0) return true;
    // Parse date string as local date (not UTC)
    const [year, month, day] = dateString.split('-').map(Number);
    const checkDate = new Date(year, month - 1, day);
    const dayOfWeek = checkDate.getDay();
    return trainingDays.includes(dayOfWeek);
  };

  const navigateToTrainingDay = (direction) => {
    // Parse date string as local date
    const [year, month, day] = date.split('-').map(Number);
    const currentDate = new Date(year, month - 1, day);
    let daysToAdd = direction === 'next' ? 1 : -1;
    let attempts = 0;
    const maxAttempts = 14;

    while (attempts < maxAttempts) {
      currentDate.setDate(currentDate.getDate() + daysToAdd);
      const dateString = getDateKey(currentDate);

      if (trainingDays.length === 0 || isTrainingDay(dateString)) {
        setDate(dateString);
        return;
      }
      attempts++;
    }
    navigateDate(direction === 'next' ? 1 : -1);
  };

  const navigateDate = (days) => {
    // Parse date string as local date
    const [year, month, day] = date.split('-').map(Number);
    const currentDate = new Date(year, month - 1, day);
    currentDate.setDate(currentDate.getDate() + days);
    setDate(getDateKey(currentDate));
  };

  const setDateToday = () => setDate(today);

  const handleUpdateTrainingSchedule = async () => {
    if (trainingSchedule.trainingDays.length === 0 && addedDates.size === 0) {
      notifications.error('Please select at least one training day or add a replacement date');
      return;
    }

    setUpdatingSchedule(true);
    try {
      // Use the default time if no per-day times are set
      const scheduleTime = trainingSchedule.trainingTime;
      await apiClient.put(`/groups/${groupId}`, {
        trainingDays: trainingSchedule.trainingDays,
        trainingTime: scheduleTime,
        cancelledDates: Array.from(cancelledDates),
        addedDates: Array.from(addedDates),
        dateTimes: Object.keys(dateTimes).length > 0 ? dateTimes : undefined,
      });
      const dayNames = trainingSchedule.trainingDays.map(
        (d) => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d]
      );
      let message = `Training schedule updated: ${dayNames.join(', ')} from ${scheduleTime.startTime} to ${scheduleTime.endTime}`;
      if (cancelledDates.size > 0) {
        message += `\n${cancelledDates.size} date(s) cancelled`;
      }
      if (addedDates.size > 0) {
        message += `\n${addedDates.size} replacement date(s) added`;
      }
      notifications.success(message);
      fetchPlayers();
      setTrainingDays(trainingSchedule.trainingDays);
      setTrainingTime(scheduleTime);
      setModifiedDays(new Set());
      setSelectedDayForTime(null);
      setSelectedDate(null);
      setSelectedDateForTime(null);
      setShowScheduleConfig(false);
    } catch (err) {
      notifications.error(err.response?.data?.message || err.message || 'Failed to update training schedule');
    } finally {
      setUpdatingSchedule(false);
    }
  };

  const handleDayRemove = (dayIndex) => {
    const newModifiedDays = new Set(modifiedDays);
    setTrainingSchedule((prev) => ({
      ...prev,
      trainingDays: prev.trainingDays.filter((d) => d !== dayIndex),
    }));
    setDayTimes((prev) => {
      const updated = { ...prev };
      delete updated[dayIndex];
      return updated;
    });
    newModifiedDays.add(dayIndex);
    setModifiedDays(newModifiedDays);
    if (selectedDayForTime === dayIndex) {
      setSelectedDayForTime(null);
    }
  };

  const handleDayTimeChange = (dayIndex, field, value) => {
    setDayTimes((prev) => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        [field]: value,
      },
    }));
    const newModifiedDays = new Set(modifiedDays);
    newModifiedDays.add(dayIndex);
    setModifiedDays(newModifiedDays);
  };

  const handleDateTimeChange = (dateKey, field, value) => {
    setDateTimes((prev) => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey] || trainingSchedule.trainingTime,
        [field]: value,
      },
    }));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPlayers(), fetchAttendance(date)]);
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    // Parse date string as local date (not UTC)
    const [year, month, day] = dateString.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
    const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
    return `${dayName}, ${monthName} ${d.getDate()}`;
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayShortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthShortNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Generate calendar dates for current month
  const getCalendarDates = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
    
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

  const getDateKey = (date) => {
    if (typeof date === 'string') {
      // If it's already a string in YYYY-MM-DD format, return it
      return date.includes('T') ? date.split('T')[0] : date;
    }
    // If it's a Date object, convert to YYYY-MM-DD using local timezone (not UTC)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to check if current selected date is cancelled
  const isCurrentDateCancelled = () => {
    const dateKey = getDateKey(date);
    return cancelledDates.has(dateKey);
  };

  // Helper to check if current selected date is added
  const isCurrentDateAdded = () => {
    const dateKey = getDateKey(date);
    return addedDates.has(dateKey);
  };

  const isDateSelected = (date) => {
    const dayOfWeek = date.getDay();
    const dateKey = getDateKey(date);
    
    // Check if it's a cancelled date (exception)
    if (cancelledDates.has(dateKey)) {
      return false;
    }
    
    // Check if it's an added date (replacement)
    if (addedDates.has(dateKey)) {
      return true;
    }
    
    // Check if it's part of the recurring schedule
    return trainingSchedule.trainingDays.includes(dayOfWeek);
  };

  const isDateCancelled = (date) => {
    const dateKey = getDateKey(date);
    return cancelledDates.has(dateKey);
  };

  const isDateAdded = (date) => {
    const dateKey = getDateKey(date);
    return addedDates.has(dateKey);
  };

  const isDateModified = (date) => {
    const dayOfWeek = date.getDay();
    const dateKey = getDateKey(date);
    return modifiedDays.has(dayOfWeek) || cancelledDates.has(dateKey) || addedDates.has(dateKey);
  };

  const isDateInCurrentMonth = (date) => {
    return date.getMonth() === currentMonth;
  };

  const handleDateClick = (date) => {
    if (!isDateInCurrentMonth(date)) return;
    
    const dateKey = getDateKey(date);
    const dayOfWeek = date.getDay();
    const isRecurringDay = trainingSchedule.trainingDays.includes(dayOfWeek);
    const isSelected = isDateSelected(date);
    const isCancelled = isDateCancelled(date);
    
    // Check for double tap (within 300ms)
    const now = Date.now();
    const isDoubleTap = lastTap.date === dateKey && (now - lastTap.time) < 300;
    
    if (isDoubleTap && isSelected && !isCancelled) {
      // Double tap: Cancel this specific date
      const newCancelled = new Set(cancelledDates);
      newCancelled.add(dateKey);
      setCancelledDates(newCancelled);
      setSelectedDateForTime(null);
      setLastTap({ date: null, time: 0 });
    } else if (isSelected && !isCancelled) {
      // Single tap on training day: Select for time editing
      setSelectedDateForTime(date);
      setSelectedDate(date);
      // Initialize time for this date if not set
      if (!dateTimes[dateKey]) {
        setDateTimes((prev) => ({
          ...prev,
          [dateKey]: trainingSchedule.trainingTime,
        }));
      }
      setLastTap({ date: dateKey, time: now });
    } else if (isCancelled) {
      // Single tap on cancelled date: Restore it
      const newCancelled = new Set(cancelledDates);
      newCancelled.delete(dateKey);
      setCancelledDates(newCancelled);
      setSelectedDateForTime(null);
      setLastTap({ date: null, time: 0 });
    } else if (isDateAdded(date)) {
      // Single tap on added date: Remove it
      const newAdded = new Set(addedDates);
      newAdded.delete(dateKey);
      setAddedDates(newAdded);
      setSelectedDateForTime(null);
      setLastTap({ date: null, time: 0 });
    } else {
      // Single tap on non-training day: Add as replacement date
      const newAdded = new Set(addedDates);
      newAdded.add(dateKey);
      setAddedDates(newAdded);
      setSelectedDateForTime(date);
      // Initialize time for this date if not set
      if (!dateTimes[dateKey]) {
        setDateTimes((prev) => ({
          ...prev,
          [dateKey]: trainingSchedule.trainingTime,
        }));
      }
      setSelectedDate(date);
      setLastTap({ date: dateKey, time: now });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Attendance</Text>
          <Text style={styles.subtitle}>Mark player attendance</Text>
        </View>

        {/* Schedule Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.cardTitle}>Training Schedule</Text>
              {trainingDays.length > 0 ? (
                <View style={styles.scheduleInfo}>
                  <Text style={styles.scheduleDays}>
                    📅 {trainingDays.map((d) => dayNames[d]).join(', ')}
                  </Text>
                  {trainingTime && (
                    <Text style={styles.scheduleTime}>
                      ⏰ {trainingTime.startTime || '18:00'} - {trainingTime.endTime || '19:30'}
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={styles.noScheduleText}>
                  ⚠️ No schedule configured. Set training days and times.
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.configButton}
              onPress={() => setShowScheduleConfig(true)}
            >
              <Text style={styles.configButtonText}>⚙️ Configure</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select Date</Text>
          <View style={styles.dateContainer}>
            <TextInput
              style={[
                styles.dateInput,
                isCurrentDateCancelled() && styles.dateInputCancelled,
                !isCurrentDateCancelled() && isTrainingDay(date) && trainingDays.length > 0 && styles.dateInputTraining,
                !isCurrentDateCancelled() && !isTrainingDay(date) && trainingDays.length > 0 && styles.dateInputNotTraining,
              ]}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
            />
            {isCurrentDateCancelled() && (
              <Text style={styles.dateWarning}>✕ This day has been cancelled</Text>
            )}
            {!isCurrentDateCancelled() && isCurrentDateAdded() && (
              <Text style={styles.dateSuccess}>+ Replacement date (added)</Text>
            )}
            {!isCurrentDateCancelled() && !isCurrentDateAdded() && !isTrainingDay(date) && trainingDays.length > 0 && (
              <Text style={styles.dateWarning}>⚠️ Not a scheduled training day</Text>
            )}
            {!isCurrentDateCancelled() && !isCurrentDateAdded() && isTrainingDay(date) && trainingDays.length > 0 && (
              <Text style={styles.dateSuccess}>✓ Scheduled training day</Text>
            )}
          </View>
          <Text style={styles.dateDisplay}>{formatDate(date)}</Text>
          <View style={styles.dateNavButtons}>
            {trainingDays.length > 0 ? (
              <>
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() => navigateToTrainingDay('prev')}
                >
                  <Text style={styles.navButtonText}>← Previous</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navButton} onPress={setDateToday}>
                  <Text style={styles.navButtonText}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() => navigateToTrainingDay('next')}
                >
                  <Text style={styles.navButtonText}>Next →</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.navButton} onPress={() => navigateDate(-1)}>
                  <Text style={styles.navButtonText}>←</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navButton} onPress={setDateToday}>
                  <Text style={styles.navButtonText}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navButton} onPress={() => navigateDate(1)}>
                  <Text style={styles.navButtonText}>→</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <StatCard label="Present" value={stats.present} accent={colors.success} />
          <StatCard label="Absent" value={stats.absent} accent={colors.error} />
          <StatCard label="Unmarked" value={stats.unmarked} accent={colors.textMuted} />
          {stats.withStatus > 0 && (
            <StatCard label="Rate" value={stats.percentage} accent={colors.warning} format="percentage" />
          )}
        </View>

        {/* Players List */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Players ({filteredPlayers.length})</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.quickActionButton} onPress={markAllPresent}>
                <Text style={styles.quickActionText}>✓ All Present</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionButton} onPress={markAllAbsent}>
                <Text style={styles.quickActionText}>✗ All Absent</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Search players..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {filteredPlayers.length === 0 ? (
            <Text style={styles.emptyText}>No players found</Text>
          ) : (
            <FlatList
              data={filteredPlayers}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
              renderItem={({ item: player }) => {
                const status = attendance[player._id]?.status || '';
                const isPresent = status === 'present';
                const isAbsent = status === 'absent';
                return (
                  <View
                    style={[
                      styles.playerRow,
                      isPresent && styles.playerRowPresent,
                      isAbsent && styles.playerRowAbsent,
                    ]}
                  >
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName}>{player.fullName}</Text>
                    </View>
                    <View style={styles.playerActions}>
                      <View style={styles.statusButtons}>
                        <TouchableOpacity
                          style={[
                            styles.statusButton,
                            isPresent && styles.statusButtonActive,
                            isPresent && styles.statusButtonPresent,
                          ]}
                          onPress={() => handleStatusChange(player._id, isPresent ? '' : 'present')}
                        >
                          <Text
                            style={[
                              styles.statusButtonText,
                              isPresent && styles.statusButtonTextActive,
                            ]}
                          >
                            ✓
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.statusButton,
                            isAbsent && styles.statusButtonActive,
                            isAbsent && styles.statusButtonAbsent,
                          ]}
                          onPress={() => handleStatusChange(player._id, isAbsent ? '' : 'absent')}
                        >
                          <Text
                            style={[
                              styles.statusButtonText,
                              isAbsent && styles.statusButtonTextActive,
                            ]}
                          >
                            ✗
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <TextInput
                        style={styles.signatureInput}
                        placeholder="Signature"
                        placeholderTextColor={colors.textMuted}
                        value={attendance[player._id]?.signature || ''}
                        onChangeText={(value) => handleSignatureChange(player._id, value)}
                      />
                    </View>
                  </View>
                );
              }}
            />
          )}

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>💾 Save Attendance</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Schedule Configuration Modal */}
      <Modal
        visible={showScheduleConfig}
        transparent
        animationType="slide"
        onRequestClose={() => setShowScheduleConfig(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📅 Configure Training Schedule</Text>
              <TouchableOpacity onPress={() => setShowScheduleConfig(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalSubtitle}>
                Select recurring training days below. Then use calendar to cancel specific dates or add replacements.
              </Text>

              {/* Day of Week Selector */}
              <View style={styles.dayOfWeekSelector}>
                <View style={styles.selectorHeader}>
                  <View style={styles.selectorIconContainer}>
                    <Text style={styles.selectorIcon}>📅</Text>
                  </View>
                  <View style={styles.selectorHeaderText}>
                    <Text style={styles.selectorTitle}>Recurring Training Days</Text>
                    <Text style={styles.selectorSubtitle}>
                      Select days that repeat every week
                    </Text>
                  </View>
                </View>
                <View style={styles.dayOfWeekGrid}>
                  {dayNames.map((day, index) => {
                    const isSelected = trainingSchedule.trainingDays.includes(index);
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.dayOfWeekButton,
                          isSelected && styles.dayOfWeekButtonSelected,
                        ]}
                        onPress={() => {
                          if (isSelected) {
                            // Remove from recurring schedule
                            setTrainingSchedule((prev) => ({
                              ...prev,
                              trainingDays: prev.trainingDays.filter((d) => d !== index),
                            }));
                            setDayTimes((prev) => {
                              const updated = { ...prev };
                              delete updated[index];
                              return updated;
                            });
                            const newModifiedDays = new Set(modifiedDays);
                            newModifiedDays.add(index);
                            setModifiedDays(newModifiedDays);
                            if (selectedDayForTime === index) {
                              setSelectedDayForTime(null);
                            }
                          } else {
                            // Add to recurring schedule
                            setTrainingSchedule((prev) => ({
                              ...prev,
                              trainingDays: [...prev.trainingDays, index].sort((a, b) => a - b),
                            }));
                            setDayTimes((prev) => ({
                              ...prev,
                              [index]: trainingSchedule.trainingTime,
                            }));
                            const newModifiedDays = new Set(modifiedDays);
                            newModifiedDays.add(index);
                            setModifiedDays(newModifiedDays);
                          }
                        }}
                        activeOpacity={0.6}
                      >
                        {isSelected && <View style={styles.dayOfWeekGlow} />}
                        <Text
                          style={[
                            styles.dayOfWeekButtonText,
                            isSelected && styles.dayOfWeekButtonTextSelected,
                          ]}
                        >
                          {dayShortNames[index]}
                        </Text>
                        {isSelected && (
                          <View style={styles.dayOfWeekCheckmarkContainer}>
                            <Text style={styles.dayOfWeekCheckmark}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {trainingSchedule.trainingDays.length > 0 && (
                  <View style={styles.selectedDaysPreview}>
                    <Text style={styles.selectedDaysPreviewText}>
                      ✓ {trainingSchedule.trainingDays.length} day{trainingSchedule.trainingDays.length > 1 ? 's' : ''} selected: {trainingSchedule.trainingDays.map((d) => dayNames[d]).join(', ')}
                    </Text>
                  </View>
                )}
              </View>

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

              {/* Full Calendar Grid */}
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
                    const dayOfWeek = date.getDay();
                    const isSelected = isDateSelected(date);
                    const isCancelled = isDateCancelled(date);
                    const isAdded = isDateAdded(date);
                    const isModified = isDateModified(date);
                    const isCurrentMonth = isDateInCurrentMonth(date);
                    const dateNumber = date.getDate();
                    const dateKey = getDateKey(date);
                    const isTimeSelected = selectedDayForTime === dayOfWeek && isSelected;
                    const isThisDateSelected = selectedDate && getDateKey(selectedDate) === dateKey;
                    const isThisDateForTime = selectedDateForTime && getDateKey(selectedDateForTime) === dateKey;
                    
                    return (
                      <View key={index} style={styles.calendarCell}>
                        <TouchableOpacity
                          style={[
                            styles.calendarDayButton,
                            !isCurrentMonth && styles.calendarDayButtonOtherMonth,
                            isSelected && isCurrentMonth && !isCancelled && styles.calendarDayButtonSelected,
                            isCancelled && isCurrentMonth && styles.calendarDayButtonCancelled,
                            isAdded && isCurrentMonth && styles.calendarDayButtonAdded,
                            isTimeSelected && styles.calendarDayButtonActive,
                            isThisDateSelected && styles.calendarDayButtonSelectedDate,
                            isThisDateForTime && styles.calendarDayButtonTimeSelected,
                          ]}
                          onPress={() => {
                            if (isCurrentMonth) {
                              handleDateClick(date);
                            }
                          }}
                          activeOpacity={0.7}
                          disabled={!isCurrentMonth}
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
                          {isModified && !isCancelled && !isAdded && isCurrentMonth && (
                            <View style={styles.modifiedIndicator} />
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Time Inputs for Selected Specific Date */}
              {selectedDateForTime && (
                <View style={styles.dayTimeContainer}>
                  <View style={styles.dayTimeHeader}>
                    <Text style={styles.dayTimeTitle}>
                      Time for {monthNames[selectedDateForTime.getMonth()]} {selectedDateForTime.getDate()}, {selectedDateForTime.getFullYear()}
                    </Text>
                    <TouchableOpacity
                      style={styles.removeDayButton}
                      onPress={() => {
                        const dateKey = getDateKey(selectedDateForTime);
                        setDateTimes((prev) => {
                          const updated = { ...prev };
                          delete updated[dateKey];
                          return updated;
                        });
                        setSelectedDateForTime(null);
                      }}
                    >
                      <Text style={styles.removeDayButtonText}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.timeContainer}>
                    <View style={styles.timeInputGroup}>
                      <Text style={styles.timeLabel}>Start Time</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={dateTimes[getDateKey(selectedDateForTime)]?.startTime || trainingSchedule.trainingTime.startTime}
                        onChangeText={(value) => handleDateTimeChange(getDateKey(selectedDateForTime), 'startTime', value)}
                        placeholder="18:00"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.timeInputGroup}>
                      <Text style={styles.timeLabel}>End Time</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={dateTimes[getDateKey(selectedDateForTime)]?.endTime || trainingSchedule.trainingTime.endTime}
                        onChangeText={(value) => handleDateTimeChange(getDateKey(selectedDateForTime), 'endTime', value)}
                        placeholder="19:30"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* Time Inputs for Selected Day of Week (fallback) */}
              {selectedDayForTime !== null && trainingSchedule.trainingDays.includes(selectedDayForTime) && !selectedDateForTime && (
                <View style={styles.dayTimeContainer}>
                  <View style={styles.dayTimeHeader}>
                    <Text style={styles.dayTimeTitle}>
                      Time for {dayNames[selectedDayForTime]}
                    </Text>
                    <TouchableOpacity
                      style={styles.removeDayButton}
                      onPress={() => handleDayRemove(selectedDayForTime)}
                    >
                      <Text style={styles.removeDayButtonText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.timeContainer}>
                    <View style={styles.timeInputGroup}>
                      <Text style={styles.timeLabel}>Start Time</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={dayTimes[selectedDayForTime]?.startTime || trainingSchedule.trainingTime.startTime}
                        onChangeText={(value) => handleDayTimeChange(selectedDayForTime, 'startTime', value)}
                        placeholder="18:00"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.timeInputGroup}>
                      <Text style={styles.timeLabel}>End Time</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={dayTimes[selectedDayForTime]?.endTime || trainingSchedule.trainingTime.endTime}
                        onChangeText={(value) => handleDayTimeChange(selectedDayForTime, 'endTime', value)}
                        placeholder="19:30"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* Default Time (shown when no day is selected for time editing) */}
              {selectedDayForTime === null && trainingSchedule.trainingDays.length > 0 && (
                <View style={styles.dayTimeContainer}>
                  <Text style={styles.dayTimeTitle}>Default Session Time</Text>
                  <Text style={styles.dayTimeSubtitle}>
                    Tap on a selected day above to set custom time for that day
                  </Text>
                  <View style={styles.timeContainer}>
                    <View style={styles.timeInputGroup}>
                      <Text style={styles.timeLabel}>Start Time</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={trainingSchedule.trainingTime.startTime}
                        onChangeText={(value) => {
                          setTrainingSchedule((prev) => ({
                            ...prev,
                            trainingTime: { ...prev.trainingTime, startTime: value },
                          }));
                        }}
                        placeholder="18:00"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.timeInputGroup}>
                      <Text style={styles.timeLabel}>End Time</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={trainingSchedule.trainingTime.endTime}
                        onChangeText={(value) => {
                          setTrainingSchedule((prev) => ({
                            ...prev,
                            trainingTime: { ...prev.trainingTime, endTime: value },
                          }));
                        }}
                        placeholder="19:30"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* Summary */}
              <View style={styles.scheduleSummary}>
                {trainingSchedule.trainingDays.length > 0 && (
                  <Text style={styles.selectedDaysText}>
                    ✓ Recurring: {trainingSchedule.trainingDays.map((d) => dayShortNames[d]).join(', ')}
                  </Text>
                )}
                {cancelledDates.size > 0 && (
                  <Text style={styles.cancelledDaysText}>
                    ✕ Cancelled: {cancelledDates.size} date(s)
                  </Text>
                )}
                {addedDates.size > 0 && (
                  <Text style={styles.addedDaysText}>
                    + Added: {addedDates.size} replacement date(s)
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.modalSaveButton,
                  (updatingSchedule || trainingSchedule.trainingDays.length === 0) &&
                    styles.modalSaveButtonDisabled,
                ]}
                onPress={handleUpdateTrainingSchedule}
                disabled={updatingSchedule || trainingSchedule.trainingDays.length === 0}
              >
                {updatingSchedule ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSaveButtonText}>💾 Save Schedule</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};


export default AttendanceScreen;
