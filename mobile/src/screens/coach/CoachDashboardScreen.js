import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import apiClient from '../../services/apiClient';
import StatCard from '../../components/StatCard';
import { styles } from '../../styles/screens/CoachDashboardScreen.styles';
import { colors } from '../../styles/theme';

const CoachDashboardScreen = () => {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const notifications = useNotifications();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', defaultMonthlyFee: '' });
  const [activeTab, setActiveTab] = useState('groups');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day; // Get Sunday of current week
    const sunday = new Date(today.setDate(diff));
    sunday.setHours(0, 0, 0, 0);
    return sunday;
  });
  const [dayCancelledStatus, setDayCancelledStatus] = useState({}); // Track if day is fully cancelled: { "dateKey": true/false }

  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/groups');
      setGroups(data);
      // Check cancelled status for the current week
      checkCancelledDays(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkCancelledDays = (groupsData) => {
    try {
      const dayCancelledMap = {};
      
      // For each day in the week
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const date = new Date(currentWeekStart);
        date.setDate(currentWeekStart.getDate() + dayIndex);
        date.setHours(0, 0, 0, 0);
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        // Check all groups for this day
        let hasAnyTraining = false;
        let hasNonCancelledTraining = false;
        
        for (const group of groupsData) {
          if (!group.trainingDays || !Array.isArray(group.trainingDays)) continue;
          
          const dayOfWeek = date.getDay();
          const isRecurringDay = group.trainingDays.includes(dayOfWeek);
          const isCancelled = group.cancelledDates && Array.isArray(group.cancelledDates) && group.cancelledDates.includes(dateKey);
          const isAdded = group.addedDates && Array.isArray(group.addedDates) && group.addedDates.includes(dateKey);
          
          if (isRecurringDay && !isCancelled) {
            hasAnyTraining = true;
            hasNonCancelledTraining = true;
          } else if (isAdded) {
            hasAnyTraining = true;
            hasNonCancelledTraining = true;
          } else if (isRecurringDay && isCancelled) {
            hasAnyTraining = true;
            // This group is cancelled
          }
        }
        
        // Day is fully cancelled if there are trainings but none are non-cancelled
        dayCancelledMap[dateKey] = hasAnyTraining && !hasNonCancelledTraining;
      }
      
      setDayCancelledStatus(dayCancelledMap);
    } catch (err) {
      // Silent fail
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

  useEffect(() => {
    // Recheck cancelled days when week changes
    if (groups.length > 0) {
      checkCancelledDays(groups);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeekStart]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      await apiClient.post('/groups', {
        ...form,
        defaultMonthlyFee: Number(form.defaultMonthlyFee) || 0,
      });
      notifications.success(`Training group "${form.name}" has been created successfully.`);
      setForm({ name: '', description: '', defaultMonthlyFee: '' });
      fetchGroups();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create group';
      setError(errorMessage);
      notifications.error(errorMessage);
    }
  };

  const totalPlayers = groups.reduce((acc, group) => acc + (group.playerCount || 0), 0);

  // Helper function to get time for a specific date
  const getTimeForDate = (group, date) => {
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    // Check for per-date time override
    if (group.dateTimes && group.dateTimes[dateKey]) {
      const time = group.dateTimes[dateKey];
      if (time.startTime || time.endTime) {
        return { startTime: time.startTime || group.trainingTime?.startTime || '18:00', endTime: time.endTime || group.trainingTime?.endTime || '19:30' };
      }
    }
    
    // Return default training time
    return group.trainingTime || { startTime: '18:00', endTime: '19:30' };
  };

  // Helper function to check if a date is cancelled
  const isDateCancelled = (group, date) => {
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return group.cancelledDates && Array.isArray(group.cancelledDates) && group.cancelledDates.includes(dateKey);
  };

  // Helper function to check if a date is added
  const isDateAdded = (group, date) => {
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return group.addedDates && Array.isArray(group.addedDates) && group.addedDates.includes(dateKey);
  };

  // Build weekly schedule
  const buildWeeklySchedule = () => {
    const weekSchedule = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Initialize all days
    dayNames.forEach((day, index) => {
      weekSchedule[index] = [];
    });

    // Process each group
    groups.forEach((group) => {
      if (!group.trainingDays || !Array.isArray(group.trainingDays)) return;

      // Process recurring training days
      group.trainingDays.forEach((dayIndex) => {
        const date = new Date(currentWeekStart);
        date.setDate(currentWeekStart.getDate() + dayIndex);
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        const isCancelled = isDateCancelled(group, date);
        const time = getTimeForDate(group, date);
        weekSchedule[dayIndex].push({
          groupId: group._id,
          groupName: group.name,
          time,
          isRecurring: true,
          dateKey,
          isCancelled,
        });
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
            const time = getTimeForDate(group, addedDate);
            weekSchedule[dayIndex].push({
              groupId: group._id,
              groupName: group.name,
              time,
              isRecurring: false,
              isAdded: true,
              dateKey: dateStr,
            });
          }
        });
      }
    });

    // Sort each day's groups by start time
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
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
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
    const diff = today.getDate() - day;
    const sunday = new Date(today.setDate(diff));
    sunday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(sunday);
  };

  const formatWeekRange = () => {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const year = currentWeekStart.getFullYear();
    // If both dates are in the same month, show year once. Otherwise show year for each if different
    if (currentWeekStart.getMonth() === weekEnd.getMonth()) {
      return `${currentWeekStart.getDate()} - ${weekEnd.getDate()} ${monthNames[currentWeekStart.getMonth()]} ${year}`;
    } else {
      return `${currentWeekStart.getDate()} ${monthNames[currentWeekStart.getMonth()]} - ${weekEnd.getDate()} ${monthNames[weekEnd.getMonth()]} ${year}`;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Coach Dashboard</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.quickStat}>
            <View style={styles.quickStatIconContainer}>
              <Text style={styles.quickStatIcon}>👥</Text>
            </View>
            <Text style={styles.quickStatValue}>{loading ? '...' : groups.length}</Text>
            <Text style={styles.quickStatLabel}>Active Groups</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStat}>
            <View style={[styles.quickStatIconContainer, styles.quickStatIconContainerOrange]}>
              <Text style={styles.quickStatIcon}>🏃</Text>
            </View>
            <Text style={styles.quickStatValue}>{loading ? '...' : totalPlayers}</Text>
            <Text style={styles.quickStatLabel}>Total Players</Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'groups' && styles.tabActive]}
            onPress={() => setActiveTab('groups')}
          >
            <Text style={[styles.tabIcon, activeTab === 'groups' && styles.tabIconActive]}>📋</Text>
            <Text style={[styles.tabText, activeTab === 'groups' && styles.tabTextActive]}>Groups</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'schedule' && styles.tabActive]}
            onPress={() => setActiveTab('schedule')}
          >
            <Text style={[styles.tabIcon, activeTab === 'schedule' && styles.tabIconActive]}>📅</Text>
            <Text style={[styles.tabText, activeTab === 'schedule' && styles.tabTextActive]}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'create' && styles.tabActive]}
            onPress={() => setActiveTab('create')}
          >
            <Text style={[styles.tabIcon, activeTab === 'create' && styles.tabIconActive]}>➕</Text>
            <Text style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>Create</Text>
          </TouchableOpacity>
        </View>

        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Training Groups</Text>
              <Text style={styles.cardCount}>({groups.length})</Text>
            </View>
            {loading && !refreshing ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : !groups.length ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>No training groups yet</Text>
                <Text style={styles.emptySubtext}>Create your first group to get started</Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => setActiveTab('create')}
                >
                  <Text style={styles.emptyButtonText}>Create Group</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={groups || []}
                keyExtractor={(item) => item._id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.groupCard}
                    onPress={() => navigation.navigate('GroupDetails', { groupId: item._id, groupName: item.name })}
                    activeOpacity={0.7}
                  >
                    <View style={styles.groupCardHeader}>
                      <View style={styles.groupCardLeft}>
                        <View style={styles.groupIconContainer}>
                          <Text style={styles.groupIcon}>👥</Text>
                        </View>
                        <View style={styles.groupCardInfo}>
                          <Text style={styles.groupName}>{item.name}</Text>
                          <Text style={styles.groupDescription}>
                            {item.description || 'No description provided'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.groupCardStats}>
                      <View style={styles.groupStat}>
                        <Text style={styles.groupStatLabel}>Fee</Text>
                        <Text style={styles.groupStatValue}>
                          ${(item.defaultMonthlyFee || 0).toFixed(0)}
                        </Text>
                      </View>
                      <View style={styles.groupStatDivider} />
                      <View style={styles.groupStat}>
                        <Text style={styles.groupStatLabel}>Players</Text>
                        <Text style={styles.groupStatValue}>{item.playerCount || 0}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.groupButton}
                      onPress={() => navigation.navigate('GroupDetails', { groupId: item._id, groupName: item.name })}
                    >
                      <Text style={styles.groupButtonText}>Manage Group →</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Weekly Schedule</Text>
            </View>
            
            {/* Week Navigation */}
            <View style={styles.weekNavigation}>
              <TouchableOpacity onPress={navigateToPreviousWeek} style={styles.weekNavButton}>
                <Text style={styles.weekNavText}>←</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={navigateToCurrentWeek} style={styles.weekNavCurrent}>
                <Text style={styles.weekNavCurrentText}>{formatWeekRange()}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={navigateToNextWeek} style={styles.weekNavButton}>
                <Text style={styles.weekNavText}>→</Text>
              </TouchableOpacity>
            </View>

            {/* Schedule Days */}
            <View style={styles.scheduleContainer}>
              {dayNames.map((dayName, dayIndex) => {
                const dayGroups = weeklySchedule[dayIndex] || [];
                const date = new Date(currentWeekStart);
                date.setDate(currentWeekStart.getDate() + dayIndex);
                const today = new Date();
                const isToday = date.getDate() === today.getDate() && 
                               date.getMonth() === today.getMonth() && 
                               date.getFullYear() === today.getFullYear();
                const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                const isCancelled = dayCancelledStatus[dateKey] || false;
                
                return (
                  <View key={dayIndex} style={[
                    styles.scheduleDay,
                    isCancelled && styles.scheduleDayCancelled,
                  ]}>
                    <View style={[
                      styles.scheduleDayHeader,
                      isToday && styles.scheduleDayHeaderToday,
                      isCancelled && styles.scheduleDayHeaderCancelled,
                    ]}>
                      <View style={styles.scheduleDayHeaderLeft}>
                        <Text style={[
                          styles.scheduleDayName,
                          isToday && styles.scheduleDayNameToday,
                          isCancelled && styles.scheduleDayNameCancelled,
                        ]}>
                          {dayName}
                        </Text>
                        {isCancelled && (
                          <Text style={styles.scheduleDayCancelledBadge}>✕ Cancelled</Text>
                        )}
                      </View>
                      <Text style={[
                        styles.scheduleDayDate,
                        isToday && styles.scheduleDayDateToday,
                        isCancelled && styles.scheduleDayDateCancelled,
                      ]}>
                        {date.getDate()}/{date.getMonth() + 1}
                      </Text>
                    </View>
                    {dayGroups.length === 0 ? (
                      <View style={styles.scheduleEmpty}>
                        <Text style={styles.scheduleEmptyText}>No training</Text>
                      </View>
                    ) : (
                      <View style={styles.scheduleGroups}>
                        {dayGroups.map((item, idx) => (
                          <TouchableOpacity
                            key={`${item.groupId}-${item.dateKey}-${idx}`}
                            style={[
                              styles.scheduleGroupItem,
                              item.isCancelled && styles.scheduleGroupItemCancelled,
                            ]}
                            onPress={() => navigation.navigate('GroupDetails', { groupId: item.groupId, groupName: item.groupName })}
                            activeOpacity={0.7}
                          >
                            <View style={styles.scheduleGroupInfo}>
                              <Text style={[
                                styles.scheduleGroupName,
                                item.isCancelled && styles.scheduleGroupNameCancelled,
                              ]}>
                                {item.groupName}
                              </Text>
                              <View style={styles.scheduleGroupBadges}>
                                {item.isAdded && (
                                  <Text style={styles.scheduleGroupBadge}>+ Added</Text>
                                )}
                                {item.isCancelled && (
                                  <Text style={styles.scheduleGroupBadgeCancelled}>✕ Cancelled</Text>
                                )}
                              </View>
                            </View>
                            <Text style={[
                              styles.scheduleGroupTime,
                              item.isCancelled && styles.scheduleGroupTimeCancelled,
                            ]}>
                              {item.time.startTime} - {item.time.endTime}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Create Tab */}
        {activeTab === 'create' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Create New Group</Text>
            </View>
            <Text style={styles.cardSubtitle}>Set up a new training group with default payment settings</Text>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Group Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Senior Team, Junior Squad"
                  placeholderTextColor={colors.textMuted}
                  value={form.name}
                  onChangeText={(value) => handleChange('name', value)}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Default Monthly Fee ($)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  value={form.defaultMonthlyFee}
                  onChangeText={(value) => handleChange('defaultMonthlyFee', value)}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.helpText}>This will be the default fee for new players in this group</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Optional: Add details about this training group..."
                  placeholderTextColor={colors.textMuted}
                  value={form.description}
                  onChangeText={(value) => handleChange('description', value)}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>✨ Create Group</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};


export default CoachDashboardScreen;

