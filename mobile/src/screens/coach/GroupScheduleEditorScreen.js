import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from '../../context/NotificationContext';
import apiClient from '../../services/apiClient';
import { AppScreen, AppCard, AppButton, AppInput } from '../../ui/components';
import { colors, spacing, radius, typography } from '../../ui/tokens';

const GroupScheduleEditorScreen = ({ route }) => {
  const { groupId, groupName } = route.params;
  const navigation = useNavigation();
  const notifications = useNotifications();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Schedule state
  const [trainingDays, setTrainingDays] = useState([]);
  const [trainingTime, setTrainingTime] = useState({ startTime: '18:00', endTime: '19:30' });
  const [cancelledDates, setCancelledDates] = useState(new Set());
  const [addedDates, setAddedDates] = useState(new Set());
  const [dateTimes, setDateTimes] = useState({});
  const [dayTimes, setDayTimes] = useState({});
  const [modifiedDays, setModifiedDays] = useState(new Set());
  const [selectedDayForTime, setSelectedDayForTime] = useState(null);
  const [selectedDateForTime, setSelectedDateForTime] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [lastTap, setLastTap] = useState({ date: null, time: 0 });

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayShortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const fetchGroup = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/groups/${groupId}`);
      setGroup(data.group);
      
      if (data.group) {
        setTrainingDays(data.group.trainingDays || []);
        setTrainingTime(data.group.trainingTime || { startTime: '18:00', endTime: '19:30' });
        
        // Load cancelled and added dates
        if (data.group.cancelledDates && Array.isArray(data.group.cancelledDates)) {
          setCancelledDates(new Set(data.group.cancelledDates));
        }
        if (data.group.addedDates && Array.isArray(data.group.addedDates)) {
          setAddedDates(new Set(data.group.addedDates));
        }
        
        // Load per-date times
        if (data.group.dateTimes && typeof data.group.dateTimes === 'object') {
          setDateTimes(data.group.dateTimes);
        }
        
        // Initialize dayTimes from trainingDays
        const defaultTime = data.group.trainingTime || { startTime: '18:00', endTime: '19:30' };
        const days = data.group.trainingDays || [];
        const initialDayTimes = {};
        days.forEach((day) => {
          initialDayTimes[day] = defaultTime;
        });
        setDayTimes(initialDayTimes);
      }
    } catch (err) {
      notifications.error(err.message || 'Failed to load group');
    } finally {
      setLoading(false);
    }
  }, [groupId, notifications]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  // Helper: Convert time string to minutes
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  };

  // Helper: Check if time ranges overlap
  const timeRangesOverlap = (start1, end1, start2, end2) => {
    const start1Min = timeToMinutes(start1);
    const end1Min = timeToMinutes(end1);
    const start2Min = timeToMinutes(start2);
    const end2Min = timeToMinutes(end2);
    return (start1Min < end2Min && end1Min > start2Min);
  };

  // Check for time conflicts
  const checkTimeConflicts = async () => {
    try {
      const { data: allGroups } = await apiClient.get('/groups');
      
      const scheduleTime = trainingTime;
      const conflicts = [];

      // Get all dates that will have training (recurring + added, excluding cancelled)
      const trainingDates = new Set();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const twoYearsLater = new Date(today);
      twoYearsLater.setFullYear(twoYearsLater.getFullYear() + 2);
      
      trainingDays.forEach((dayIndex) => {
        const checkDate = new Date(today);
        const daysUntilNext = (dayIndex - checkDate.getDay() + 7) % 7;
        if (daysUntilNext > 0) {
          checkDate.setDate(checkDate.getDate() + daysUntilNext);
        }
        
        while (checkDate <= twoYearsLater) {
          const dateKey = getDateKey(checkDate);
          if (!cancelledDates.has(dateKey)) {
            trainingDates.add(dateKey);
          }
          checkDate.setDate(checkDate.getDate() + 7);
        }
      });

      addedDates.forEach((dateKey) => {
        trainingDates.add(dateKey);
      });

      // Check each training date for conflicts
      for (const dateKey of trainingDates) {
        const [year, month, day] = dateKey.split('-').map(Number);
        const checkDate = new Date(year, month - 1, day);
        
        const timeForDate = dateTimes[dateKey] || dayTimes[checkDate.getDay()] || trainingTime;
        const startTime = timeForDate.startTime || trainingTime.startTime || '18:00';
        const endTime = timeForDate.endTime || trainingTime.endTime || '19:30';

        for (const otherGroup of allGroups) {
          if (otherGroup._id === groupId) continue;
          
          if (!otherGroup.trainingDays || !Array.isArray(otherGroup.trainingDays)) continue;
          
          const dayOfWeek = checkDate.getDay();
          const otherGroupHasDay = otherGroup.trainingDays.includes(dayOfWeek);
          const otherGroupHasAdded = otherGroup.addedDates && 
            Array.isArray(otherGroup.addedDates) && 
            otherGroup.addedDates.includes(dateKey);
          const otherGroupCancelled = otherGroup.cancelledDates && 
            Array.isArray(otherGroup.cancelledDates) && 
            otherGroup.cancelledDates.includes(dateKey);
          
          if ((otherGroupHasDay || otherGroupHasAdded) && !otherGroupCancelled) {
            const otherDateTimes = otherGroup.dateTimes || {};
            const otherTimeForDate = otherDateTimes[dateKey] || otherGroup.trainingTime || { startTime: '18:00', endTime: '19:30' };
            const otherStartTime = otherTimeForDate.startTime || '18:00';
            const otherEndTime = otherTimeForDate.endTime || '19:30';

            if (timeRangesOverlap(startTime, endTime, otherStartTime, otherEndTime)) {
              conflicts.push({
                date: `${day}/${month}/${year}`,
                dateKey,
                otherGroupName: otherGroup.name,
                time: `${startTime} - ${endTime}`,
                otherTime: `${otherStartTime} - ${otherEndTime}`,
              });
              break;
            }
          }
        }
      }

      return conflicts;
    } catch (err) {
      console.error('Error checking conflicts:', err);
      return [];
    }
  };

  const handleUpdateSchedule = async () => {
    if (trainingDays.length === 0 && addedDates.size === 0) {
      notifications.error('Please select at least one training day or add a replacement date');
      return;
    }

    setSaving(true);
    try {
      // Check for time conflicts before saving
      const conflicts = await checkTimeConflicts();
      
      if (conflicts.length > 0) {
        const conflictList = conflicts.map(c => 
          `${c.date}: Conflict with "${c.otherGroupName}" (${c.time})`
        ).join('\n');
        
        notifications.error(
          `⚠️ Time conflict detected!\n\n${conflictList}\n\nCannot schedule training at the same time on the same date. Please adjust the schedule.`,
          { duration: 8000 }
        );
        setSaving(false);
        return;
      }

      // Filter out empty dateTimes entries
      const filteredDateTimes = Object.keys(dateTimes).reduce((acc, key) => {
        const time = dateTimes[key];
        if (time && (time.startTime || time.endTime)) {
          acc[key] = {
            startTime: time.startTime || '',
            endTime: time.endTime || '',
          };
        }
        return acc;
      }, {});
      
      await apiClient.put(`/groups/${groupId}`, {
        trainingDays: trainingDays,
        trainingTime: trainingTime,
        cancelledDates: Array.from(cancelledDates),
        addedDates: Array.from(addedDates),
        dateTimes: Object.keys(filteredDateTimes).length > 0 ? filteredDateTimes : undefined,
      });
      
      const dayNamesStr = trainingDays.map(
        (d) => dayNames[d]
      ).join(', ');
      let message = `Training schedule updated: ${dayNamesStr} from ${trainingTime.startTime} to ${trainingTime.endTime}`;
      if (cancelledDates.size > 0) {
        message += `\n${cancelledDates.size} date(s) cancelled`;
      }
      if (addedDates.size > 0) {
        message += `\n${addedDates.size} replacement date(s) added`;
      }
      notifications.success(message);
      fetchGroup();
      setModifiedDays(new Set());
      setSelectedDayForTime(null);
      setSelectedDate(null);
      setSelectedDateForTime(null);
    } catch (err) {
      notifications.error(err.response?.data?.message || err.message || 'Failed to update training schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDay = (dayIndex) => {
    if (trainingDays.includes(dayIndex)) {
      setTrainingDays(trainingDays.filter(d => d !== dayIndex));
      setDayTimes((prev) => {
        const updated = { ...prev };
        delete updated[dayIndex];
        return updated;
      });
      const newModifiedDays = new Set(modifiedDays);
      newModifiedDays.add(dayIndex);
      setModifiedDays(newModifiedDays);
      if (selectedDayForTime === dayIndex) {
        setSelectedDayForTime(null);
      }
    } else {
      setTrainingDays([...trainingDays, dayIndex].sort((a, b) => a - b));
      setDayTimes((prev) => ({
        ...prev,
        [dayIndex]: trainingTime,
      }));
      const newModifiedDays = new Set(modifiedDays);
      newModifiedDays.add(dayIndex);
      setModifiedDays(newModifiedDays);
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
    setDateTimes((prev) => {
      const currentDateTimes = prev[dateKey] || {};
      return {
        ...prev,
        [dateKey]: {
          ...currentDateTimes,
          [field]: value,
        },
      };
    });
  };

  const getDateKey = (date) => {
    if (typeof date === 'string') {
      return date.includes('T') ? date.split('T')[0] : date;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getCalendarDates = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const dates = [];
    const currentDate = new Date(startDate);
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
    const dayOfWeek = date.getDay();
    const dateKey = getDateKey(date);
    
    if (cancelledDates.has(dateKey)) {
      return false;
    }
    
    if (addedDates.has(dateKey)) {
      return true;
    }
    
    return trainingDays.includes(dayOfWeek);
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

  const getTimeForDate = (date) => {
    const dateKey = getDateKey(date);
    const dayOfWeek = date.getDay();
    
    if (dateTimes[dateKey]) {
      return dateTimes[dateKey];
    }
    
    if (dayTimes[dayOfWeek]) {
      return dayTimes[dayOfWeek];
    }
    
    return trainingTime;
  };

  const handleDateClick = (date) => {
    if (!isDateInCurrentMonth(date)) return;
    
    const dateKey = getDateKey(date);
    const dayOfWeek = date.getDay();
    const isRecurringDay = trainingDays.includes(dayOfWeek);
    const isSelected = isDateSelected(date);
    const isCancelled = isDateCancelled(date);
    const isAdded = isDateAdded(date);
    
    const now = Date.now();
    const isDoubleTap = lastTap.date === dateKey && (now - lastTap.time) < 300;
    
    if (isDoubleTap && isAdded) {
      const newAdded = new Set(addedDates);
      newAdded.delete(dateKey);
      setAddedDates(newAdded);
      setDateTimes((prev) => {
        const updated = { ...prev };
        delete updated[dateKey];
        return updated;
      });
      setSelectedDateForTime(null);
      setSelectedDate(null);
      setLastTap({ date: null, time: 0 });
    } else if (isDoubleTap && isSelected && !isCancelled && !isAdded) {
      const newCancelled = new Set(cancelledDates);
      newCancelled.add(dateKey);
      setCancelledDates(newCancelled);
      setSelectedDateForTime(null);
      setLastTap({ date: null, time: 0 });
    } else if (isSelected && !isCancelled && !isAdded) {
      setSelectedDateForTime(date);
      setSelectedDate(date);
      if (!dateTimes[dateKey]) {
        setDateTimes((prev) => ({
          ...prev,
          [dateKey]: trainingTime,
        }));
      }
      setLastTap({ date: dateKey, time: now });
    } else if (isCancelled) {
      const newCancelled = new Set(cancelledDates);
      newCancelled.delete(dateKey);
      setCancelledDates(newCancelled);
      setSelectedDateForTime(null);
      setLastTap({ date: null, time: 0 });
    } else if (isAdded) {
      setSelectedDateForTime(date);
      setSelectedDate(date);
      if (!dateTimes[dateKey]) {
        setDateTimes((prev) => ({
          ...prev,
          [dateKey]: trainingTime,
        }));
      }
      setLastTap({ date: dateKey, time: now });
    } else {
      const newAdded = new Set(addedDates);
      newAdded.add(dateKey);
      setAddedDates(newAdded);
      setSelectedDateForTime(date);
      if (!dateTimes[dateKey]) {
        setDateTimes((prev) => ({
          ...prev,
          [dateKey]: trainingTime,
        }));
      }
      setSelectedDate(date);
      setLastTap({ date: dateKey, time: now });
    }
  };

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Schedule Editor</Text>
          <Text style={styles.headerSubtitle}>{groupName}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Recurring Training Days */}
        <AppCard title="Recurring Training Days" style={styles.sectionCard}>
          <Text style={styles.sectionHint}>
            Select days that repeat every week
          </Text>
          <View style={styles.dayOfWeekGrid}>
            {dayNames.map((day, index) => {
              const isSelected = trainingDays.includes(index);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayButton,
                    isSelected && styles.dayButtonSelected,
                  ]}
                  onPress={() => handleToggleDay(index)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayButtonText,
                      isSelected && styles.dayButtonTextSelected,
                    ]}
                  >
                    {dayShortNames[index]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {trainingDays.length > 0 && (
            <View style={styles.selectedDaysPreview}>
              <Text style={styles.selectedDaysText}>
                ✓ {trainingDays.length} day{trainingDays.length > 1 ? 's' : ''} selected: {trainingDays.map((d) => dayNames[d]).join(', ')}
              </Text>
            </View>
          )}
        </AppCard>

        {/* Default Training Time */}
        <AppCard title="Default Training Time" style={styles.sectionCard}>
          <Text style={styles.sectionHint}>
            Default time for all training sessions. You can set custom times for specific days or dates below.
          </Text>
          <View style={styles.timeInputRow}>
            <View style={styles.timeInputGroup}>
              <Text style={styles.timeLabel}>Start Time</Text>
              <TextInput
                style={styles.timeInput}
                value={trainingTime.startTime}
                onChangeText={(value) => setTrainingTime({ ...trainingTime, startTime: value })}
                placeholder="18:00"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={styles.timeInputGroup}>
              <Text style={styles.timeLabel}>End Time</Text>
              <TextInput
                style={styles.timeInput}
                value={trainingTime.endTime}
                onChangeText={(value) => setTrainingTime({ ...trainingTime, endTime: value })}
                placeholder="19:30"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>
        </AppCard>

        {/* Per-Day Time Overrides */}
        {selectedDayForTime !== null && trainingDays.includes(selectedDayForTime) && (
          <AppCard title={`Time for ${dayNames[selectedDayForTime]}`} style={styles.sectionCard}>
            <View style={styles.timeInputRow}>
              <View style={styles.timeInputGroup}>
                <Text style={styles.timeLabel}>Start Time</Text>
                <TextInput
                  style={styles.timeInput}
                  value={dayTimes[selectedDayForTime]?.startTime || trainingTime.startTime}
                  onChangeText={(value) => handleDayTimeChange(selectedDayForTime, 'startTime', value)}
                  placeholder="18:00"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={styles.timeInputGroup}>
                <Text style={styles.timeLabel}>End Time</Text>
                <TextInput
                  style={styles.timeInput}
                  value={dayTimes[selectedDayForTime]?.endTime || trainingTime.endTime}
                  onChangeText={(value) => handleDayTimeChange(selectedDayForTime, 'endTime', value)}
                  placeholder="19:30"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => {
                setDayTimes((prev) => {
                  const updated = { ...prev };
                  delete updated[selectedDayForTime];
                  return updated;
                });
                setSelectedDayForTime(null);
              }}
            >
              <Text style={styles.removeButtonText}>Remove custom time</Text>
            </TouchableOpacity>
          </AppCard>
        )}

        {/* Calendar */}
        <AppCard title="Calendar" style={styles.sectionCard}>
          <Text style={styles.sectionHint}>
            Tap a date to add it. Double-tap a training day to cancel it. Double-tap an added date to remove it.
          </Text>
          
          <View style={styles.monthNavigation}>
            <TouchableOpacity onPress={() => navigateMonth('prev')}>
              <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.monthYearText}>
              {monthNames[currentMonth]} {currentYear}
            </Text>
            <TouchableOpacity onPress={() => navigateMonth('next')}>
              <Ionicons name="chevron-forward" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarGrid}>
            {dayShortNames.map((day, index) => (
              <View key={index} style={styles.calendarHeaderCell}>
                <Text style={styles.calendarHeaderText}>{day}</Text>
              </View>
            ))}
            {getCalendarDates().map((date, index) => {
              const isCurrentMonth = isDateInCurrentMonth(date);
              const isSelected = isDateSelected(date);
              const isCancelled = isDateCancelled(date);
              const isAdded = isDateAdded(date);
              const isThisDateSelected = selectedDate && getDateKey(selectedDate) === getDateKey(date);
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.calendarCell,
                    !isCurrentMonth && styles.calendarCellOtherMonth,
                    isSelected && isCurrentMonth && !isCancelled && styles.calendarCellSelected,
                    isCancelled && isCurrentMonth && styles.calendarCellCancelled,
                    isAdded && isCurrentMonth && styles.calendarCellAdded,
                    isThisDateSelected && styles.calendarCellActive,
                  ]}
                  onPress={() => handleDateClick(date)}
                  disabled={!isCurrentMonth}
                >
                  <Text
                    style={[
                      styles.calendarCellText,
                      !isCurrentMonth && styles.calendarCellTextOtherMonth,
                      isSelected && isCurrentMonth && !isCancelled && styles.calendarCellTextSelected,
                      isCancelled && isCurrentMonth && styles.calendarCellTextCancelled,
                      isAdded && isCurrentMonth && styles.calendarCellTextAdded,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                  {isCancelled && isCurrentMonth && (
                    <View style={styles.cancelledIndicator}>
                      <Ionicons name="close" size={12} color={colors.error} />
                    </View>
                  )}
                  {isAdded && isCurrentMonth && (
                    <View style={styles.addedIndicator}>
                      <Ionicons name="add" size={12} color={colors.success} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </AppCard>

        {/* Per-Date Time Override */}
        {selectedDateForTime && (
          <AppCard 
            title={`Time for ${monthNames[selectedDateForTime.getMonth()]} ${selectedDateForTime.getDate()}, ${selectedDateForTime.getFullYear()}`}
            style={styles.sectionCard}
          >
            <View style={styles.timeInputRow}>
              <View style={styles.timeInputGroup}>
                <Text style={styles.timeLabel}>Start Time</Text>
                <TextInput
                  style={styles.timeInput}
                  value={dateTimes[getDateKey(selectedDateForTime)]?.startTime ?? ''}
                  onChangeText={(value) => handleDateTimeChange(getDateKey(selectedDateForTime), 'startTime', value)}
                  placeholder="18:00"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={styles.timeInputGroup}>
                <Text style={styles.timeLabel}>End Time</Text>
                <TextInput
                  style={styles.timeInput}
                  value={dateTimes[getDateKey(selectedDateForTime)]?.endTime ?? ''}
                  onChangeText={(value) => handleDateTimeChange(getDateKey(selectedDateForTime), 'endTime', value)}
                  placeholder="19:30"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
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
              <Text style={styles.removeButtonText}>Clear custom time</Text>
            </TouchableOpacity>
          </AppCard>
        )}

        {/* Summary */}
        <AppCard title="Summary" style={styles.sectionCard}>
          {trainingDays.length > 0 && (
            <Text style={styles.summaryText}>
              ✓ Recurring: {trainingDays.map((d) => dayShortNames[d]).join(', ')}
            </Text>
          )}
          {cancelledDates.size > 0 && (
            <Text style={styles.summaryTextCancelled}>
              ✕ Cancelled: {cancelledDates.size} date(s)
            </Text>
          )}
          {addedDates.size > 0 && (
            <Text style={styles.summaryTextAdded}>
              + Added: {addedDates.size} replacement date(s)
            </Text>
          )}
        </AppCard>

        {/* Save Button */}
        <AppButton
          variant="primary"
          title="Save Schedule"
          onPress={handleUpdateSchedule}
          loading={saving}
          disabled={saving || (trainingDays.length === 0 && addedDates.size === 0)}
          style={styles.saveButton}
        />
      </ScrollView>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  sectionCard: {
    marginBottom: spacing.lg,
  },
  sectionHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  dayOfWeekGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dayButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgTertiary,
    minWidth: 50,
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  dayButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dayButtonTextSelected: {
    color: colors.primary,
  },
  selectedDaysPreview: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.primary + '10',
    borderRadius: radius.sm,
  },
  selectedDaysText: {
    ...typography.caption,
    color: colors.primary,
  },
  timeInputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timeInputGroup: {
    flex: 1,
  },
  timeLabel: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
    color: colors.textPrimary,
  },
  timeInput: {
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48,
  },
  removeButton: {
    marginTop: spacing.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  removeButtonText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  monthYearText: {
    ...typography.h3,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarHeaderCell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  calendarHeaderText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textMuted,
  },
  calendarCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    position: 'relative',
  },
  calendarCellOtherMonth: {
    opacity: 0.3,
  },
  calendarCellSelected: {
    backgroundColor: colors.primary + '20',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  calendarCellCancelled: {
    backgroundColor: colors.error + '15',
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  calendarCellAdded: {
    backgroundColor: colors.success + '15',
    borderWidth: 1,
    borderColor: colors.success + '40',
  },
  calendarCellActive: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  calendarCellText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  calendarCellTextOtherMonth: {
    color: colors.textMuted,
  },
  calendarCellTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  calendarCellTextCancelled: {
    color: colors.error,
  },
  calendarCellTextAdded: {
    color: colors.success,
  },
  cancelledIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  addedIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  summaryText: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  summaryTextCancelled: {
    ...typography.body,
    color: colors.error,
    marginBottom: spacing.xs,
  },
  summaryTextAdded: {
    ...typography.body,
    color: colors.success,
    marginBottom: spacing.xs,
  },
  saveButton: {
    marginTop: spacing.lg,
    minHeight: 56,
  },
});

export default GroupScheduleEditorScreen;

