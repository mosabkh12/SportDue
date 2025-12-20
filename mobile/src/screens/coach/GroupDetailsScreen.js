import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../../context/NotificationContext';
import apiClient from '../../services/apiClient';
import StatCard from '../../components/StatCard';
import { AppScreen } from '../../ui/components';
import SegmentedTabs from '../../components/SegmentedTabs';
import BottomSheet from '../../ui/components/BottomSheet';
import { colors, spacing } from '../../ui/tokens';
import { formatGroupSchedule, getNextSession } from '../../utils/schedule';
import { styles } from '../../styles/screens/GroupDetailsScreen.styles';

const GroupDetailsScreen = ({ route }) => {
  const { groupId, groupName } = route.params;
  const navigation = useNavigation();
  const notifications = useNotifications();
  const insets = useSafeAreaInsets();
  
  const [group, setGroup] = useState(null);
  const [players, setPlayers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  
  // Modals
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  
  // Forms
  const [playerForm, setPlayerForm] = useState({ fullName: '', phone: '', email: '', monthlyFee: '', notes: '' });
  const [configForm, setConfigForm] = useState({ defaultMonthlyFee: '', paymentDueDay: '' });
  const [reminderForm, setReminderForm] = useState({ month: '', customMessage: '' });
  
  // States
  const [submitting, setSubmitting] = useState(false);
  const [reminderResult, setReminderResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all' | 'due' | 'late' | 'paid'

  // Fetch group details and players
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

  // Fetch payments for all players in the group
  const fetchPayments = async () => {
    try {
      const allPayments = [];
      for (const player of players) {
        try {
          const { data } = await apiClient.get(`/players/${player._id}/payments`);
          if (Array.isArray(data)) {
            data.forEach(payment => {
              allPayments.push({
                ...payment,
                playerId: player._id,
                playerName: player.fullName,
              });
            });
          }
        } catch (err) {
          // Skip if player payments fail
          console.warn(`Failed to fetch payments for player ${player._id}:`, err.message);
        }
      }
      setPayments(allPayments);
    } catch (err) {
      console.warn('Failed to fetch payments:', err.message);
    }
  };

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  useEffect(() => {
    if (players.length > 0) {
      fetchPayments();
    }
  }, [players]);

  useEffect(() => {
    if (group?.defaultMonthlyFee !== undefined) {
      setPlayerForm((prev) => ({
        ...prev,
        monthlyFee: prev.monthlyFee || String(group.defaultMonthlyFee || ''),
      }));
    }
  }, [group?.defaultMonthlyFee]);

  // Reset form when closing Add Player sheet
  const handleCloseAddPlayer = () => {
    setShowAddPlayer(false);
    setPlayerForm({ 
      fullName: '', 
      phone: '', 
      email: '', 
      monthlyFee: group?.defaultMonthlyFee ? String(group.defaultMonthlyFee) : '', 
      notes: '' 
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGroupDetails();
    if (players.length > 0) {
      await fetchPayments();
    }
  };

  const handleAddPlayer = async () => {
    if (!playerForm.fullName || !playerForm.fullName.trim()) {
      notifications.error('Name is required');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post(`/groups/${groupId}/players`, {
        fullName: playerForm.fullName.trim(),
        phone: playerForm.phone.trim() || '',
        monthlyFee: Number(playerForm.monthlyFee) || group?.defaultMonthlyFee || 0,
        notes: playerForm.notes?.trim() || undefined,
      });
      notifications.success('Player added successfully');
      handleCloseAddPlayer();
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
      setShowMoreMenu(false);
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

  // Computed values
  const scheduleSummary = useMemo(() => {
    if (!group || !group.trainingDays || group.trainingDays.length === 0) {
      return 'No schedule set';
    }
    return formatGroupSchedule(group);
  }, [group]);

  const nextSession = useMemo(() => {
    if (!group) return null;
    return getNextSession(group);
  }, [group]);

  const totalRevenue = useMemo(() => {
    return players.reduce((sum, p) => sum + (p.monthlyFee || 0), 0);
  }, [players]);

  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return players;
    const query = searchQuery.toLowerCase();
    return players.filter(p => 
      p.fullName?.toLowerCase().includes(query) ||
      p.phone?.includes(query) ||
      p.username?.toLowerCase().includes(query)
    );
  }, [players, searchQuery]);

  // Get payment due date
  const getPaymentDueDate = (month) => {
    if (!group?.paymentDueDay) return null;
    const [year, monthNum] = month.split('-').map(Number);
    const dueDay = Math.min(group.paymentDueDay, new Date(year, monthNum, 0).getDate());
    return new Date(year, monthNum - 1, dueDay);
  };

  // Check if payment is late
  const isPaymentLate = (payment) => {
    const amountDue = parseFloat(payment.amountDue || 0);
    const amountPaid = parseFloat(payment.amountPaid || 0);
    if (amountPaid >= amountDue) return false;

    const dueDate = getPaymentDueDate(payment.month);
    if (!dueDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return today > dueDate;
  };

  // Get payment status
  const getPaymentStatus = (payment) => {
    const amountDue = parseFloat(payment.amountDue || 0);
    const amountPaid = parseFloat(payment.amountPaid || 0);
    if (amountPaid >= amountDue) return 'paid';
    if (amountPaid > 0) return 'partial';
    return 'unpaid';
  };

  // Calculate payment summaries
  const paymentSummaries = useMemo(() => {
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const currentYear = today.getFullYear();
    const currentMonthNum = today.getMonth() + 1;
    const paymentDueDay = group?.paymentDueDay || 31;

    let dueThisMonth = 0;
    let late = 0;
    let collected = 0;

    payments.forEach(p => {
      const amountDue = parseFloat(p.amountDue || 0);
      const amountPaid = parseFloat(p.amountPaid || 0);
      const outstanding = amountDue - amountPaid;

      // Check if payment is for current month
      if (p.month === currentMonth) {
        dueThisMonth += amountDue;
        collected += amountPaid;

        // Check if late (unpaid/partial and past due date)
        if (outstanding > 0) {
          const dueDate = new Date(currentYear, currentMonthNum - 1, Math.min(paymentDueDay, new Date(currentYear, currentMonthNum, 0).getDate()));
          if (today > dueDate) {
            late += outstanding;
          }
        }
      }
    });

    return { dueThisMonth, late, collected };
  }, [payments, group?.paymentDueDay]);

  const latePaymentsCount = useMemo(() => {
    return payments.filter(p => isPaymentLate(p)).length;
  }, [payments]);

  // Filter payments based on selected filter
  const filteredPayments = useMemo(() => {
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    let filtered = payments.filter(p => p.month === currentMonth);

    if (paymentFilter === 'due') {
      filtered = filtered.filter(p => {
        const amountDue = parseFloat(p.amountDue || 0);
        const amountPaid = parseFloat(p.amountPaid || 0);
        return amountPaid < amountDue;
      });
    } else if (paymentFilter === 'late') {
      filtered = filtered.filter(p => isPaymentLate(p));
    } else if (paymentFilter === 'paid') {
      filtered = filtered.filter(p => {
        const amountDue = parseFloat(p.amountDue || 0);
        const amountPaid = parseFloat(p.amountPaid || 0);
        return amountPaid >= amountDue;
      });
    }

    // Sort by status (late first, then due, then paid)
    return filtered.sort((a, b) => {
      const aLate = isPaymentLate(a);
      const bLate = isPaymentLate(b);
      if (aLate && !bLate) return -1;
      if (!aLate && bLate) return 1;

      const aStatus = getPaymentStatus(a);
      const bStatus = getPaymentStatus(b);
      if (aStatus === 'unpaid' && bStatus !== 'unpaid') return -1;
      if (aStatus !== 'unpaid' && bStatus === 'unpaid') return 1;

      const aOutstanding = parseFloat(a.amountDue || 0) - parseFloat(a.amountPaid || 0);
      const bOutstanding = parseFloat(b.amountDue || 0) - parseFloat(b.amountPaid || 0);
      return bOutstanding - aOutstanding;
    });
  }, [payments, paymentFilter, group?.paymentDueDay]);

  // Handle bulk remind all late
  const handleRemindAllLate = () => {
    const lateCount = filteredPayments.filter(p => isPaymentLate(p)).length;
    if (lateCount === 0) {
      notifications.info('No late payments to remind');
      return;
    }

    Alert.alert(
      'Remind All Late',
      `Send payment reminders to ${lateCount} player${lateCount !== 1 ? 's' : ''} with late payments?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Reminders',
          onPress: async () => {
            const today = new Date();
            const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
            setSubmitting(true);
            try {
              const response = await apiClient.post('/notifications/group-payment-reminders', {
                groupId,
                month: currentMonth,
              });
              const result = response.data;
              if (result.testMode) {
                notifications.warning('⚠️ SMS is in TEST MODE. No actual messages were sent.');
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
          },
        },
      ]
    );
  };

  const getDaySuffix = (day) => (day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th');

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </AppScreen>
    );
  }

  if (!group) {
    return (
      <AppScreen>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Group not found</Text>
        </View>
      </AppScreen>
    );
  }

  // Tab configuration for SegmentedTabs
  const tabs = [
    { key: 'home', label: 'Home', icon: 'home-outline' },
    { key: 'players', label: 'Players', icon: 'people-outline' },
    { key: 'pay', label: 'Pay', icon: 'card-outline' },
    { key: 'plan', label: 'Plan', icon: 'calendar-outline' },
  ];

  return (
    <AppScreen useScrollView={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{group.name}</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>{scheduleSummary}</Text>
          </View>
          <TouchableOpacity onPress={() => setShowMoreMenu(true)} style={styles.moreBtn}>
            <Ionicons name="ellipsis-vertical" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Tab Bar */}
        <SegmentedTabs
          value={activeTab}
          onChange={setActiveTab}
          tabs={tabs}
        />

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'home' && (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
              <View style={styles.summaryGrid}>
                <StatCard label="Players" value={players.length} accent={colors.primary} />
                <StatCard label="Late Payments" value={latePaymentsCount} accent={colors.error} />
              </View>
              {nextSession && (
                <View style={styles.nextSessionCard}>
                  <View style={styles.nextSessionHeader}>
                    <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                    <Text style={styles.nextSessionTitle}>Next Session</Text>
                  </View>
                  <Text style={styles.nextSessionDate}>
                    {nextSession.dayName}, {nextSession.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                  <Text style={styles.nextSessionTime}>
                    {nextSession.time} - {nextSession.endTime}
                  </Text>
                </View>
              )}
              <View style={styles.summaryGrid}>
                <StatCard label="Monthly Revenue" value={totalRevenue} format="currency" accent={colors.success} />
                <StatCard label="Default Fee" value={group.defaultMonthlyFee || 0} format="currency" accent={colors.info} />
              </View>
            </ScrollView>
          )}

          {activeTab === 'players' && (
            <View style={styles.tabView}>
              {/* Search */}
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search players..."
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                    <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Players List */}
              <FlatList
                data={filteredPlayers}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.playerRow}
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
                      <View style={styles.playerMeta}>
                        <Ionicons name="call-outline" size={14} color={colors.textMuted} />
                        <Text style={styles.playerPhone}>{item.phone || 'No phone'}</Text>
                      </View>
                      {(item.username || item.displayPassword) && (
                        <View style={styles.playerBadges}>
                          {item.username && (
                            <View style={styles.badge}>
                              <Ionicons name="person-outline" size={12} color={colors.textPrimary} />
                              <Text style={styles.badgeText}>{item.username}</Text>
                            </View>
                          )}
                          {item.displayPassword && (
                            <View style={[styles.badge, styles.badgePassword]}>
                              <Ionicons name="lock-closed-outline" size={12} color={colors.textPrimary} />
                              <Text style={styles.badgeText}>{item.displayPassword}</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                    <View style={styles.playerFee}>
                      <Text style={styles.playerFeeAmount}>${(item.monthlyFee || 0).toFixed(2)}</Text>
                      <Text style={styles.playerFeeLabel}>/month</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={48} color={colors.textMuted} />
                    <Text style={styles.emptyText}>
                      {searchQuery ? 'No players found' : 'No players yet'}
                    </Text>
                    {!searchQuery && (
                      <Text style={styles.emptySubtext}>Tap the + button to add a player</Text>
                    )}
                  </View>
                }
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={filteredPlayers.length === 0 ? styles.emptyListContent : styles.listContent}
              />
            </View>
          )}

          {activeTab === 'pay' && (
            <View style={styles.tabView}>
              <FlatList
                data={filteredPayments}
                keyExtractor={(item) => item._id}
                ListHeaderComponent={
                  <>
                    {/* Summary Cards */}
                    <View style={styles.paymentSummaryGrid}>
                      <View style={styles.paymentSummaryCard}>
                        <Ionicons name="calendar-outline" size={20} color={colors.info} />
                        <Text style={styles.paymentSummaryValue}>${paymentSummaries.dueThisMonth.toFixed(2)}</Text>
                        <Text style={styles.paymentSummaryLabel}>Due this month</Text>
                      </View>
                      <View style={styles.paymentSummaryCard}>
                        <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
                        <Text style={styles.paymentSummaryValue}>${paymentSummaries.late.toFixed(2)}</Text>
                        <Text style={styles.paymentSummaryLabel}>Late</Text>
                      </View>
                      {paymentSummaries.collected > 0 && (
                        <View style={styles.paymentSummaryCard}>
                          <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
                          <Text style={styles.paymentSummaryValue}>${paymentSummaries.collected.toFixed(2)}</Text>
                          <Text style={styles.paymentSummaryLabel}>Collected</Text>
                        </View>
                      )}
                    </View>

                    {/* Filter Chips */}
                    <View style={styles.filterChips}>
                      {['all', 'due', 'late', 'paid'].map((filter) => (
                        <TouchableOpacity
                          key={filter}
                          style={[
                            styles.filterChip,
                            paymentFilter === filter && styles.filterChipActive,
                          ]}
                          onPress={() => setPaymentFilter(filter)}
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              paymentFilter === filter && styles.filterChipTextActive,
                            ]}
                          >
                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                }
                renderItem={({ item: payment }) => {
                  const amountDue = parseFloat(payment.amountDue || 0);
                  const amountPaid = parseFloat(payment.amountPaid || 0);
                  const outstanding = amountDue - amountPaid;
                  const status = getPaymentStatus(payment);
                  const isLate = isPaymentLate(payment);
                  const dueDate = getPaymentDueDate(payment.month);

                  return (
                    <View style={styles.paymentRow}>
                      <View style={styles.paymentInfo}>
                        <Text style={styles.paymentPlayerName}>{payment.playerName}</Text>
                        <View style={styles.paymentMeta}>
                          <View style={[
                            styles.paymentStatusBadge,
                            status === 'paid' && styles.paymentStatusBadgePaid,
                            status === 'partial' && styles.paymentStatusBadgePartial,
                            status === 'unpaid' && styles.paymentStatusBadgeUnpaid,
                            isLate && styles.paymentStatusBadgeLate,
                          ]}>
                            <Text style={[
                              styles.paymentStatusText,
                              status === 'paid' && styles.paymentStatusTextPaid,
                              status === 'partial' && styles.paymentStatusTextPartial,
                              status === 'unpaid' && styles.paymentStatusTextUnpaid,
                              isLate && styles.paymentStatusTextLate,
                            ]}>
                              {isLate ? 'Late' : status === 'paid' ? 'Paid' : status === 'partial' ? 'Partial' : 'Due'}
                            </Text>
                          </View>
                          {dueDate && (
                            <Text style={styles.paymentDueDate}>
                              Due: {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.paymentAmount}>
                        <Text style={[
                          styles.paymentOutstanding,
                          isLate && styles.paymentOutstandingLate,
                        ]}>
                          ${outstanding > 0 ? outstanding.toFixed(2) : '0.00'}
                        </Text>
                        <Text style={styles.paymentDetail}>
                          ${amountPaid.toFixed(2)} / ${amountDue.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} />
                    <Text style={styles.emptyText}>
                      {paymentFilter === 'all' ? 'No payments this month' : `No ${paymentFilter} payments`}
                    </Text>
                  </View>
                }
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={filteredPayments.length === 0 ? styles.emptyListContent : styles.paymentsListContent}
              />

              {/* Bulk Action Bar */}
              <View style={[styles.paymentsActionBar, { paddingBottom: insets.bottom + spacing.sm }]}>
                <TouchableOpacity
                  style={[styles.bulkActionBtn, styles.bulkActionBtnPrimary]}
                  onPress={handleRemindAllLate}
                  disabled={submitting || filteredPayments.filter(p => isPaymentLate(p)).length === 0}
                >
                  <Ionicons name="notifications-outline" size={18} color="#ffffff" />
                  <Text style={styles.bulkActionText}>Remind all late</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.bulkActionBtn, styles.bulkActionBtnSecondary]}
                  onPress={() => Alert.alert('Export CSV', 'Coming soon')}
                >
                  <Ionicons name="download-outline" size={18} color={colors.textPrimary} />
                  <Text style={[styles.bulkActionText, styles.bulkActionTextSecondary]}>Export CSV</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {activeTab === 'plan' && (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
              {group.trainingDays && group.trainingDays.length > 0 ? (
                <>
                  <View style={styles.scheduleCard}>
                    <View style={styles.scheduleHeader}>
                      <Ionicons name="calendar-outline" size={24} color={colors.primary} />
                      <Text style={styles.scheduleTitle}>Weekly Schedule</Text>
                    </View>
                    <View style={styles.scheduleDays}>
                      {group.trainingDays.sort().map((day) => {
                        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        const dayShortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                        return (
                          <View key={day} style={styles.scheduleDay}>
                            <Text style={styles.scheduleDayName}>{dayShortNames[day]}</Text>
                            <Text style={styles.scheduleDayTime}>
                              {group.trainingTime?.startTime || '18:00'} - {group.trainingTime?.endTime || '19:30'}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                  {nextSession && (
                    <View style={styles.nextSessionCard}>
                      <View style={styles.nextSessionHeader}>
                        <Ionicons name="time-outline" size={20} color={colors.primary} />
                        <Text style={styles.nextSessionTitle}>Next Session</Text>
                      </View>
                      <Text style={styles.nextSessionDate}>
                        {nextSession.dayName}, {nextSession.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                      <Text style={styles.nextSessionTime}>
                        {nextSession.time} - {nextSession.endTime}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
                  <Text style={styles.emptyText}>No schedule set</Text>
                  <Text style={styles.emptySubtext}>Set up a training schedule for this group</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>

        {/* Sticky Bottom Action Bar */}
        <View style={[styles.bottomActionBarWithShadow, { paddingBottom: insets.bottom + spacing.sm }]}>
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={() => navigation.navigate('Attendance', { groupId, groupName: group.name })}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
            <Text style={styles.primaryActionText}>Take attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryActionBtn}
            onPress={() => setShowReminders(true)}
          >
            <Ionicons name="notifications-outline" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addPlayerBtn}
            onPress={() => setShowAddPlayer(true)}
          >
            <Ionicons name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* More Menu BottomSheet */}
      <BottomSheet
        visible={showMoreMenu}
        onClose={() => setShowMoreMenu(false)}
        title="More Options"
        snapHeight={0.4}
      >
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            setShowConfig(true);
            setShowMoreMenu(false);
          }}
        >
          <Ionicons name="settings-outline" size={20} color={colors.textPrimary} />
          <Text style={styles.menuItemText}>Edit team info</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            navigation.navigate('GroupScheduleEditor', { groupId, groupName: group.name });
            setShowMoreMenu(false);
          }}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.textPrimary} />
          <Text style={styles.menuItemText}>Edit schedule</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            // Placeholder for export
            notifications.info('Export feature coming soon');
            setShowMoreMenu(false);
          }}
        >
          <Ionicons name="download-outline" size={20} color={colors.textPrimary} />
          <Text style={styles.menuItemText}>Export</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.menuItem, styles.menuItemDanger]}
          onPress={() => {
            setShowMoreMenu(false);
            handleDeleteGroup();
          }}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
          <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Delete team</Text>
        </TouchableOpacity>
      </BottomSheet>

      {/* Add Player BottomSheet */}
      <BottomSheet
        visible={showAddPlayer}
        onClose={handleCloseAddPlayer}
        title="Add player"
        snapHeight={0.75}
      >
        <View>
          <Text style={styles.inputLabel}>Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter full name"
            placeholderTextColor={colors.textMuted}
            value={playerForm.fullName}
            onChangeText={(text) => setPlayerForm({ ...playerForm, fullName: text })}
            autoCapitalize="words"
          />

          <Text style={styles.inputLabel}>Phone (optional)</Text>
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

          <Text style={styles.inputLabel}>Email (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email address"
            placeholderTextColor={colors.textMuted}
            value={playerForm.email}
            onChangeText={(text) => setPlayerForm({ ...playerForm, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.formFooter}>
            <TouchableOpacity
              style={[styles.formBtn, styles.formBtnCancel]}
              onPress={handleCloseAddPlayer}
            >
              <Text style={styles.formBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formBtn, styles.formBtnPrimary, !playerForm.fullName?.trim() && styles.formBtnDisabled]}
              onPress={handleAddPlayer}
              disabled={submitting || !playerForm.fullName?.trim()}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.formBtnText, styles.formBtnTextPrimary]}>Add</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>

      {/* Configuration BottomSheet */}
      <BottomSheet
        visible={showConfig}
        onClose={() => setShowConfig(false)}
        title="Group Settings"
        snapHeight={0.6}
      >
        <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.inputLabel}>Default Monthly Fee</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            value={configForm.defaultMonthlyFee}
            onChangeText={(text) => setConfigForm({ ...configForm, defaultMonthlyFee: text })}
            keyboardType="numeric"
          />
          <Text style={styles.inputHint}>Default fee for new players</Text>

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

        <View style={styles.formFooter}>
          <TouchableOpacity
            style={[styles.formBtn, styles.formBtnCancel]}
            onPress={() => setShowConfig(false)}
          >
            <Text style={styles.formBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.formBtn, styles.formBtnPrimary]}
            onPress={handleUpdateConfig}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.formBtnText, styles.formBtnTextPrimary]}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* Reminders BottomSheet */}
      <BottomSheet
        visible={showReminders}
        onClose={() => {
          setShowReminders(false);
          setReminderResult(null);
        }}
        title="Send Payment Reminders"
        snapHeight={0.7}
      >
        <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.inputLabel}>Billing Period *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM (e.g., 2025-01)"
            placeholderTextColor={colors.textMuted}
            value={reminderForm.month}
            onChangeText={(text) => setReminderForm({ ...reminderForm, month: text })}
          />
          <Text style={styles.inputHint}>Select the month for payment reminders</Text>

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

        <View style={styles.formFooter}>
          <TouchableOpacity
            style={[styles.formBtn, styles.formBtnCancel]}
            onPress={() => {
              setShowReminders(false);
              setReminderResult(null);
            }}
          >
            <Text style={styles.formBtnText}>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.formBtn, styles.formBtnPrimary, !reminderForm.month && styles.formBtnDisabled]}
            onPress={handleSendReminders}
            disabled={submitting || !reminderForm.month}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.formBtnText, styles.formBtnTextPrimary]}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </AppScreen>
  );
};

export default GroupDetailsScreen;

