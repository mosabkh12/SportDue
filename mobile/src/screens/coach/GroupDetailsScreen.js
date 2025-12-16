import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from '../../context/NotificationContext';
import apiClient from '../../services/apiClient';
import StatCard from '../../components/StatCard';
import { AppScreen } from '../../ui/components';
import { styles } from '../../styles/screens/GroupDetailsScreen.styles';
import { colors } from '../../styles/theme';
import { formatGroupSchedule } from '../../utils/schedule';

const GroupDetailsScreen = ({ route }) => {
  const { groupId, groupName } = route.params;
  const navigation = useNavigation();
  const notifications = useNotifications();
  
  const [group, setGroup] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Modals
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  
  // Forms
  const [playerForm, setPlayerForm] = useState({ fullName: '', phone: '', monthlyFee: '', notes: '' });
  const [configForm, setConfigForm] = useState({ defaultMonthlyFee: '', paymentDueDay: '' });
  const [reminderForm, setReminderForm] = useState({ month: '', customMessage: '' });
  
  // States
  const [submitting, setSubmitting] = useState(false);
  const [reminderResult, setReminderResult] = useState(null);

  const fetchGroupDetails = async () => {
    try {
      const { data } = await apiClient.get(`/groups/${groupId}`);
      setGroup(data.group);
      setPlayers(data.players || []);
      
      if (data.group) {
        setConfigForm({
          defaultMonthlyFee: String(data.group.defaultMonthlyFee || 0),
          paymentDueDay: String(data.group.paymentDueDay || ''),
        });
        
        const today = new Date();
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        setReminderForm({ month: currentMonth, customMessage: '' });
      }
    } catch (err) {
      notifications.error(err.message || 'Failed to load group details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  useEffect(() => {
    if (group?.defaultMonthlyFee !== undefined) {
      setPlayerForm((prev) => ({
        ...prev,
        monthlyFee: prev.monthlyFee || String(group.defaultMonthlyFee || ''),
      }));
    }
  }, [group?.defaultMonthlyFee]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGroupDetails();
  };

  const handleAddPlayer = async () => {
    if (!playerForm.fullName || !playerForm.phone) {
      notifications.error('Full name and phone are required');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post(`/groups/${groupId}/players`, {
        fullName: playerForm.fullName,
        phone: playerForm.phone,
        monthlyFee: Number(playerForm.monthlyFee) || group?.defaultMonthlyFee || 0,
        notes: playerForm.notes || undefined,
      });
      notifications.success('Player added successfully');
      setPlayerForm({ fullName: '', phone: '', monthlyFee: group?.defaultMonthlyFee ? String(group.defaultMonthlyFee) : '', notes: '' });
      Animated.timing(addPlayerSlideAnim, {
        toValue: 1000,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setShowAddPlayer(false);
        fetchGroupDetails();
      });
    } catch (err) {
      notifications.error(err.message || 'Failed to add player');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateConfig = async () => {
    setSubmitting(true);
    try {
      const updates = {};
      if (configForm.defaultMonthlyFee) {
        updates.defaultMonthlyFee = parseFloat(configForm.defaultMonthlyFee);
      }
      if (configForm.paymentDueDay) {
        updates.paymentDueDay = parseInt(configForm.paymentDueDay);
      }
      
      await apiClient.put(`/groups/${groupId}`, updates);
      notifications.success('Group settings updated');
      setShowConfig(false);
      fetchGroupDetails();
    } catch (err) {
      notifications.error(err.message || 'Failed to update settings');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReminders = async () => {
    if (!reminderForm.month) {
      notifications.error('Please select a month');
      return;
    }
    
    setSubmitting(true);
    setReminderResult(null);
    try {
      const response = await apiClient.post('/notifications/group-payment-reminders', {
        groupId,
        month: reminderForm.month,
        customMessage: reminderForm.customMessage || undefined,
      });
      const result = response.data;
      setReminderResult(result);
      
      if (result.testMode) {
        notifications.warning('⚠️ SMS is in TEST MODE. No actual messages were sent. Check server .env file to enable real SMS.');
      } else if (result.success && result.sent > 0) {
        notifications.success(`Sent ${result.sent} reminder${result.sent !== 1 ? 's' : ''}`);
      } else {
        notifications.info(result.message || 'No reminders sent');
      }
    } catch (err) {
      notifications.error(err.message || 'Failed to send reminders');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      'Delete Group',
      `Delete "${group?.name}"? This will permanently delete the group, all ${players.length} players, payments, and attendance records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/groups/${groupId}`);
              notifications.success('Group deleted');
              navigation.goBack();
            } catch (err) {
              notifications.error(err.message || 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        </View>
      </AppScreen>
    );
  }

  if (!group) {
    return (
      <AppScreen>
        <View style={styles.container}>
          <Text style={styles.errorText}>Group not found</Text>
        </View>
      </AppScreen>
    );
  }

  const totalRevenue = players.reduce((sum, p) => sum + (p.monthlyFee || 0), 0);
  const getDaySuffix = (day) => (day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th');

  return (
    <AppScreen>
      <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{group.name}</Text>
          {group.description && (
            <Text style={styles.headerSubtitle} numberOfLines={2}>{group.description}</Text>
          )}
          <Text style={styles.headerSchedule}>{formatGroupSchedule(group)}</Text>
        </View>
        <TouchableOpacity onPress={handleDeleteGroup} style={styles.deleteBtn}>
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.quickStat}>
          <Text style={styles.quickStatValue}>{players.length}</Text>
          <Text style={styles.quickStatLabel}>Players</Text>
        </View>
        <View style={styles.quickStatDivider} />
        <View style={styles.quickStat}>
          <Text style={styles.quickStatValue}>${totalRevenue.toFixed(0)}</Text>
          <Text style={styles.quickStatLabel}>Monthly</Text>
        </View>
        <View style={styles.quickStatDivider} />
        <View style={styles.quickStat}>
          <Text style={styles.quickStatValue}>${(group.defaultMonthlyFee || 0).toFixed(0)}</Text>
          <Text style={styles.quickStatLabel}>Default Fee</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.primaryBtn]}
          onPress={() => setShowAddPlayer(true)}
        >
          <Text style={styles.actionBtnIcon}>➕</Text>
          <Text style={styles.actionBtnText}>Add Player</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.secondaryBtn]}
          onPress={() => navigation.navigate('Attendance', { groupId, groupName: group.name })}
        >
          <Text style={styles.actionBtnIcon}>📋</Text>
          <Text style={styles.actionBtnText}>Attendance</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.configBtn]}
          onPress={() => setShowConfig(true)}
        >
          <Text style={styles.actionBtnIcon}>⚙️</Text>
          <Text style={styles.actionBtnText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.reminderBtn]}
          onPress={() => setShowReminders(true)}
        >
          <Text style={styles.actionBtnIcon}>📨</Text>
          <Text style={styles.actionBtnText}>Reminders</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.primaryBtn]}
          onPress={() => navigation.navigate('GroupScheduleEditor', { groupId, groupName: group.name })}
        >
          <Text style={styles.actionBtnIcon}>📅</Text>
          <Text style={styles.actionBtnText}>Edit Schedule</Text>
        </TouchableOpacity>
      </View>

      {/* Players List */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Team Members</Text>
          <Text style={styles.sectionCount}>({players.length})</Text>
        </View>

        {players.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>No players yet</Text>
            <Text style={styles.emptySubtext}>Tap "Add Player" to get started</Text>
          </View>
        ) : (
          <FlatList
            data={players}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.playerCard}
                onPress={() =>
                  navigation.navigate('PlayerDetails', {
                    playerId: item._id,
                    playerName: item.fullName,
                  })
                }
                activeOpacity={0.7}
              >
                <View style={styles.playerAvatar}>
                  <Text style={styles.playerAvatarText}>
                    {item.fullName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{item.fullName}</Text>
                  <Text style={styles.playerPhone}>📞 {item.phone || 'No phone'}</Text>
                  <View style={styles.playerBadges}>
                    {item.username && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>👤 {item.username}</Text>
                      </View>
                    )}
                    {item.displayPassword && (
                      <View style={[styles.badge, styles.badgePassword]}>
                        <Text style={styles.badgeText}>🔑 {item.displayPassword}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.playerFee}>
                  <Text style={styles.playerFeeAmount}>${(item.monthlyFee || 0).toFixed(2)}</Text>
                  <Text style={styles.playerFeeLabel}>/month</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* Add Player Modal */}
      <Modal
        visible={showAddPlayer}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddPlayer(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Team Member</Text>
              <TouchableOpacity onPress={() => setShowAddPlayer(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter full name"
                placeholderTextColor={colors.textMuted}
                value={playerForm.fullName}
                onChangeText={(text) => setPlayerForm({ ...playerForm, fullName: text })}
              />

              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 0526867838"
                placeholderTextColor={colors.textMuted}
                value={playerForm.phone}
                onChangeText={(text) => setPlayerForm({ ...playerForm, phone: text })}
                keyboardType="phone-pad"
                maxLength={20}
              />
              <Text style={styles.inputHint}>Used for SMS notifications</Text>

              <Text style={styles.inputLabel}>Monthly Fee</Text>
              <TextInput
                style={styles.input}
                placeholder={`Default: $${(group.defaultMonthlyFee || 0).toFixed(2)}`}
                placeholderTextColor={colors.textMuted}
                value={playerForm.monthlyFee}
                onChangeText={(text) => setPlayerForm({ ...playerForm, monthlyFee: text })}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Additional information..."
                placeholderTextColor={colors.textMuted}
                value={playerForm.notes}
                onChangeText={(text) => setPlayerForm({ ...playerForm, notes: text })}
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => {
                  setShowAddPlayer(false);
                  setPlayerForm({ fullName: '', phone: '', monthlyFee: group?.defaultMonthlyFee ? String(group.defaultMonthlyFee) : '', notes: '' });
                }}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={handleAddPlayer}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.modalBtnText, styles.modalBtnTextPrimary]}>Add Player</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Configuration Modal */}
      <Modal
        visible={showConfig}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowConfig(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Group Settings</Text>
              <TouchableOpacity onPress={() => setShowConfig(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Default Monthly Fee</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                value={configForm.defaultMonthlyFee}
                onChangeText={(text) => setConfigForm({ ...configForm, defaultMonthlyFee: text })}
                keyboardType="numeric"
              />
              <Text style={styles.inputHint}>
                Default fee for new players
              </Text>

              <Text style={styles.inputLabel}>Payment Due Day</Text>
              <TextInput
                style={styles.input}
                placeholder="Day of month (1-31)"
                placeholderTextColor={colors.textMuted}
                value={configForm.paymentDueDay}
                onChangeText={(text) => {
                  const day = parseInt(text);
                  if (text === '' || (!isNaN(day) && day >= 1 && day <= 31)) {
                    setConfigForm({ ...configForm, paymentDueDay: text });
                  }
                }}
                keyboardType="numeric"
                maxLength={2}
              />
              <Text style={styles.inputHint}>
                Day when payments are due each month. Reminders sent at 9:00 AM.
              </Text>

              {group.paymentDueDay && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoBoxText}>
                    ✓ Reminders scheduled for the {group.paymentDueDay}
                    {getDaySuffix(group.paymentDueDay)} of each month
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowConfig(false)}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={handleUpdateConfig}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.modalBtnText, styles.modalBtnTextPrimary]}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reminders Modal */}
      <Modal
        visible={showReminders}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReminders(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Payment Reminders</Text>
              <TouchableOpacity onPress={() => setShowReminders(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Billing Period *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM (e.g., 2025-01)"
                placeholderTextColor={colors.textMuted}
                value={reminderForm.month}
                onChangeText={(text) => setReminderForm({ ...reminderForm, month: text })}
              />
              <Text style={styles.inputHint}>
                Select the month for payment reminders
              </Text>

              <Text style={styles.inputLabel}>Custom Message (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Leave blank to use default message"
                placeholderTextColor={colors.textMuted}
                value={reminderForm.customMessage}
                onChangeText={(text) => setReminderForm({ ...reminderForm, customMessage: text })}
                multiline
                numberOfLines={4}
              />

              {reminderResult && (
                <>
                  {reminderResult.testMode && (
                    <View style={styles.testModeWarning}>
                      <Text style={styles.testModeTitle}>⚠️ TEST MODE</Text>
                      <Text style={styles.testModeText}>
                        SMS is in test mode. No actual messages were sent. To enable real SMS:
                      </Text>
                      <Text style={styles.testModeText}>
                        1. Set SMS_ENABLED=true in server .env file
                      </Text>
                      <Text style={styles.testModeText}>
                        2. Configure BULKGATE_APP_ID and BULKGATE_TOKEN
                      </Text>
                    </View>
                  )}
                  <View style={[
                    styles.resultBox,
                    reminderResult.success ? styles.resultBoxSuccess : styles.resultBoxError,
                  ]}>
                    <Text style={[
                      styles.resultTitle,
                      reminderResult.success ? styles.resultTitleSuccess : styles.resultTitleError,
                    ]}>
                      {reminderResult.success
                        ? `✓ Sent ${reminderResult.sent} reminder${reminderResult.sent !== 1 ? 's' : ''}`
                        : '✗ Failed to send'}
                    </Text>
                    {reminderResult.message && (
                      <Text style={styles.resultText}>{reminderResult.message}</Text>
                    )}
                    {reminderResult.failed > 0 && (
                      <Text style={styles.resultText}>
                        {reminderResult.failed} failed to send
                      </Text>
                    )}
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => {
                  setShowReminders(false);
                  setReminderResult(null);
                }}
              >
                <Text style={styles.modalBtnText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary, !reminderForm.month && styles.modalBtnDisabled]}
                onPress={handleSendReminders}
                disabled={submitting || !reminderForm.month}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.modalBtnText, styles.modalBtnTextPrimary]}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </View>
    </AppScreen>
  );
};


export default GroupDetailsScreen;
