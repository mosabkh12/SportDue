import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNotifications } from '../../context/NotificationContext';
import apiClient from '../../services/apiClient';
import { AppButton, AppInput } from '../../ui/components';
import PlayerAttendanceRow from '../../components/PlayerAttendanceRow';
import { colors, spacing, radius, typography } from '../../ui/tokens';

const AttendanceScreen = ({ route }) => {
  const { groupId, date: initialDate } = route.params || {};
  const navigation = useNavigation();
  const notifications = useNotifications();
  const insets = useSafeAreaInsets();

  const today = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const [date, setDate] = useState(initialDate || today);
  const [players, setPlayers] = useState([]);
  const [originalStatusMap, setOriginalStatusMap] = useState({}); // Last loaded attendance snapshot
  const [draftStatusMap, setDraftStatusMap] = useState({}); // Editable draft copy
  const [dirty, setDirty] = useState(false); // Unsaved changes flag
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'unmarked' | 'present' | 'absent' | 'late'
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // Date picker state
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const fetchPlayers = useCallback(async () => {
    try {
      const { data } = await apiClient.get(`/groups/${groupId}`);
      setPlayers(data.players || []);
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
        // On load: set originalStatusMap and draftStatusMap = originalStatusMap, dirty=false
        const deepCopy = JSON.parse(JSON.stringify(mapped));
        setOriginalStatusMap(deepCopy);
        setDraftStatusMap(deepCopy);
        setDirty(false);
      } catch (err) {
        // Silent error - attendance might not exist for this date
        setOriginalStatusMap({});
        setDraftStatusMap({});
        setDirty(false);
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

  // Check if draft differs from original (dirty flag)
  useEffect(() => {
    const isDirty = JSON.stringify(draftStatusMap) !== JSON.stringify(originalStatusMap);
    setDirty(isDirty);
  }, [draftStatusMap, originalStatusMap]);

  const handleStatusChange = useCallback((playerId, value) => {
    // On status change: update draftStatusMap[playerId], dirty = draft differs from original
    setDraftStatusMap((prev) => {
      const updated = {
        ...prev,
        [playerId]: {
          ...prev[playerId],
          status: value === '' ? null : value,
          isPresent: value === 'present' || value === 'late', // Late is saved as present
          signature: prev[playerId]?.signature || '',
        },
      };
      return updated;
    });
  }, []);

  const handleDiscardChanges = () => {
    // Reset draftStatusMap back to originalStatusMap and dirty=false
    setDraftStatusMap(JSON.parse(JSON.stringify(originalStatusMap)));
    setDirty(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Build changes array where draft != original
      // The existing API expects FULL list, so we build full list from draft
      const entries = players
        .filter((player) => {
          const playerAttendance = draftStatusMap[player._id];
          return playerAttendance?.status === 'present' || 
                 playerAttendance?.status === 'absent' || 
                 playerAttendance?.status === 'late';
        })
        .map((player) => ({
          playerId: player._id,
          isPresent: draftStatusMap[player._id]?.status === 'present' || draftStatusMap[player._id]?.status === 'late',
          signature: draftStatusMap[player._id]?.signature || '',
        }));

      if (entries.length === 0) {
        notifications.error('Please select status for at least one player');
        setSaving(false);
        return;
      }

      await apiClient.post('/attendance/mark', {
        groupId,
        date,
        records: entries,
      });
      
      // On success: originalStatusMap = draftStatusMap, dirty=false
      notifications.success('Attendance saved successfully!');
      setOriginalStatusMap(JSON.parse(JSON.stringify(draftStatusMap)));
      setDirty(false);
    } catch (err) {
      // On error: show Alert/Toast and keep draft unsaved
      notifications.error(err.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    const present = players.filter((p) => draftStatusMap[p._id]?.status === 'present').length;
    const absent = players.filter((p) => draftStatusMap[p._id]?.status === 'absent').length;
    const late = players.filter((p) => draftStatusMap[p._id]?.status === 'late').length;
    return { present, absent, late };
  }, [players, draftStatusMap]);

  const filteredPlayers = useMemo(() => {
    let filtered = players;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => p.fullName.toLowerCase().includes(query));
    }
    
    // Filter by status
    if (statusFilter === 'unmarked') {
      filtered = filtered.filter((p) => !draftStatusMap[p._id]?.status);
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => draftStatusMap[p._id]?.status === statusFilter);
    }
    
    return filtered;
  }, [players, draftStatusMap, searchQuery, statusFilter]);

  const markAllPresent = () => {
    // "All Present": update all players in draftStatusMap, dirty=true
    setDraftStatusMap((prev) => {
      const updated = { ...prev };
      players.forEach((player) => {
        updated[player._id] = {
          status: 'present',
          isPresent: true,
          signature: prev[player._id]?.signature || '',
        };
      });
      return updated;
    });
  };

  const markAllAbsent = () => {
    // "All Absent": update all players in draftStatusMap, dirty=true
    setDraftStatusMap((prev) => {
      const updated = { ...prev };
      players.forEach((player) => {
        updated[player._id] = {
          status: 'absent',
          isPresent: false,
          signature: prev[player._id]?.signature || '',
        };
      });
      return updated;
    });
  };

  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
    const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
    return `${dayName}, ${day} ${monthName}`;
  };

  const navigateDate = (days) => {
    const [year, month, day] = date.split('-').map(Number);
    const currentDate = new Date(year, month - 1, day);
    currentDate.setDate(currentDate.getDate() + days);
    const newDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    setDate(newDate);
  };

  const getDateKey = (date) => {
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

  const handleDateSelect = (selectedDate) => {
    if (selectedDate.getMonth() === currentMonth) {
      setDate(getDateKey(selectedDate));
      setShowDatePicker(false);
    }
  };

  const renderPlayerItem = useCallback(({ item: player }) => {
    const status = draftStatusMap[player._id]?.status || null;
    return (
      <PlayerAttendanceRow
        player={player}
        status={status}
        onSetStatus={handleStatusChange}
      />
    );
  }, [draftStatusMap, handleStatusChange]);

  return (
    <View style={styles.screenContainer}>
      <LinearGradient
        colors={[colors.bgTertiary, colors.bgSecondary, colors.bgPrimary]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={[styles.blob, styles.blob1]} />
        <View style={[styles.blob, styles.blob2]} />
        <View style={[styles.blob, styles.blob3]} />
      </LinearGradient>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Attendance</Text>
          <Text style={styles.headerSubtitle}>{formatDate(date)}</Text>
        </View>
        <View style={styles.headerRight}>
          {dirty && (
            <TouchableOpacity onPress={handleDiscardChanges} style={styles.discardButton}>
              <Ionicons name="close-circle-outline" size={20} color={colors.error} />
              <Text style={styles.discardButtonText}>Discard</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.calendarButton}>
            <Ionicons name="calendar-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Summary Cards */}
      <View style={styles.statusSummary}>
        <View style={[styles.statCard, { backgroundColor: colors.success + '15', borderColor: colors.success + '40' }]}>
          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
          <Text style={styles.statValue}>{stats.present}</Text>
          <Text style={styles.statLabel}>Present</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.error + '15', borderColor: colors.error + '40' }]}>
          <Ionicons name="close-circle" size={24} color={colors.error} />
          <Text style={styles.statValue}>{stats.absent}</Text>
          <Text style={styles.statLabel}>Absent</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.warning + '15', borderColor: colors.warning + '40' }]}>
          <Ionicons name="time" size={24} color={colors.warning} />
          <Text style={styles.statValue}>{stats.late}</Text>
          <Text style={styles.statLabel}>Late</Text>
        </View>
      </View>

      {/* Filters and Search */}
      <View style={styles.filtersSection}>
        <View style={styles.filterChips}>
          {['all', 'unmarked', 'present', 'absent', 'late'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                statusFilter === filter && styles.filterChipActive,
              ]}
              onPress={() => setStatusFilter(filter)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === filter && styles.filterChipTextActive,
                ]}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <AppInput
          placeholder="Search players..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Ionicons name="search" size={20} color={colors.textMuted} />}
          style={styles.searchInput}
        />
      </View>

      {/* Players List */}
      <FlatList
        data={filteredPlayers}
        keyExtractor={(item) => item._id}
        renderItem={renderPlayerItem}
        contentContainerStyle={styles.listContent}
        initialNumToRender={12}
        windowSize={7}
        removeClippedSubviews={true}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No players found</Text>
          </View>
        }
        refreshing={refreshing}
        onRefresh={async () => {
          setRefreshing(true);
          await Promise.all([fetchPlayers(), fetchAttendance(date)]);
          setRefreshing(false);
        }}
      />

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <TouchableOpacity
          style={styles.bottomBarButton}
          onPress={markAllPresent}
        >
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={styles.bottomBarButtonText}>All Present</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomBarButton}
          onPress={markAllAbsent}
        >
          <Ionicons name="close-circle" size={20} color={colors.error} />
          <Text style={styles.bottomBarButtonText}>All Absent</Text>
        </TouchableOpacity>
        <AppButton
          variant="primary"
          title="Save"
          onPress={handleSave}
          loading={saving}
          disabled={!dirty || saving}
          style={styles.saveButton}
        />
      </View>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.calendarContainer}>
              <View style={styles.monthNavigation}>
                <TouchableOpacity onPress={() => navigateMonth('prev')}>
                  <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.monthYearText}>
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][currentMonth]} {currentYear}
                </Text>
                <TouchableOpacity onPress={() => navigateMonth('next')}>
                  <Ionicons name="chevron-forward" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
              <View style={styles.calendarGrid}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <View key={day} style={styles.calendarHeaderCell}>
                    <Text style={styles.calendarHeaderText}>{day}</Text>
                  </View>
                ))}
                {getCalendarDates().map((dateItem, index) => {
                  const isCurrentMonth = dateItem.getMonth() === currentMonth;
                  const isSelected = getDateKey(dateItem) === date;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.calendarCell,
                        !isCurrentMonth && styles.calendarCellOtherMonth,
                        isSelected && styles.calendarCellSelected,
                      ]}
                      onPress={() => handleDateSelect(dateItem)}
                      disabled={!isCurrentMonth}
                    >
                      <Text
                        style={[
                          styles.calendarCellText,
                          !isCurrentMonth && styles.calendarCellTextOtherMonth,
                          isSelected && styles.calendarCellTextSelected,
                        ]}
                      >
                        {dateItem.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      </Modal>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.08,
  },
  blob1: {
    width: 300,
    height: 300,
    top: -100,
    right: -100,
    backgroundColor: colors.primary,
  },
  blob2: {
    width: 200,
    height: 200,
    bottom: -50,
    left: -50,
    backgroundColor: colors.accent,
  },
  blob3: {
    width: 150,
    height: 150,
    top: '40%',
    right: '20%',
    backgroundColor: colors.secondary,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  discardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.error + '15',
    gap: spacing.xs,
  },
  discardButtonText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
  },
  calendarButton: {
    padding: spacing.sm,
  },
  statusSummary: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  statValue: {
    ...typography.h2,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  filtersSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  filterChips: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.primary,
  },
  searchInput: {
    marginBottom: 0,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100, // Space for bottom bar
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  bottomBarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
    minHeight: 56,
  },
  bottomBarButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  saveButton: {
    flex: 1,
    minHeight: 56,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h2,
  },
  calendarContainer: {
    padding: spacing.lg,
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
  },
  calendarCellOtherMonth: {
    opacity: 0.3,
  },
  calendarCellSelected: {
    backgroundColor: colors.primary + '20',
    borderWidth: 2,
    borderColor: colors.primary,
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
});

export default AttendanceScreen;
