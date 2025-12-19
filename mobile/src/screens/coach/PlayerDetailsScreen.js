import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from '../../context/NotificationContext';
import apiClient from '../../services/apiClient';
import StatCard from '../../components/StatCard';
import { AppScreen } from '../../ui/components';
import SegmentedTabs from '../../components/SegmentedTabs';
import BottomSheet from '../../ui/components/BottomSheet';
import SegmentedControl from '../../ui/components/SegmentedControl';
import AttendanceHistoryRow from '../../components/AttendanceHistoryRow';
import PaymentRow from '../../components/PaymentRow';
import EmptyState from '../../components/EmptyState';
import { colors, spacing, radius, typography, alpha } from '../../ui/tokens';
import { styles } from '../../styles/screens/PlayerDetailsScreen.styles';

const NOTES_STORAGE_KEY = 'player_notes';

const PlayerDetailsScreen = ({ route }) => {
  const { playerId, playerName: routePlayerName, groupName: routeGroupName } = route.params || {};
  const navigation = useNavigation();
  const notifications = useNotifications();
  const insets = useSafeAreaInsets();

  const [player, setPlayer] = useState(null);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // UI State
  const [activeTab, setActiveTab] = useState('info');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showEditPlayer, setShowEditPlayer] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all' | 'due' | 'late' | 'paid'
  const [localNotes, setLocalNotes] = useState('');

  // Player edit state
  const [playerEditForm, setPlayerEditForm] = useState({
    fullName: '',
    phone: '',
    monthlyFee: '',
    notes: '',
    username: '',
    password: '',
  });
  const [updatingPlayer, setUpdatingPlayer] = useState(false);

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({ 
    amount: '', 
    dueDate: '', 
    status: 'due', // 'paid' | 'due' | 'late'
    note: '' 
  });
  const [addingPayment, setAddingPayment] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Payment edit state
  const [editingPayment, setEditingPayment] = useState(null);
  const [editForm, setEditForm] = useState({ amountPaid: '', amountDue: '' });
  const [deletingPayment, setDeletingPayment] = useState(null);

  // Fetch player data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [playerRes, paymentRes, attendanceRes] = await Promise.all([
        apiClient.get(`/players/${playerId}`),
        apiClient.get(`/players/${playerId}/payments`),
        apiClient.get(`/players/${playerId}/attendance`),
      ]);

      const playerData = playerRes.data;
      if (!playerData.displayPassword && playerData.credentials?.password) {
        playerData.displayPassword = playerData.credentials.password;
      }
      setPlayer(playerData);
      setPayments(paymentRes.data || []);
      setAttendance(attendanceRes.data || []);

      // Load local notes
      try {
        const storedNotes = await AsyncStorage.getItem(`${NOTES_STORAGE_KEY}_${playerId}`);
        if (storedNotes) {
          setLocalNotes(storedNotes);
        } else if (playerData.notes) {
          setLocalNotes(playerData.notes);
        }
      } catch (err) {
        // Silent fail for local storage
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to load player data';
      setError(errorMessage);
      notifications.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [playerId, notifications]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (player && !showEditPlayer) {
      setPlayerEditForm({
        fullName: player.fullName || '',
        phone: player.phone || '',
        monthlyFee: player.monthlyFee?.toString() || '',
        notes: player.notes || '',
        username: player.username || '',
        password: player.displayPassword || '',
      });
    }
  }, [player, showEditPlayer]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Save local notes
  const saveLocalNotes = async (notes) => {
    try {
      await AsyncStorage.setItem(`${NOTES_STORAGE_KEY}_${playerId}`, notes);
      setLocalNotes(notes);
    } catch (err) {
      notifications.error('Failed to save notes');
    }
  };

  // Player edit handlers
  const handlePlayerEditChange = (field, value) => {
    setPlayerEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSavePlayerEdit = async () => {
    setUpdatingPlayer(true);
    setError(null);
    try {
      if (playerEditForm.phone && playerEditForm.phone.trim().length > 20) {
        notifications.error('Phone number must be 20 characters or less');
        setUpdatingPlayer(false);
        return;
      }

      const monthlyFee = parseFloat(playerEditForm.monthlyFee);
      if (isNaN(monthlyFee) || monthlyFee < 0) {
        notifications.error('Monthly fee must be a valid number (0 or greater)');
        setUpdatingPlayer(false);
        return;
      }

      const updateData = {
        fullName: playerEditForm.fullName.trim(),
        phone: playerEditForm.phone.trim(),
        monthlyFee: monthlyFee,
        notes: playerEditForm.notes.trim(),
      };

      if (playerEditForm.username.trim()) {
        updateData.username = playerEditForm.username.trim();
      }

      if (playerEditForm.password.trim()) {
        updateData.password = playerEditForm.password.trim();
      }

      await apiClient.put(`/players/${playerId}`, updateData);
      notifications.success('Player details updated successfully');
      setShowEditPlayer(false);
      fetchData();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update player details';
      setError(errorMessage);
      notifications.error(errorMessage);
    } finally {
      setUpdatingPlayer(false);
    }
  };

  const handleCloseEditPlayer = () => {
    if (player) {
      setPlayerEditForm({
        fullName: player.fullName || '',
        phone: player.phone || '',
        monthlyFee: player.monthlyFee?.toString() || '',
        notes: player.notes || '',
        username: player.username || '',
        password: player.displayPassword || '',
      });
    }
    setError(null);
    setShowEditPlayer(false);
  };

  // Payment handlers
  const handlePaymentChange = (field, value) => {
    setPaymentForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePaymentSubmit = async () => {
    if (!paymentForm.amount || !paymentForm.dueDate) {
      notifications.error('Please fill in amount and due date');
      return;
    }

    const amount = parseFloat(paymentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      notifications.error('Please enter a valid amount');
      return;
    }

    setAddingPayment(true);
    try {
      // Convert dueDate (YYYY-MM-DD) to month format (YYYY-MM)
      const monthFormat = paymentForm.dueDate ? paymentForm.dueDate.substring(0, 7) : '';
      
      // Map status to amountPaid and amountDue
      let amountPaid = 0;
      let amountDue = amount;
      
      if (paymentForm.status === 'paid') {
        amountPaid = amount;
        amountDue = amount;
      } else if (paymentForm.status === 'due' || paymentForm.status === 'late') {
        amountPaid = 0;
        amountDue = amount;
      }

      const paymentData = {
        month: monthFormat,
        amountPaid: amountPaid,
        amountDue: amountDue,
      };

      // Add note if provided
      if (paymentForm.note && paymentForm.note.trim()) {
        paymentData.note = paymentForm.note.trim();
      }

      await apiClient.post(`/players/${playerId}/payments`, paymentData);
      setPaymentForm({ amount: '', dueDate: '', status: 'due', note: '' });
      setShowAddPayment(false);
      notifications.success('Payment recorded successfully');
      fetchData();
    } catch (err) {
      notifications.error(err.message || 'Failed to record payment');
    } finally {
      setAddingPayment(false);
    }
  };

  const handleCloseAddPayment = () => {
    setPaymentForm({ amount: '', dueDate: '', status: 'due', note: '' });
    setShowAddPayment(false);
    setShowDatePicker(false);
  };

  const formatDateDisplay = useCallback((monthString) => {
    if (!monthString) return '';
    const parts = monthString.split('-');
    if (parts.length >= 3) {
      const [year, month, day] = parts;
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return `${parseInt(day)} ${monthNames[parseInt(month) - 1]} ${year}`;
    } else if (parts.length === 2) {
      const [year, month] = parts;
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return `1 ${monthNames[parseInt(month) - 1]} ${year}`;
    }
    return monthString;
  }, []);

  const handleEditPayment = useCallback((payment) => {
    setEditingPayment(payment._id);
    setEditForm({
      amountPaid: payment.amountPaid?.toString() || '',
      amountDue: payment.amountDue?.toString() || '',
    });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingPayment(null);
    setEditForm({ amountPaid: '', amountDue: '' });
  }, []);

  const handleSaveEdit = useCallback(async (paymentId) => {
    try {
      await apiClient.put(`/players/${playerId}/payments/${paymentId}`, {
        amountPaid: Number(editForm.amountPaid),
        amountDue: Number(editForm.amountDue),
      });
      setEditingPayment(null);
      setEditForm({ amountPaid: '', amountDue: '' });
      notifications.success('Payment updated successfully');
      fetchData();
    } catch (err) {
      notifications.error(err.message || 'Failed to update payment');
    }
  }, [playerId, editForm, notifications, fetchData]);

  const handleDeletePayment = useCallback((paymentId) => {
    Alert.alert(
      'Delete Payment',
      'Are you sure you want to delete this payment? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingPayment(paymentId);
            try {
              await apiClient.delete(`/players/${playerId}/payments/${paymentId}`);
              notifications.success('Payment deleted successfully');
              fetchData();
            } catch (err) {
              notifications.error(err.message || 'Failed to delete payment');
            } finally {
              setDeletingPayment(null);
            }
          },
        },
      ]
    );
  }, [playerId, notifications, fetchData]);

  const handleEditFormChange = useCallback((field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Helper functions for payment status
  const getPaymentStatus = useCallback((payment) => {
    const amountDue = parseFloat(payment.amountDue || 0);
    const amountPaid = parseFloat(payment.amountPaid || 0);
    if (amountPaid >= amountDue) return 'paid';
    if (amountPaid > 0) return 'partial';
    return 'unpaid';
  }, []);

  const isPaymentLate = useCallback((payment) => {
    const amountDue = parseFloat(payment.amountDue || 0);
    const amountPaid = parseFloat(payment.amountPaid || 0);
    if (amountPaid >= amountDue) return false;

    // Check if payment month is in the past
    if (!payment.month) return false;
    const [year, month] = payment.month.split('-').map(Number);
    const paymentDate = new Date(year, month - 1, 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    paymentDate.setHours(0, 0, 0, 0);
    
    // Consider late if payment month is before current month
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return paymentDate < currentMonth;
  }, []);

  // Stable key extractors
  const attendanceKeyExtractor = useCallback((item) => item._id, []);
  const paymentKeyExtractor = useCallback((item) => item._id, []);

  // Render functions
  const renderAttendanceItem = useCallback(({ item }) => {
    return <AttendanceHistoryRow record={item} />;
  }, []);

  const renderPaymentItem = useCallback(({ item }) => {
    return (
      <PaymentRow
        payment={item}
        isEditing={editingPayment === item._id}
        editForm={editForm}
        isDeleting={deletingPayment === item._id}
        onEditChange={handleEditFormChange}
        onSaveEdit={() => handleSaveEdit(item._id)}
        onCancelEdit={handleCancelEdit}
        onEdit={() => handleEditPayment(item)}
        onDelete={() => handleDeletePayment(item._id)}
        formatDateDisplay={formatDateDisplay}
        getPaymentStatus={getPaymentStatus}
        isPaymentLate={isPaymentLate}
      />
    );
  }, [editingPayment, editForm, deletingPayment, handleEditFormChange, handleSaveEdit, handleCancelEdit, handleEditPayment, handleDeletePayment, formatDateDisplay, getPaymentStatus, isPaymentLate]);

  // Calculate payment status tags
  const paymentStatusTags = useMemo(() => {
    const paid = payments.filter(p => getPaymentStatus(p) === 'paid').length;
    const late = payments.filter(p => isPaymentLate(p)).length;
    const unpaid = payments.filter(p => getPaymentStatus(p) === 'unpaid' && !isPaymentLate(p)).length;
    return { paid, late, unpaid };
  }, [payments, getPaymentStatus, isPaymentLate]);

  // Filter payments
  const filteredPayments = useMemo(() => {
    let filtered = [...payments];
    
    if (paymentFilter === 'due') {
      filtered = filtered.filter(p => {
        const status = getPaymentStatus(p);
        return status === 'unpaid' || status === 'partial';
      });
    } else if (paymentFilter === 'late') {
      filtered = filtered.filter(p => isPaymentLate(p));
    } else if (paymentFilter === 'paid') {
      filtered = filtered.filter(p => getPaymentStatus(p) === 'paid');
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => {
      if (!a.month || !b.month) return 0;
      return b.month.localeCompare(a.month);
    });
  }, [payments, paymentFilter, getPaymentStatus, isPaymentLate]);

  // Attendance stats
  const attendanceStats = useMemo(() => {
    return {
      present: attendance.filter((a) => a.isPresent).length,
      absent: attendance.filter((a) => !a.isPresent).length,
      total: attendance.length,
      rate: attendance.length > 0
        ? Math.round((attendance.filter((a) => a.isPresent).length / attendance.length) * 100)
        : 0,
    };
  }, [attendance]);

  // Determine primary payment status (prioritize Late > Unpaid > Paid)
  // Must be called before early returns to maintain hook order
  const primaryPaymentStatus = useMemo(() => {
    if (paymentStatusTags.late > 0) return { label: 'Late', style: 'late' };
    if (paymentStatusTags.unpaid > 0) return { label: 'Unpaid', style: 'unpaid' };
    if (paymentStatusTags.paid > 0) return { label: 'Paid', style: 'paid' };
    return null;
  }, [paymentStatusTags]);

  // Get player initials for avatar
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  // Get group name (from route params or player data)
  const groupName = routeGroupName || player?.group?.name || player?.groupId?.name || '';

  // Handle remove player
  const handleRemovePlayer = () => {
    Alert.alert(
      'Remove Player',
      `Are you sure you want to remove "${player?.fullName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Check if there's a delete endpoint, otherwise navigate back
              // For now, just navigate back as the API might not support player deletion
              notifications.info('Player removal feature coming soon');
              navigation.goBack();
            } catch (err) {
              notifications.error(err.message || 'Failed to remove player');
            }
          },
        },
      ]
    );
  };

  if (loading && !player) {
    return (
      <AppScreen useScrollView={false}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading player...</Text>
        </View>
      </AppScreen>
    );
  }

  if (error && !player) {
    return (
      <AppScreen useScrollView={false}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </AppScreen>
    );
  }

  // Tab configuration
  const tabs = [
    { key: 'info', label: 'Info', icon: 'information-circle-outline' },
    { key: 'attendance', label: 'Attend', icon: 'checkmark-circle-outline' },
    { key: 'payments', label: 'Pay', icon: 'card-outline' },
    { key: 'notes', label: 'Notes', icon: 'document-text-outline' },
  ];

  return (
    <AppScreen useScrollView={false}>
      <View style={styles.container}>
        {/* Custom Header Row */}
        <View style={[styles.headerRow, { paddingTop: insets.top + spacing.sm }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {player?.fullName || routePlayerName || 'Player'}
          </Text>
          <TouchableOpacity onPress={() => setShowMoreMenu(true)} style={styles.headerMoreBtn}>
            <Ionicons name="ellipsis-vertical" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Compact Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileCardRow}>
            {/* Left: Avatar */}
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>
                {getInitials(player?.fullName)}
              </Text>
            </View>

            {/* Middle: Name, Phone, Email */}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>
                {player?.fullName || routePlayerName || 'Player'}
              </Text>
              {player?.phone && (
                <View style={styles.profileContactRow}>
                  <Ionicons name="call-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.profileContactText} numberOfLines={1}>
                    {player.phone}
                  </Text>
                </View>
              )}
              {player?.email && (
                <View style={styles.profileContactRow}>
                  <Ionicons name="mail-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.profileContactText} numberOfLines={1}>
                    {player.email}
                  </Text>
                </View>
              )}
            </View>

            {/* Right: Active Status Pill */}
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>Active</Text>
            </View>
          </View>

          {/* Bottom: Payment Status & Monthly Fee Chips */}
          <View style={styles.profileChipsRow}>
            {primaryPaymentStatus && (
              <View style={[styles.profileChip, styles[`profileChip${primaryPaymentStatus.style.charAt(0).toUpperCase() + primaryPaymentStatus.style.slice(1)}`]]}>
                <Text style={[styles.profileChipText, styles[`profileChipText${primaryPaymentStatus.style.charAt(0).toUpperCase() + primaryPaymentStatus.style.slice(1)}`]]}>
                  {primaryPaymentStatus.label}
                </Text>
              </View>
            )}
            {player?.monthlyFee !== undefined && player?.monthlyFee !== null && (
              <View style={styles.profileChip}>
                <Text style={styles.profileChipText}>
                  ${parseFloat(player.monthlyFee || 0).toFixed(2)}/mo
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Tab Bar */}
        <SegmentedTabs
          value={activeTab}
          onChange={setActiveTab}
          tabs={tabs}
        />

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {/* Info Tab */}
          {activeTab === 'info' && (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
              <View style={styles.infoListContainer}>
                {/* Phone */}
                <View style={styles.infoListItem}>
                  <View style={styles.infoListItemIcon}>
                    <Ionicons name="call-outline" size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.infoListItemTitle}>Phone</Text>
                  <Text style={styles.infoListItemValue} numberOfLines={1}>
                    {player?.phone || 'Not provided'}
                  </Text>
                </View>

                {/* Monthly Fee */}
                <View style={styles.infoListItem}>
                  <View style={styles.infoListItemIcon}>
                    <Ionicons name="cash-outline" size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.infoListItemTitle}>Monthly Fee</Text>
                  <Text style={styles.infoListItemValue} numberOfLines={1}>
                    ${parseFloat(player?.monthlyFee || 0).toFixed(2)}
                  </Text>
                </View>

                {/* Join Date */}
                {player?.createdAt && (
                  <View style={styles.infoListItem}>
                    <View style={styles.infoListItemIcon}>
                      <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                    </View>
                    <Text style={styles.infoListItemTitle}>Join Date</Text>
                    <Text style={styles.infoListItemValue} numberOfLines={1}>
                      {new Date(player.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                )}

                {/* Username */}
                {player?.username && (
                  <View style={styles.infoListItem}>
                    <View style={styles.infoListItemIcon}>
                      <Ionicons name="person-outline" size={20} color={colors.primary} />
                    </View>
                    <Text style={styles.infoListItemTitle}>Username</Text>
                    <View style={styles.credentialValueContainer}>
                      <Text style={styles.credentialValue} numberOfLines={1}>
                        {player.username}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Password */}
                {player?.displayPassword && (
                  <View style={styles.infoListItem}>
                    <View style={styles.infoListItemIcon}>
                      <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
                    </View>
                    <Text style={styles.infoListItemTitle}>Password</Text>
                    <View style={styles.credentialValueContainer}>
                      <Text style={styles.credentialValue} numberOfLines={1}>
                        {player.displayPassword}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Notes Summary */}
                {player?.notes && player.notes.trim() && (
                  <View style={styles.infoListItem}>
                    <View style={styles.infoListItemIcon}>
                      <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                    </View>
                    <Text style={styles.infoListItemTitle}>Notes</Text>
                    <Text style={styles.infoListItemValue} numberOfLines={1}>
                      {player.notes.length > 40 ? `${player.notes.substring(0, 40)}...` : player.notes}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <View style={styles.tabView}>
              {attendance.length > 0 && (
                <View style={styles.attendanceStats}>
                  <StatCard label="Present" value={attendanceStats.present} accent={colors.success} />
                  <StatCard label="Absent" value={attendanceStats.absent} accent={colors.error} />
                  <StatCard label="Total" value={attendanceStats.total} accent={colors.accent} />
                  {attendance.length > 0 && (
                    <StatCard
                      label="Rate"
                      value={attendanceStats.rate}
                      accent={colors.warning}
                      format="percentage"
                    />
                  )}
                </View>
              )}
              <FlatList
                data={attendance}
                keyExtractor={attendanceKeyExtractor}
                renderItem={renderAttendanceItem}
                initialNumToRender={12}
                windowSize={7}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                updateCellsBatchingPeriod={50}
                ListEmptyComponent={
                  <EmptyState
                    icon="calendar-outline"
                    title="No attendance yet"
                    subtitle="Attendance records will appear here once sessions are recorded"
                  />
                }
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={attendance.length === 0 ? styles.emptyListContent : styles.listContent}
              />
            </View>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <View style={styles.tabView}>
              <FlatList
                data={filteredPayments}
                keyExtractor={paymentKeyExtractor}
                renderItem={renderPaymentItem}
                initialNumToRender={12}
                windowSize={7}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                updateCellsBatchingPeriod={50}
                ListHeaderComponent={
                  <View style={styles.paymentsHeader}>
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
                  </View>
                }
                ListEmptyComponent={
                  <EmptyState
                    icon="card-outline"
                    title={paymentFilter === 'all' ? 'No payments yet' : `No ${paymentFilter} payments`}
                    subtitle="Payment records will appear here once transactions are recorded"
                    actionLabel="Add payment"
                    onAction={() => setShowAddPayment(true)}
                  />
                }
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={filteredPayments.length === 0 ? styles.emptyListContent : styles.listContent}
              />
            </View>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <View style={styles.tabView}>
              <View style={styles.notesContainer}>
                <Text style={styles.notesLabel}>Coach Notes</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Add notes about this player..."
                  placeholderTextColor={colors.textMuted}
                  value={localNotes}
                  onChangeText={setLocalNotes}
                  multiline
                  numberOfLines={10}
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={styles.saveNotesButton}
                  onPress={() => saveLocalNotes(localNotes)}
                >
                  <Ionicons name="save-outline" size={18} color="#ffffff" />
                  <Text style={styles.saveNotesButtonText}>Save Notes</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Floating Bottom Action Bar */}
        <View style={[styles.bottomActionBar, { bottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={() => setShowAddPayment(true)}
          >
            <Ionicons name="add-circle-outline" size={18} color="#ffffff" />
            <Text style={styles.primaryActionText}>Add payment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryActionBtn}
            onPress={() => Alert.alert('Message', 'Coming soon')}
          >
            <Ionicons name="chatbubble-outline" size={18} color={colors.textPrimary} />
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
            setShowEditPlayer(true);
            setShowMoreMenu(false);
          }}
        >
          <Ionicons name="create-outline" size={20} color={colors.textPrimary} />
          <Text style={styles.menuItemText}>Edit player</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            setShowAddPayment(true);
            setShowMoreMenu(false);
          }}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.textPrimary} />
          <Text style={styles.menuItemText}>Add payment</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.menuItem, styles.menuItemDanger]}
          onPress={() => {
            setShowMoreMenu(false);
            handleRemovePlayer();
          }}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
          <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Remove player</Text>
        </TouchableOpacity>
      </BottomSheet>

      {/* Edit Player BottomSheet */}
      <BottomSheet
        visible={showEditPlayer}
        onClose={handleCloseEditPlayer}
        title="Edit player"
        snapHeight={0.8}
      >
        <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.inputLabel}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={playerEditForm.fullName}
            onChangeText={(value) => handlePlayerEditChange('fullName', value)}
            placeholder="Enter full name"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.inputLabel}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            value={playerEditForm.phone}
            onChangeText={(value) => handlePlayerEditChange('phone', value)}
            placeholder="e.g., 0526867838"
            placeholderTextColor={colors.textMuted}
            maxLength={20}
          />
          <Text style={styles.inputHint}>Maximum 20 characters</Text>

          <Text style={styles.inputLabel}>Username</Text>
          <TextInput
            style={styles.input}
            value={playerEditForm.username}
            onChangeText={(value) => handlePlayerEditChange('username', value)}
            placeholder="Enter username (optional)"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.inputHint}>Optional: Leave blank to auto-generate</Text>

          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            value={playerEditForm.password}
            onChangeText={(value) => handlePlayerEditChange('password', value)}
            placeholder="Enter password (optional)"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.inputHint}>Optional: Leave blank to keep current password</Text>

          <Text style={styles.inputLabel}>Monthly Fee ($) *</Text>
          <TextInput
            style={styles.input}
            value={playerEditForm.monthlyFee}
            onChangeText={(value) => handlePlayerEditChange('monthlyFee', value)}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />

          <Text style={styles.inputLabel}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={playerEditForm.notes}
            onChangeText={(value) => handlePlayerEditChange('notes', value)}
            placeholder="Optional: Additional notes about this player"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}
        </ScrollView>

        <View style={styles.formFooter}>
          <TouchableOpacity
            style={[styles.formBtn, styles.formBtnCancel]}
            onPress={handleCloseEditPlayer}
            disabled={updatingPlayer}
          >
            <Text style={styles.formBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.formBtn, styles.formBtnPrimary, updatingPlayer && styles.formBtnDisabled]}
            onPress={handleSavePlayerEdit}
            disabled={updatingPlayer || !playerEditForm.fullName.trim() || !playerEditForm.phone.trim()}
          >
            {updatingPlayer ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.formBtnText, styles.formBtnTextPrimary]}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* Add Payment BottomSheet */}
      <BottomSheet
        visible={showAddPayment}
        onClose={handleCloseAddPayment}
        title="Add payment"
        snapHeight={0.8}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.inputLabel}>Amount ($) *</Text>
            <TextInput
              style={styles.input}
              value={paymentForm.amount}
              onChangeText={(value) => handlePaymentChange('amount', value)}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
            />
            <Text style={styles.inputHint}>Enter the payment amount</Text>

            <Text style={styles.inputLabel}>Due Date *</Text>
            <TouchableOpacity
              style={styles.dateInputButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={paymentForm.dueDate ? styles.dateInputButtonText : styles.dateInputButtonTextPlaceholder}>
                {paymentForm.dueDate || 'Tap to select due date (YYYY-MM-DD)'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.inputHint}>Select the payment due date</Text>

            {/* Date Picker */}
            {showDatePicker && (
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerHeader}>
                  <Text style={styles.datePickerTitle}>Select Due Date</Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Ionicons name="close" size={24} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.datePickerInputs}>
                  <View style={styles.datePickerInputGroup}>
                    <Text style={styles.datePickerLabel}>Year</Text>
                    <TextInput
                      style={styles.datePickerInput}
                      value={paymentForm.dueDate ? paymentForm.dueDate.split('-')[0] : ''}
                      onChangeText={(year) => {
                        const parts = paymentForm.dueDate ? paymentForm.dueDate.split('-') : ['', '', ''];
                        const newDate = `${year}-${parts[1] || ''}-${parts[2] || ''}`;
                        handlePaymentChange('dueDate', newDate);
                      }}
                      placeholder="YYYY"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      maxLength={4}
                    />
                  </View>
                  <View style={styles.datePickerInputGroup}>
                    <Text style={styles.datePickerLabel}>Month</Text>
                    <TextInput
                      style={styles.datePickerInput}
                      value={paymentForm.dueDate ? paymentForm.dueDate.split('-')[1] : ''}
                      onChangeText={(month) => {
                        const parts = paymentForm.dueDate ? paymentForm.dueDate.split('-') : ['', '', ''];
                        const paddedMonth = month.padStart(2, '0').substring(0, 2);
                        const newDate = `${parts[0] || ''}-${paddedMonth}-${parts[2] || ''}`;
                        handlePaymentChange('dueDate', newDate);
                      }}
                      placeholder="MM"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  </View>
                  <View style={styles.datePickerInputGroup}>
                    <Text style={styles.datePickerLabel}>Day</Text>
                    <TextInput
                      style={styles.datePickerInput}
                      value={paymentForm.dueDate ? paymentForm.dueDate.split('-')[2] : ''}
                      onChangeText={(day) => {
                        const parts = paymentForm.dueDate ? paymentForm.dueDate.split('-') : ['', '', ''];
                        const paddedDay = day.padStart(2, '0').substring(0, 2);
                        const newDate = `${parts[0] || ''}-${parts[1] || ''}-${paddedDay}`;
                        handlePaymentChange('dueDate', newDate);
                      }}
                      placeholder="DD"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.datePickerDoneButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.datePickerDoneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.inputLabel}>Status *</Text>
            <SegmentedControl
              segments={[
                { label: 'Paid', value: 'paid' },
                { label: 'Due', value: 'due' },
                { label: 'Late', value: 'late' },
              ]}
              selectedValue={paymentForm.status}
              onValueChange={(value) => handlePaymentChange('status', value)}
              style={styles.statusSegmentedControl}
            />
            <Text style={styles.inputHint}>Select the payment status</Text>

            <Text style={styles.inputLabel}>Note</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={paymentForm.note}
              onChangeText={(value) => handlePaymentChange('note', value)}
              placeholder="Optional note about this payment"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <Text style={styles.inputHint}>Optional: Add a note about this payment</Text>
          </ScrollView>

          <View style={styles.formFooter}>
            <TouchableOpacity
              style={[styles.formBtn, styles.formBtnCancel]}
              onPress={handleCloseAddPayment}
              disabled={addingPayment}
            >
              <Text style={styles.formBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formBtn, styles.formBtnPrimary, addingPayment && styles.formBtnDisabled]}
              onPress={handlePaymentSubmit}
              disabled={addingPayment || !paymentForm.amount || !paymentForm.dueDate}
            >
              {addingPayment ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.formBtnText, styles.formBtnTextPrimary]}>Add</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </BottomSheet>
    </AppScreen>
  );
};

export default PlayerDetailsScreen;
