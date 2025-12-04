import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { colors, spacing, typography, shadows } from '../../styles/theme';

const AttendanceScreen = ({ route }) => {
  const { groupId } = route.params;
  const navigation = useNavigation();
  const notifications = useNotifications();

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
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
      if (data.group?.cancelledDates) {
        setCancelledDates(new Set(data.group.cancelledDates));
      }
      if (data.group?.addedDates) {
        setAddedDates(new Set(data.group.addedDates));
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
    const checkDate = new Date(dateString);
    const dayOfWeek = checkDate.getDay();
    return trainingDays.includes(dayOfWeek);
  };

  const navigateToTrainingDay = (direction) => {
    const currentDate = new Date(date);
    let daysToAdd = direction === 'next' ? 1 : -1;
    let attempts = 0;
    const maxAttempts = 14;

    while (attempts < maxAttempts) {
      currentDate.setDate(currentDate.getDate() + daysToAdd);
      const dateString = currentDate.toISOString().split('T')[0];

      if (trainingDays.length === 0 || isTrainingDay(dateString)) {
        setDate(dateString);
        return;
      }
      attempts++;
    }
    navigateDate(direction === 'next' ? 1 : -1);
  };

  const navigateDate = (days) => {
    const currentDate = new Date(date);
    currentDate.setDate(currentDate.getDate() + days);
    setDate(currentDate.toISOString().split('T')[0]);
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
    
    // Update default time if this is the first day
    if (trainingSchedule.trainingDays.length === 1 && trainingSchedule.trainingDays[0] === dayIndex) {
      setTrainingSchedule((prev) => ({
        ...prev,
        trainingTime: {
          ...prev.trainingTime,
          [field]: value,
        },
      }));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPlayers(), fetchAttendance(date)]);
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
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
    return date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
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
    
    if (isDateSelected(date)) {
      // If it's a training day, cancel this specific date
      if (isRecurringDay && !isDateCancelled(date)) {
        const newCancelled = new Set(cancelledDates);
        newCancelled.add(dateKey);
        setCancelledDates(newCancelled);
        setSelectedDate(date);
      } else if (isDateAdded(date)) {
        // Remove added date
        const newAdded = new Set(addedDates);
        newAdded.delete(dateKey);
        setAddedDates(newAdded);
        setSelectedDate(null);
      }
    } else {
      // If clicking on a non-training day
      if (isDateCancelled(date)) {
        // Remove from cancelled (restore it)
        const newCancelled = new Set(cancelledDates);
        newCancelled.delete(dateKey);
        setCancelledDates(newCancelled);
        setSelectedDate(null);
      } else {
        // Add as replacement date
        const newAdded = new Set(addedDates);
        newAdded.add(dateKey);
        setAddedDates(newAdded);
        setSelectedDate(date);
      }
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
                isTrainingDay(date) && trainingDays.length > 0 && styles.dateInputTraining,
                !isTrainingDay(date) && trainingDays.length > 0 && styles.dateInputNotTraining,
              ]}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
            />
            {!isTrainingDay(date) && trainingDays.length > 0 && (
              <Text style={styles.dateWarning}>⚠️ Not a scheduled training day</Text>
            )}
            {isTrainingDay(date) && trainingDays.length > 0 && (
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

              {/* Time Inputs for Selected Day */}
              {selectedDayForTime !== null && trainingSchedule.trainingDays.includes(selectedDayForTime) && (
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  scheduleInfo: {
    marginTop: spacing.xs,
  },
  scheduleDays: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  scheduleTime: {
    color: colors.accent,
    fontSize: 14,
  },
  noScheduleText: {
    color: colors.warning,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  configButton: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  configButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  dateContainer: {
    marginBottom: spacing.sm,
  },
  dateInput: {
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  dateInputTraining: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  dateInputNotTraining: {
    borderColor: colors.warning,
    borderWidth: 2,
  },
  dateDisplay: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  dateWarning: {
    color: colors.warning,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  dateSuccess: {
    color: colors.success,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  dateNavButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  navButton: {
    flex: 1,
    backgroundColor: colors.bgTertiary,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  navButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  quickActionButton: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  searchInput: {
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    padding: spacing.lg,
  },
  playerRow: {
    backgroundColor: colors.bgTertiary,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  playerRowPresent: {
    borderColor: colors.success,
    borderWidth: 2,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  playerRowAbsent: {
    borderColor: colors.error,
    borderWidth: 2,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  playerInfo: {
    marginBottom: spacing.sm,
  },
  playerName: {
    ...typography.body,
    fontWeight: '600',
  },
  playerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  statusButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.bgSecondary,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusButtonActive: {
    borderWidth: 2,
  },
  statusButtonPresent: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  statusButtonAbsent: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  statusButtonText: {
    fontSize: 20,
    color: colors.textMuted,
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  signatureInput: {
    flex: 1,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    color: colors.textPrimary,
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h2,
  },
  modalClose: {
    fontSize: 24,
    color: colors.textMuted,
    fontWeight: '300',
  },
  modalScroll: {
    padding: spacing.md,
  },
  modalSubtitle: {
    ...typography.caption,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  monthNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthNavButtonText: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
  },
  monthYearContainer: {
    flex: 1,
    alignItems: 'center',
  },
  monthYearText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  calendarContainer: {
    marginBottom: spacing.lg,
  },
  calendarHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  calendarHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  calendarHeaderText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarCell: {
    width: '13.5%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  calendarDayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  calendarDayButtonOtherMonth: {
    opacity: 0.3,
  },
  calendarDayButtonSelected: {
    backgroundColor: '#1a73e8',
  },
  calendarDayButtonActive: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  calendarDayText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  calendarDayTextOtherMonth: {
    color: colors.textMuted,
    opacity: 0.5,
  },
  calendarDayTextSelected: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  modifiedIndicator: {
    position: 'absolute',
    bottom: 2,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 2,
    backgroundColor: colors.warning,
    borderRadius: 1,
  },
  calendarDayButtonCancelled: {
    backgroundColor: colors.error,
    opacity: 0.7,
  },
  calendarDayButtonAdded: {
    backgroundColor: colors.success,
  },
  calendarDayButtonSelectedDate: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  calendarDayTextCancelled: {
    color: '#fff',
    textDecorationLine: 'line-through',
  },
  calendarDayTextAdded: {
    color: '#fff',
    fontWeight: '700',
  },
  cancelledIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelledIndicatorText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  addedIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addedIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  scheduleSummary: {
    backgroundColor: colors.bgTertiary,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelledDaysText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  addedDaysText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  dayOfWeekSelector: {
    backgroundColor: colors.bgTertiary,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  selectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  selectorIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: `${colors.accent}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  selectorIcon: {
    fontSize: 24,
  },
  selectorHeaderText: {
    flex: 1,
  },
  selectorTitle: {
    ...typography.h3,
    fontSize: 18,
    marginBottom: spacing.xs,
  },
  selectorSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  dayOfWeekGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  dayOfWeekButton: {
    width: '13.5%',
    aspectRatio: 1,
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    ...shadows.sm,
  },
  dayOfWeekButtonSelected: {
    backgroundColor: '#1a73e8',
    borderColor: '#1a73e8',
    borderWidth: 3,
    transform: [{ scale: 1.08 }],
    ...shadows.lg,
  },
  dayOfWeekGlow: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    opacity: 0.6,
  },
  dayOfWeekButtonText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dayOfWeekButtonTextSelected: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  dayOfWeekCheckmarkContainer: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    ...shadows.sm,
  },
  dayOfWeekCheckmark: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  selectedDaysPreview: {
    backgroundColor: `${colors.success}15`,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.success}30`,
    marginTop: spacing.sm,
  },
  selectedDaysPreviewText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  dayTimeContainer: {
    backgroundColor: colors.bgTertiary,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayTimeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dayTimeTitle: {
    ...typography.h3,
    fontSize: 16,
  },
  dayTimeSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.md,
  },
  removeDayButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    backgroundColor: colors.error,
  },
  removeDayButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedDaysText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  timeInputGroup: {
    flex: 1,
  },
  timeLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  timeInput: {
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 16,
  },
  modalSaveButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalSaveButtonDisabled: {
    opacity: 0.6,
  },
  modalSaveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AttendanceScreen;
