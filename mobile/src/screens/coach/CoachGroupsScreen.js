import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from '../../context/NotificationContext';
import apiClient from '../../services/apiClient';
import { AppScreen, AppButton, AppInput, AppFAB, BottomSheet } from '../../ui/components';
import { styles } from '../../styles/screens/CoachGroupsScreen.styles';
import { formatGroupSchedule } from '../../utils/schedule';
import { colors, spacing } from '../../ui/tokens';

const CoachGroupsScreen = () => {
  const navigation = useNavigation();
  const notifications = useNotifications();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [form, setForm] = useState({ 
    name: '', 
    description: '', 
    defaultMonthlyFee: '',
    trainingDays: [],
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/groups');
      setGroups(data);
    } catch (err) {
      setError(err.message);
      notifications.error(err.message || 'Failed to load teams');
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

  // Filter groups by search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const query = searchQuery.toLowerCase();
    return groups.filter(group => 
      group.name?.toLowerCase().includes(query) ||
      group.description?.toLowerCase().includes(query)
    );
  }, [groups, searchQuery]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleTrainingDay = (dayIndex) => {
    setForm((prev) => {
      const currentDays = prev.trainingDays || [];
      const isSelected = currentDays.includes(dayIndex);
      return {
        ...prev,
        trainingDays: isSelected
          ? currentDays.filter(d => d !== dayIndex)
          : [...currentDays, dayIndex].sort((a, b) => a - b),
      };
    });
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Team name is required');
      notifications.error('Please enter a team name');
      return;
    }

    setError(null);
    setCreating(true);
    try {
      const payload = {
        name: form.name.trim(),
        defaultMonthlyFee: Number(form.defaultMonthlyFee) || 0,
        description: form.description.trim() || undefined,
      };

      // Only include trainingDays if at least one is selected
      if (form.trainingDays && form.trainingDays.length > 0) {
        payload.trainingDays = form.trainingDays;
      }

      await apiClient.post('/groups', payload);
      notifications.success(`Team "${form.name}" created successfully!`);
      setForm({ name: '', description: '', defaultMonthlyFee: '', trainingDays: [] });
      setShowCreateSheet(false);
      fetchGroups();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create team';
      setError(errorMessage);
      notifications.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleSendReminders = async (groupId) => {
    // Get current month in YYYY-MM format
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    try {
      const response = await apiClient.post('/notifications/group-payment-reminders', {
        groupId,
        month,
      });
      const result = response.data;
      
      if (result.testMode) {
        notifications.warning('⚠️ SMS is in TEST MODE. No actual messages were sent.');
      } else if (result.success && result.sent > 0) {
        notifications.success(`Sent ${result.sent} reminder${result.sent !== 1 ? 's' : ''} for ${result.month}`);
      } else {
        notifications.info(result.message || 'No reminders sent');
      }
    } catch (err) {
      notifications.error(err.message || 'Failed to send reminders');
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayIndices = [0, 1, 2, 3, 4, 5, 6];

  return (
    <AppScreen
      scrollViewProps={{
        refreshControl: <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />,
      }}
    >
      {/* Top Section */}
      <View style={styles.topSection}>
        <Text style={styles.title}>Teams</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search teams..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Teams List */}
      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredGroups.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No teams found' : 'No teams yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery 
              ? 'Try a different search term' 
              : 'Create your first team to get started'}
          </Text>
          {!searchQuery && (
            <AppButton
              variant="primary"
              title="Create Team"
              onPress={() => setShowCreateSheet(true)}
              style={styles.emptyButton}
            />
          )}
        </View>
      ) : (
        <View style={styles.teamsList}>
          {filteredGroups.map((team) => (
            <TouchableOpacity
              key={team._id}
              style={styles.teamCard}
              onPress={() => navigation.navigate('GroupDetails', { groupId: team._id, groupName: team.name })}
              activeOpacity={0.7}
            >
              <View style={styles.teamCardContent}>
                <View style={styles.teamCardLeft}>
                  <View style={styles.teamIcon}>
                    <Ionicons name="people" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.teamInfo}>
                    <Text style={styles.teamName}>{team.name}</Text>
                    <Text style={styles.teamSchedule}>{formatGroupSchedule(team)}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
              </View>
              
              <View style={styles.teamCardActions}>
                <TouchableOpacity
                  style={styles.miniButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    navigation.navigate('Attendance', { groupId: team._id });
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                  <Text style={styles.miniButtonText}>Attendance</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.miniButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleSendReminders(team._id);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="notifications" size={16} color={colors.warning} />
                  <Text style={styles.miniButtonText}>Remind pay</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* FAB */}
      <AppFAB
        icon={<Ionicons name="add" size={28} color="#ffffff" />}
        onPress={() => setShowCreateSheet(true)}
        position="bottom-right"
      />

      {/* Create Team BottomSheet */}
      <BottomSheet
        visible={showCreateSheet}
        onClose={() => {
          setShowCreateSheet(false);
          setForm({ name: '', description: '', defaultMonthlyFee: '', trainingDays: [] });
          setError(null);
        }}
        snapHeight={0.85}
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Create New Team</Text>
          
          <AppInput
              label="Team Name"
              value={form.name}
              onChangeText={(value) => handleChange('name', value)}
              placeholder="e.g., Senior Team, Junior Squad"
              leftIcon={<Ionicons name="people" size={20} color={colors.textMuted} />}
            />

            <AppInput
              label="Default Monthly Fee ($)"
              value={form.defaultMonthlyFee}
              onChangeText={(value) => handleChange('defaultMonthlyFee', value)}
              placeholder="0.00"
              keyboardType="decimal-pad"
              leftIcon={<Ionicons name="cash" size={20} color={colors.textMuted} />}
            />

            <View style={styles.trainingDaysSection}>
              <Text style={styles.trainingDaysLabel}>Training Days (Optional)</Text>
              <Text style={styles.trainingDaysHint}>Select days when this team trains</Text>
              <View style={styles.trainingDaysGrid}>
                {dayIndices.map((dayIndex) => {
                  const isSelected = form.trainingDays?.includes(dayIndex);
                  return (
                    <TouchableOpacity
                      key={dayIndex}
                      style={[
                        styles.dayButton,
                        isSelected && styles.dayButtonSelected,
                      ]}
                      onPress={() => handleToggleTrainingDay(dayIndex)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dayButtonText,
                          isSelected && styles.dayButtonTextSelected,
                        ]}
                      >
                        {dayNames[dayIndex]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <AppInput
              label="Description (Optional)"
              value={form.description}
              onChangeText={(value) => handleChange('description', value)}
              placeholder="Add details about this team..."
              multiline
              numberOfLines={3}
            />

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.sheetFooter}>
            <AppButton
              variant="secondary"
              title="Cancel"
              onPress={() => {
                setShowCreateSheet(false);
                setForm({ name: '', description: '', defaultMonthlyFee: '', trainingDays: [] });
                setError(null);
              }}
              style={[styles.sheetButton, { marginRight: spacing.sm }]}
            />
            <AppButton
              variant="primary"
              title="Create Team"
              onPress={handleSubmit}
              loading={creating}
              style={[styles.sheetButton, { flex: 1 }]}
            />
          </View>
        </View>
      </BottomSheet>
    </AppScreen>
  );
};


export default CoachGroupsScreen;
