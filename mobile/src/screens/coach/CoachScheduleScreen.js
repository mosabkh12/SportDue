import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../../services/apiClient';
import { AppScreen, AppCard, AppButton } from '../../ui/components';
import { styles } from '../../styles/screens/CoachScheduleScreen.styles';
import { colors } from '../../ui/tokens';

const CoachScheduleScreen = () => {
  const navigation = useNavigation();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('all');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    // Get Monday of current week (day 1)
    const diff = day === 0 ? -6 : 1 - day; // If Sunday, go back 6 days; otherwise go to Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/groups');
      setGroups(data);
    } catch (err) {
      // Silent error
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGroups();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Filter groups by selected team
  const filteredGroups = useMemo(() => {
    if (selectedTeamFilter === 'all') return groups;
    return groups.filter(g => g._id === selectedTeamFilter);
  }, [groups, selectedTeamFilter]);

  const getTimeForDate = (group, date) => {
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    if (group.dateTimes && group.dateTimes[dateKey]) {
      const time = group.dateTimes[dateKey];
      if (time.startTime || time.endTime) {
        return { startTime: time.startTime || group.trainingTime?.startTime || '18:00', endTime: time.endTime || group.trainingTime?.endTime || '19:30' };
      }
    }
    
    return group.trainingTime || { startTime: '18:00', endTime: '19:30' };
  };

  const isDateCancelled = (group, date) => {
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return group.cancelledDates && Array.isArray(group.cancelledDates) && group.cancelledDates.includes(dateKey);
  };

  const isDateAdded = (group, date) => {
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return group.addedDates && Array.isArray(group.addedDates) && group.addedDates.includes(dateKey);
  };

  // Build weekly schedule (Monday to Sunday)
  const buildWeeklySchedule = () => {
    const weekSchedule = {};
    const dayIndices = [1, 2, 3, 4, 5, 6, 0]; // Monday to Sunday
    
    // Initialize all days
    dayIndices.forEach((dayIndex) => {
      weekSchedule[dayIndex] = [];
    });

    // Process each filtered group
    filteredGroups.forEach((group) => {
      if (!group.trainingDays || !Array.isArray(group.trainingDays)) return;

      // Process recurring training days
      group.trainingDays.forEach((dayIndex) => {
        const date = new Date(currentWeekStart);
        // Calculate the date for this day of week
        const dayOffset = dayIndex === 0 ? 6 : dayIndex - 1; // Sunday (0) becomes 6, Monday (1) becomes 0
        date.setDate(currentWeekStart.getDate() + dayOffset);
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        const isCancelled = isDateCancelled(group, date);
        if (!isCancelled) {
          const time = getTimeForDate(group, date);
          weekSchedule[dayIndex].push({
            groupId: group._id,
            groupName: group.name,
            time,
            isRecurring: true,
            dateKey,
            date: new Date(date), // Store date object for navigation
            isCancelled: false,
          });
        }
      });

      // Process added dates (replacement dates)
      if (group.addedDates && Array.isArray(group.addedDates)) {
        group.addedDates.forEach((dateStr) => {
          const [year, month, day] = dateStr.split('-').map(Number);
          const addedDate = new Date(year, month - 1, day);
          addedDate.setHours(0, 0, 0, 0);
          
          const weekStart = new Date(currentWeekStart);
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(currentWeekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          
          // Check if this added date falls within the current week
          if (addedDate >= weekStart && addedDate <= weekEnd) {
            const dayIndex = addedDate.getDay();
            const isCancelled = isDateCancelled(group, addedDate);
            if (!isCancelled) {
              const time = getTimeForDate(group, addedDate);
              weekSchedule[dayIndex].push({
                groupId: group._id,
                groupName: group.name,
                time,
                isRecurring: false,
                isAdded: true,
                dateKey: dateStr,
                date: new Date(addedDate), // Store date object for navigation
              });
            }
          }
        });
      }
    });

    // Sort each day's sessions by start time
    Object.keys(weekSchedule).forEach((dayIndex) => {
      weekSchedule[dayIndex].sort((a, b) => {
        const timeA = a.time.startTime || '00:00';
        const timeB = b.time.startTime || '00:00';
        return timeA.localeCompare(timeB);
      });
    });

    return weekSchedule;
  };

  const weeklySchedule = buildWeeklySchedule();
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayShortNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayIndices = [1, 2, 3, 4, 5, 6, 0]; // Monday to Sunday
  
  const navigateToPreviousWeek = () => {
    const newWeek = new Date(currentWeekStart);
    newWeek.setDate(newWeek.getDate() - 7);
    setCurrentWeekStart(newWeek);
  };

  const navigateToNextWeek = () => {
    const newWeek = new Date(currentWeekStart);
    newWeek.setDate(newWeek.getDate() + 7);
    setCurrentWeekStart(newWeek);
  };

  const navigateToCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  const formatWeekRange = () => {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const year = currentWeekStart.getFullYear();
    if (currentWeekStart.getMonth() === weekEnd.getMonth()) {
      return `${currentWeekStart.getDate()} - ${weekEnd.getDate()} ${monthNames[currentWeekStart.getMonth()]} ${year}`;
    } else {
      return `${currentWeekStart.getDate()} ${monthNames[currentWeekStart.getMonth()]} - ${weekEnd.getDate()} ${monthNames[weekEnd.getMonth()]} ${year}`;
    }
  };

  // Format date for AttendanceScreen (YYYY-MM-DD)
  const formatDateForAttendance = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Check if any team has a schedule
  const hasAnySchedule = useMemo(() => {
    return filteredGroups.some(group => 
      group.trainingDays && Array.isArray(group.trainingDays) && group.trainingDays.length > 0
    );
  }, [filteredGroups]);

  // Check if the week has any sessions
  const hasSessionsThisWeek = useMemo(() => {
    return Object.values(weeklySchedule).some(daySessions => daySessions.length > 0);
  }, [weeklySchedule]);

  return (
    <AppScreen
      scrollViewProps={{
        refreshControl: <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />,
      }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
        <View style={styles.weekNavigation}>
          <TouchableOpacity onPress={navigateToPreviousWeek} style={styles.weekNavButton}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={navigateToCurrentWeek} style={styles.weekNavCurrent}>
            <Text style={styles.weekNavText}>{formatWeekRange()}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={navigateToNextWeek} style={styles.weekNavButton}>
            <Ionicons name="chevron-forward" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Team Filter Dropdown */}
      {groups.length > 0 && (
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Team</Text>
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedTeamFilter === 'all' && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedTeamFilter('all')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedTeamFilter === 'all' && styles.filterButtonTextActive,
                ]}
              >
                All Teams
              </Text>
              {selectedTeamFilter === 'all' && (
                <Ionicons name="checkmark" size={16} color="#ffffff" style={styles.filterCheckIcon} />
              )}
            </TouchableOpacity>
            {groups.map((group) => (
              <TouchableOpacity
                key={group._id}
                style={[
                  styles.filterButton,
                  selectedTeamFilter === group._id && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedTeamFilter(group._id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedTeamFilter === group._id && styles.filterButtonTextActive,
                  ]}
                >
                  {group.name}
                </Text>
                {selectedTeamFilter === group._id && (
                  <Ionicons name="checkmark" size={16} color="#ffffff" style={styles.filterCheckIcon} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Weekly Schedule */}
      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !hasAnySchedule && !loading ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyText}>No schedule set</Text>
          <Text style={styles.emptySubtext}>
            {selectedTeamFilter === 'all'
              ? 'No teams have schedules configured yet'
              : 'This team has no schedule configured'}
          </Text>
          <AppButton
            variant="primary"
            title="Add Schedule"
            onPress={() => {
              if (selectedTeamFilter === 'all' && groups.length > 0) {
                navigation.navigate('GroupScheduleEditor', { 
                  groupId: groups[0]._id, 
                  groupName: groups[0].name 
                });
              } else if (selectedTeamFilter !== 'all') {
                const selectedGroup = groups.find(g => g._id === selectedTeamFilter);
                if (selectedGroup) {
                  navigation.navigate('GroupScheduleEditor', { 
                    groupId: selectedGroup._id, 
                    groupName: selectedGroup.name 
                  });
                }
              } else {
                navigation.navigate('Teams');
              }
            }}
            style={styles.emptyButton}
            leftIcon={<Ionicons name="add-circle" size={20} color="#ffffff" />}
          />
        </View>
      ) : !hasSessionsThisWeek ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyText}>No sessions this week</Text>
          <Text style={styles.emptySubtext}>
            {selectedTeamFilter === 'all'
              ? 'No training sessions scheduled for this week'
              : 'This team has no sessions scheduled for this week'}
          </Text>
        </View>
      ) : (
        <View style={styles.daysList}>
          {dayIndices.map((dayIndex) => {
            const daySessions = weeklySchedule[dayIndex] || [];
            const date = new Date(currentWeekStart);
            // Calculate the date for this day of week
            const dayOffset = dayIndex === 0 ? 6 : dayIndex - 1; // Sunday (0) becomes 6, Monday (1) becomes 0
            date.setDate(currentWeekStart.getDate() + dayOffset);
            const today = new Date();
            const isToday = date.getDate() === today.getDate() && 
                           date.getMonth() === today.getMonth() && 
                           date.getFullYear() === today.getFullYear();
            
            // Don't render day card if no sessions
            if (daySessions.length === 0) {
              return null;
            }
            
            return (
              <AppCard key={dayIndex} style={[styles.dayCard, isToday && styles.dayCardToday]}>
                <View style={styles.dayCardHeader}>
                  <View style={styles.dayCardHeaderLeft}>
                    <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
                      {dayNames[dayIndex === 0 ? 6 : dayIndex - 1]}
                    </Text>
                    <Text style={[styles.dayDate, isToday && styles.dayDateToday]}>
                      {date.getDate()}/{date.getMonth() + 1}
                    </Text>
                  </View>
                  {isToday && (
                    <View style={styles.todayBadge}>
                      <Text style={styles.todayBadgeText}>Today</Text>
                    </View>
                  )}
                </View>

                <View style={styles.sessionsList}>
                  {daySessions.map((session, idx) => {
                    return (
                      <View
                        key={`${session.groupId}-${session.dateKey}-${idx}`}
                        style={styles.sessionCard}
                      >
                        <View style={styles.sessionCardContent}>
                          <View style={styles.sessionInfo}>
                            <View style={styles.sessionHeader}>
                              <Ionicons 
                                name="people" 
                                size={18} 
                                color={colors.primary} 
                              />
                              <Text style={styles.sessionTeamName}>
                                {session.groupName}
                              </Text>
                              {session.isAdded && (
                                <View style={styles.sessionBadge}>
                                  <Text style={styles.sessionBadgeText}>Added</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.sessionTime}>
                              {session.time.startTime} - {session.time.endTime}
                            </Text>
                          </View>
                          <View style={styles.sessionActions}>
                            <TouchableOpacity
                              style={styles.sessionActionButton}
                              onPress={() => {
                                navigation.navigate('Attendance', {
                                  groupId: session.groupId,
                                  groupName: session.groupName,
                                  date: formatDateForAttendance(session.date),
                                });
                              }}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
                              <Text style={styles.sessionActionText}>Take attendance</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.sessionActionButton, styles.sessionActionButtonSecondary]}
                              onPress={() => {
                                navigation.navigate('GroupScheduleEditor', {
                                  groupId: session.groupId,
                                  groupName: session.groupName,
                                });
                              }}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
                              <Text style={[styles.sessionActionText, styles.sessionActionTextSecondary]}>Edit</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </AppCard>
            );
          })}
        </View>
      )}
    </AppScreen>
  );
};

export default CoachScheduleScreen;
