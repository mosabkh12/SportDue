import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { colors } from '../../styles/theme';

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
      setShowAddPlayer(false);
      fetchGroupDetails();
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
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Group not found</Text>
      </View>
    );
  }

  const totalRevenue = players.reduce((sum, p) => sum + (p.monthlyFee || 0), 0);
  const getDaySuffix = (day) => (day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th');

  return (
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  loader: {
    marginTop: 100,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backIcon: {
    fontSize: 24,
    color: colors.textPrimary,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  deleteBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 20,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: colors.bgSecondary,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  quickStatValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
  },
  secondaryBtn: {
    backgroundColor: '#3b82f6',
  },
  configBtn: {
    backgroundColor: '#8b5cf6',
  },
  reminderBtn: {
    backgroundColor: '#f59e0b',
  },
  actionBtnIcon: {
    fontSize: 18,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  section: {
    padding: 16,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginRight: 8,
  },
  sectionCount: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  playerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  playerPhone: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  playerBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  badgePassword: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'monospace',
  },
  playerFee: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  playerFeeAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  playerFeeLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  chevron: {
    fontSize: 24,
    color: colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderTopWidth: 2,
    borderTopColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalClose: {
    fontSize: 24,
    color: colors.textMuted,
    width: 32,
    height: 32,
    textAlign: 'center',
    lineHeight: 32,
  },
  modalBody: {
    padding: 20,
    maxHeight: 500,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.bgTertiary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  inputHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 8,
  },
  infoBox: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    marginTop: 8,
  },
  infoBoxText: {
    fontSize: 13,
    color: '#22c55e',
    fontWeight: '600',
    lineHeight: 18,
  },
  resultBox: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 2,
  },
  resultBoxSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10b981',
  },
  resultBoxError: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#ef4444',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  resultTitleSuccess: {
    color: '#10b981',
  },
  resultTitleError: {
    color: '#ef4444',
  },
  resultText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  testModeWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  testModeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f59e0b',
    marginBottom: 8,
  },
  testModeText: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 20,
    marginTop: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalBtnPrimary: {
    backgroundColor: colors.primary,
  },
  modalBtnDisabled: {
    opacity: 0.5,
  },
  modalBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalBtnTextPrimary: {
    color: '#fff',
  },
});

export default GroupDetailsScreen;
