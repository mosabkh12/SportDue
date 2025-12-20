import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from '../../context/NotificationContext';
import apiClient from '../../services/apiClient';
import { AppScreen, AppCard, AppButton, AppInput } from '../../ui/components';
import { styles } from '../../styles/screens/GroupScheduleEditorScreen.styles';
import { colors } from '../../ui/tokens';

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
        
        // Load per-date times - clean up any invalid entries
        // Separate dayTimes (keys like "0", "1", etc.) from actual dateTimes (YYYY-MM-DD format)
        const loadedDayTimes = {};
        if (data.group.dateTimes && typeof data.group.dateTimes === 'object') {
          const cleanedDateTimes = {};
          
          for (const [key, time] of Object.entries(data.group.dateTimes)) {
            // Only keep entries with both times set
            if (time && time.startTime && time.endTime && 
                time.startTime.trim() !== '' && time.endTime.trim() !== '') {
              // Check if key is a day index (0-6) or a date (YYYY-MM-DD)
              if (/^\d+$/.test(key) && parseInt(key) >= 0 && parseInt(key) <= 6) {
                // This is a day index (Sunday=0, Monday=1, etc.)
                loadedDayTimes[parseInt(key)] = {
                  startTime: time.startTime.trim(),
                  endTime: time.endTime.trim(),
                };
              } else if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
                // This is a date (YYYY-MM-DD format)
                cleanedDateTimes[key] = {
                  startTime: time.startTime.trim(),
                  endTime: time.endTime.trim(),
                };
              }
            }
          }
          
          setDateTimes(cleanedDateTimes);
        }
        
        // Initialize dayTimes from trainingDays
        // Use loaded dayTimes if available, otherwise use default
        const defaultTime = data.group.trainingTime || { startTime: '18:00', endTime: '19:30' };
        const days = data.group.trainingDays || [];
        const initialDayTimes = {};
        days.forEach((day) => {
          // Use loaded dayTimes first, then default
          if (loadedDayTimes[day] && loadedDayTimes[day].startTime && loadedDayTimes[day].endTime) {
            initialDayTimes[day] = loadedDayTimes[day];
          } else {
            initialDayTimes[day] = defaultTime;
          }
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

  // Validate time format (HH:MM)
  const isValidTimeFormat = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return false;
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeStr);
  };

  // Validate time values (hours 0-23, minutes 0-59)
  const isValidTime = (timeStr) => {
    if (!isValidTimeFormat(timeStr)) return false;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  };

  // Validate that start time is before end time
  const isValidTimeRange = (startTime, endTime) => {
    if (!isValidTime(startTime) || !isValidTime(endTime)) return false;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return startMinutes < endMinutes;
  };

  const handleUpdateSchedule = async () => {
    if (trainingDays.length === 0 && addedDates.size === 0) {
      notifications.error('Please select at least one training day or add a replacement date');
      return;
    }

    // Validate that each training day has a valid time
    for (const dayIndex of trainingDays) {
      const dayTime = dayTimes[dayIndex];
      if (!dayTime || !dayTime.startTime || !dayTime.endTime) {
        notifications.error(`Please set a time for ${dayNames[dayIndex]}`);
        return;
      }
      if (!isValidTime(dayTime.startTime)) {
        notifications.error(`Invalid start time for ${dayNames[dayIndex]}. Use HH:MM format (e.g., 18:00)`);
        return;
      }
      if (!isValidTime(dayTime.endTime)) {
        notifications.error(`Invalid end time for ${dayNames[dayIndex]}. Use HH:MM format (e.g., 19:30)`);
        return;
      }
      if (!isValidTimeRange(dayTime.startTime, dayTime.endTime)) {
        notifications.error(`End time must be after start time for ${dayNames[dayIndex]}`);
        return;
      }
    }

    // Don't validate dateTimes - users can set any time they want
    // Invalid entries will be filtered out when saving

    setSaving(true);
    try {

      // Store dayTimes in dateTimes using day indices as keys (e.g., "0" for Sunday, "1" for Monday)
      // This allows us to preserve individual day times on the server
      // Ensure all times are valid strings in HH:MM format
      const dayTimesForServer = {};
      trainingDays.forEach((dayIndex) => {
        const dayTime = dayTimes[dayIndex];
        if (dayTime && dayTime.startTime && dayTime.endTime) {
          // Convert to string and clean
          const startTime = String(dayTime.startTime).trim();
          const endTime = String(dayTime.endTime).trim();
          // Only save if both are valid (non-empty and contain colon)
          if (startTime !== '' && endTime !== '' && 
              startTime.includes(':') && endTime.includes(':')) {
            dayTimesForServer[String(dayIndex)] = {
              startTime: startTime,
              endTime: endTime,
            };
          }
        }
      });

      // Filter out empty dateTimes entries - only keep entries with both times set
      // Don't validate format - let users set any time they want
      // Exclude day indices (0-6) from dateTimes since we store them separately
      const filteredDateTimes = Object.keys(dateTimes).reduce((acc, key) => {
        // Skip day indices (they're stored in dayTimesForServer)
        if (/^\d+$/.test(key) && parseInt(key) >= 0 && parseInt(key) <= 6) {
          return acc;
        }
        const time = dateTimes[key];
        // Only include if both times are set (non-empty strings)
        if (time && time.startTime && time.endTime && 
            time.startTime.trim() !== '' && time.endTime.trim() !== '') {
          acc[key] = {
            startTime: time.startTime.trim(),
            endTime: time.endTime.trim(),
          };
        }
        return acc;
      }, {});

      // Merge dayTimes with dateTimes for server
      const allDateTimes = { ...dayTimesForServer, ...filteredDateTimes };
      
      // Calculate a default trainingTime from dayTimes (for backward compatibility)
      const defaultTrainingTime = trainingDays.length > 0 && dayTimes[trainingDays[0]]
        ? dayTimes[trainingDays[0]]
        : { startTime: '18:00', endTime: '19:30' };

      await apiClient.put(`/groups/${groupId}`, {
        trainingDays: trainingDays,
        trainingTime: defaultTrainingTime, // Keep for backward compatibility
        cancelledDates: Array.from(cancelledDates),
        addedDates: Array.from(addedDates),
        dateTimes: Object.keys(allDateTimes).length > 0 ? allDateTimes : undefined,
      });
      
      const dayNamesStr = trainingDays.map(
        (d) => `${dayNames[d]} (${dayTimes[d]?.startTime || 'N/A'}-${dayTimes[d]?.endTime || 'N/A'})`
      ).join(', ');
      let message = `Training schedule updated: ${dayNamesStr}`;
      if (cancelledDates.size > 0) {
        message += `\n${cancelledDates.size} date(s) cancelled`;
      }
      if (addedDates.size > 0) {
        message += `\n${addedDates.size} replacement date(s) added`;
      }
      notifications.success(message);
      fetchGroup();
      setModifiedDays(new Set());
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
    } else {
      setTrainingDays([...trainingDays, dayIndex].sort((a, b) => a - b));
      // Initialize with empty time - user must set it
      setDayTimes((prev) => ({
        ...prev,
        [dayIndex]: { startTime: '', endTime: '' },
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
    
    // Return empty time if no day time is set
    return { startTime: '', endTime: '' };
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
      // Don't initialize dateTimes - let it use the day's time automatically
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
      // Don't initialize dateTimes - let it use the day's time automatically
      setLastTap({ date: dateKey, time: now });
    } else {
      const newAdded = new Set(addedDates);
      newAdded.add(dateKey);
      setAddedDates(newAdded);
      setSelectedDateForTime(date);
      setSelectedDate(date);
      // Don't initialize dateTimes - let it use the day's time automatically
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

        {/* Training Times for Each Day */}
        {trainingDays.length > 0 && (
          <AppCard title="Training Times" style={styles.sectionCard}>
            <Text style={styles.sectionHint}>
              Set the training time for each selected day. Format: HH:MM (e.g., 18:00)
            </Text>
            {trainingDays.map((dayIndex) => {
              const dayTime = dayTimes[dayIndex] || { startTime: '', endTime: '' };
              const hasValidTime = dayTime.startTime && dayTime.endTime && 
                isValidTime(dayTime.startTime) && isValidTime(dayTime.endTime) &&
                isValidTimeRange(dayTime.startTime, dayTime.endTime);
              
              return (
                <View key={dayIndex} style={styles.dayTimeSection}>
                  <Text style={styles.dayTimeTitle}>{dayNames[dayIndex]}</Text>
                  <View style={styles.timeInputRow}>
                    <View style={styles.timeInputGroup}>
                      <Text style={styles.timeLabel}>Start Time *</Text>
                      <TextInput
                        style={[
                          styles.timeInput,
                          !hasValidTime && dayTime.startTime && styles.timeInputError
                        ]}
                        value={dayTime.startTime}
                        onChangeText={(value) => handleDayTimeChange(dayIndex, 'startTime', value)}
                        placeholder="18:00"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                    <View style={styles.timeInputGroup}>
                      <Text style={styles.timeLabel}>End Time *</Text>
                      <TextInput
                        style={[
                          styles.timeInput,
                          !hasValidTime && dayTime.endTime && styles.timeInputError
                        ]}
                        value={dayTime.endTime}
                        onChangeText={(value) => handleDayTimeChange(dayIndex, 'endTime', value)}
                        placeholder="19:30"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                  </View>
                  {!hasValidTime && (dayTime.startTime || dayTime.endTime) && (
                    <Text style={styles.timeErrorText}>
                      Please enter valid times in HH:MM format (e.g., 18:00). End time must be after start time.
                    </Text>
                  )}
                </View>
              );
            })}
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

export default GroupScheduleEditorScreen;

