import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from '../../context/NotificationContext';
import apiClient from '../../services/apiClient';
import StatCard from '../../components/StatCard';
import { colors } from '../../styles/theme';
import { styles } from '../../styles/screens/PlayerDetailsScreen.styles';

const PlayerDetailsScreen = ({ route }) => {
  const { playerId } = route.params;
  const navigation = useNavigation();
  const notifications = useNotifications();

  const [player, setPlayer] = useState(null);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Player edit state
  const [editingPlayer, setEditingPlayer] = useState(false);
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
  const [paymentForm, setPaymentForm] = useState({ month: '', amountPaid: '', amountDue: '' });
  const [addingPayment, setAddingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const slideAnim = useRef(new Animated.Value(1000)).current;

  // Payment edit state
  const [editingPayment, setEditingPayment] = useState(null);
  const [editForm, setEditForm] = useState({ amountPaid: '', amountDue: '' });
  const [deletingPayment, setDeletingPayment] = useState(null);

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
    if (player && !editingPlayer) {
      setPlayerEditForm({
        fullName: player.fullName || '',
        phone: player.phone || '',
        monthlyFee: player.monthlyFee?.toString() || '',
        notes: player.notes || '',
        username: player.username || '',
        password: player.displayPassword || '',
      });
    }
  }, [player, editingPlayer]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleStartEdit = () => {
    setEditingPlayer(true);
    setError(null);
  };

  const handleCancelPlayerEdit = () => {
    setEditingPlayer(false);
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
  };

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
      setEditingPlayer(false);
      fetchData();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update player details';
      setError(errorMessage);
      notifications.error(errorMessage);
    } finally {
      setUpdatingPlayer(false);
    }
  };

  const handlePaymentChange = (field, value) => {
    setPaymentForm((prev) => ({ ...prev, [field]: value }));
  };

  // Animate modal slide up
  useEffect(() => {
    if (showPaymentModal) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      slideAnim.setValue(1000);
    }
  }, [showPaymentModal, slideAnim]);

  const handlePaymentSubmit = async () => {
    if (!paymentForm.month || !paymentForm.amountPaid) {
      notifications.error('Please fill in all required fields');
      return;
    }

    setAddingPayment(true);
    try {
      const monthFormat = paymentForm.month ? paymentForm.month.substring(0, 7) : paymentForm.month;
      await apiClient.post(`/players/${playerId}/payments`, {
        month: monthFormat,
        amountPaid: Number(paymentForm.amountPaid),
        amountDue: paymentForm.amountDue ? Number(paymentForm.amountDue) : undefined,
      });
      setPaymentForm({ month: '', amountPaid: '', amountDue: '' });
      setShowPaymentModal(false);
      notifications.success('Payment recorded successfully');
      fetchData();
    } catch (err) {
      notifications.error(err.message || 'Failed to record payment');
    } finally {
      setAddingPayment(false);
    }
  };

  const formatDateDisplay = (monthString) => {
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
  };

  const handleEditPayment = (payment) => {
    setEditingPayment(payment._id);
    setEditForm({
      amountPaid: payment.amountPaid?.toString() || '',
      amountDue: payment.amountDue?.toString() || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingPayment(null);
    setEditForm({ amountPaid: '', amountDue: '' });
  };

  const handleSaveEdit = async (paymentId) => {
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
  };

  const handleDeletePayment = (paymentId) => {
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
  };

  const attendanceStats = {
    present: attendance.filter((a) => a.isPresent).length,
    absent: attendance.filter((a) => !a.isPresent).length,
    total: attendance.length,
    rate: attendance.length > 0
      ? Math.round((attendance.filter((a) => a.isPresent).length / attendance.length) * 100)
      : 0,
  };

  if (loading && !player) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading player...</Text>
      </View>
    );
  }

  if (error && !player) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{player?.fullName || 'Player'}</Text>
        <Text style={styles.subtitle}>Payment history, attendance records, and player details</Text>

        {/* Player Information */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Player Information</Text>
            {!editingPlayer && (
              <TouchableOpacity style={styles.editButton} onPress={handleStartEdit}>
                <Text style={styles.editButtonText}>✏️ Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {editingPlayer ? (
            <View style={styles.editForm}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={playerEditForm.fullName}
                  onChangeText={(value) => handlePlayerEditChange('fullName', value)}
                  placeholder="Enter full name"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                  style={styles.input}
                  value={playerEditForm.phone}
                  onChangeText={(value) => handlePlayerEditChange('phone', value)}
                  placeholder="e.g., 0526867838"
                  placeholderTextColor={colors.textMuted}
                  maxLength={20}
                />
                <Text style={styles.helpText}>Maximum 20 characters</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  value={playerEditForm.username}
                  onChangeText={(value) => handlePlayerEditChange('username', value)}
                  placeholder="Enter username (optional)"
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={styles.helpText}>Optional: Leave blank to auto-generate</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={playerEditForm.password}
                  onChangeText={(value) => handlePlayerEditChange('password', value)}
                  placeholder="Enter password (optional)"
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={styles.helpText}>Optional: Leave blank to keep current password</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Monthly Fee ($) *</Text>
                <TextInput
                  style={styles.input}
                  value={playerEditForm.monthlyFee}
                  onChangeText={(value) => handlePlayerEditChange('monthlyFee', value)}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={playerEditForm.notes}
                  onChangeText={(value) => handlePlayerEditChange('notes', value)}
                  placeholder="Optional: Additional notes about this player"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                />
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonOutline]}
                  onPress={handleCancelPlayerEdit}
                  disabled={updatingPlayer}
                >
                  <Text style={styles.buttonOutlineText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary, updatingPlayer && styles.buttonDisabled]}
                  onPress={handleSavePlayerEdit}
                  disabled={updatingPlayer || !playerEditForm.fullName.trim() || !playerEditForm.phone.trim()}
                >
                  {updatingPlayer ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonPrimaryText}>💾 Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Full Name:</Text>
                <Text style={styles.detailValue}>{player?.fullName || '—'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Phone:</Text>
                <Text style={styles.detailValueMonospace}>{player?.phone || '—'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Username:</Text>
                {player?.username ? (
                  <View style={styles.credentialBadge}>
                    <Text style={styles.credentialText}>{player.username}</Text>
                  </View>
                ) : (
                  <Text style={styles.detailValueMuted}>No username set</Text>
                )}
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Password:</Text>
                {player?.displayPassword ? (
                  <View style={[styles.credentialBadge, styles.credentialBadgePassword]}>
                    <Text style={styles.credentialText}>{player.displayPassword}</Text>
                  </View>
                ) : (
                  <Text style={styles.detailValueMuted}>No password set</Text>
                )}
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Monthly Fee:</Text>
                <Text style={styles.detailValueLarge}>
                  ${parseFloat(player?.monthlyFee || 0).toFixed(2)}
                </Text>
              </View>
              {player?.notes && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Notes:</Text>
                  <Text style={styles.detailValueNotes}>{player.notes}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Record Payment Button */}
        <TouchableOpacity
          style={styles.recordPaymentButton}
          onPress={() => setShowPaymentModal(true)}
        >
          <Text style={styles.recordPaymentButtonText}>💰 Record Payment</Text>
        </TouchableOpacity>

        {/* Payment History */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Payment History</Text>
            {payments.length > 0 && (
              <Text style={styles.cardSubtitle}>
                {payments.length} {payments.length === 1 ? 'payment' : 'payments'}
              </Text>
            )}
          </View>

          {payments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No payment records found</Text>
              <Text style={styles.emptyStateSubtext}>
                Payment records will appear here once transactions are recorded.
              </Text>
            </View>
          ) : (
            <FlatList
              data={payments}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
              renderItem={({ item: payment }) => (
                <View style={styles.paymentItem}>
                  {editingPayment === payment._id ? (
                    <View style={styles.paymentEditForm}>
                      <Text style={styles.paymentDate}>{formatDateDisplay(payment.month)}</Text>
                      <View style={styles.paymentEditInputs}>
                        <View style={styles.paymentEditInputGroup}>
                          <Text style={styles.paymentEditLabel}>Amount Due:</Text>
                          <TextInput
                            style={styles.paymentEditInput}
                            value={editForm.amountDue}
                            onChangeText={(value) => setEditForm((prev) => ({ ...prev, amountDue: value }))}
                            keyboardType="numeric"
                            placeholder="0.00"
                            placeholderTextColor={colors.textMuted}
                          />
                        </View>
                        <View style={styles.paymentEditInputGroup}>
                          <Text style={styles.paymentEditLabel}>Amount Paid:</Text>
                          <TextInput
                            style={styles.paymentEditInput}
                            value={editForm.amountPaid}
                            onChangeText={(value) => setEditForm((prev) => ({ ...prev, amountPaid: value }))}
                            keyboardType="numeric"
                            placeholder="0.00"
                            placeholderTextColor={colors.textMuted}
                          />
                        </View>
                      </View>
                      <View style={styles.paymentEditActions}>
                        <TouchableOpacity
                          style={[styles.paymentActionButton, styles.paymentActionButtonSave]}
                          onPress={() => handleSaveEdit(payment._id)}
                        >
                          <Text style={styles.paymentActionButtonText}>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.paymentActionButton, styles.paymentActionButtonCancel]}
                          onPress={handleCancelEdit}
                        >
                          <Text style={styles.paymentActionButtonText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <>
                      <View style={styles.paymentHeader}>
                        <Text style={styles.paymentDate}>{formatDateDisplay(payment.month)}</Text>
                        <View
                          style={[
                            styles.paymentStatusBadge,
                            payment.status === 'paid' && styles.paymentStatusBadgePaid,
                            payment.status === 'partial' && styles.paymentStatusBadgePartial,
                            payment.status === 'unpaid' && styles.paymentStatusBadgeUnpaid,
                          ]}
                        >
                          <Text style={styles.paymentStatusText}>
                            {payment.status === 'paid' ? 'Paid' : payment.status === 'partial' ? 'Partial' : 'Unpaid'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.paymentAmounts}>
                        <View style={styles.paymentAmountItem}>
                          <Text style={styles.paymentAmountLabel}>Amount Due:</Text>
                          <Text style={styles.paymentAmountValue}>
                            ${parseFloat(payment.amountDue || 0).toFixed(2)}
                          </Text>
                        </View>
                        <View style={styles.paymentAmountItem}>
                          <Text style={styles.paymentAmountLabel}>Amount Paid:</Text>
                          <Text style={styles.paymentAmountValue}>
                            ${parseFloat(payment.amountPaid || 0).toFixed(2)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.paymentActions}>
                        <TouchableOpacity
                          style={[styles.paymentActionButton, styles.paymentActionButtonEdit]}
                          onPress={() => handleEditPayment(payment)}
                        >
                          <Text style={styles.paymentActionButtonText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.paymentActionButton, styles.paymentActionButtonDelete]}
                          onPress={() => handleDeletePayment(payment._id)}
                          disabled={deletingPayment === payment._id}
                        >
                          <Text style={styles.paymentActionButtonText}>
                            {deletingPayment === payment._id ? 'Deleting...' : 'Delete'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              )}
            />
          )}
        </View>

        {/* Attendance History */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Attendance History</Text>

          {attendance.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No attendance records yet.</Text>
            </View>
          ) : (
            <>
              <View style={styles.statsContainer}>
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

              <FlatList
                data={attendance}
                keyExtractor={(item) => item._id}
                scrollEnabled={false}
                renderItem={({ item: record }) => {
                  const date = new Date(record.date);
                  const formattedDate = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  });
                  const isPresent = record.isPresent;
                  return (
                    <View
                      style={[
                        styles.attendanceItem,
                        isPresent && styles.attendanceItemPresent,
                        !isPresent && styles.attendanceItemAbsent,
                      ]}
                    >
                      <Text style={styles.attendanceDate}>{formattedDate}</Text>
                      <View
                        style={[
                          styles.attendanceStatusBadge,
                          isPresent && styles.attendanceStatusBadgePresent,
                          !isPresent && styles.attendanceStatusBadgeAbsent,
                        ]}
                      >
                        <Text style={styles.attendanceStatusText}>
                          {isPresent ? '✓ Present' : '✗ Absent'}
                        </Text>
                      </View>
                      <Text style={styles.attendanceSignature}>
                        {record.signature || '—'}
                      </Text>
                    </View>
                  );
                }}
              />
            </>
          )}
        </View>
      </ScrollView>

      {/* Payment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPaymentModal}
        onRequestClose={() => setShowPaymentModal(false)}
        statusBarTranslucent={true}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => {
              Animated.timing(slideAnim, {
                toValue: 1000,
                duration: 250,
                useNativeDriver: true,
              }).start(() => setShowPaymentModal(false));
            }}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <Animated.View
                style={[
                  styles.modalContent,
                  {
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <View style={styles.modalHeader}>
                  <View style={styles.modalHandle} />
                  <Text style={styles.modalTitle}>Record Payment</Text>
                  <TouchableOpacity
                    onPress={() => {
                      Animated.timing(slideAnim, {
                        toValue: 1000,
                        duration: 250,
                        useNativeDriver: true,
                      }).start(() => setShowPaymentModal(false));
                    }}
                  >
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  style={styles.modalScroll}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.modalSubtitle}>
                    Record a new payment transaction for this player
                  </Text>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Billing Period *</Text>
                    <TouchableOpacity
                      style={styles.dateInputButton}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text style={paymentForm.month ? styles.dateInputButtonText : styles.dateInputButtonTextPlaceholder}>
                        {paymentForm.month || 'Tap to select date (YYYY-MM-DD)'}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.helpText}>Select the billing date</Text>
                  </View>
                  
                  {/* Date Picker Modal */}
                  <Modal
                    animationType="slide"
                    transparent={true}
                    visible={showDatePicker}
                    onRequestClose={() => setShowDatePicker(false)}
                  >
                    <View style={styles.datePickerOverlay}>
                      <View style={styles.datePickerContent}>
                        <View style={styles.datePickerHeader}>
                          <Text style={styles.datePickerTitle}>Select Billing Date</Text>
                          <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                            <Text style={styles.datePickerClose}>✕</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={styles.datePickerInputs}>
                          <View style={styles.datePickerInputGroup}>
                            <Text style={styles.datePickerLabel}>Year</Text>
                            <TextInput
                              style={styles.datePickerInput}
                              value={paymentForm.month ? paymentForm.month.split('-')[0] : ''}
                              onChangeText={(year) => {
                                const parts = paymentForm.month ? paymentForm.month.split('-') : ['', '', ''];
                                const newDate = `${year}-${parts[1] || ''}-${parts[2] || ''}`;
                                handlePaymentChange('month', newDate);
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
                              value={paymentForm.month ? paymentForm.month.split('-')[1] : ''}
                              onChangeText={(month) => {
                                const parts = paymentForm.month ? paymentForm.month.split('-') : ['', '', ''];
                                const paddedMonth = month.padStart(2, '0').substring(0, 2);
                                const newDate = `${parts[0] || ''}-${paddedMonth}-${parts[2] || ''}`;
                                handlePaymentChange('month', newDate);
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
                              value={paymentForm.month ? paymentForm.month.split('-')[2] : ''}
                              onChangeText={(day) => {
                                const parts = paymentForm.month ? paymentForm.month.split('-') : ['', '', ''];
                                const paddedDay = day.padStart(2, '0').substring(0, 2);
                                const newDate = `${parts[0] || ''}-${parts[1] || ''}-${paddedDay}`;
                                handlePaymentChange('month', newDate);
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
                    </View>
                  </Modal>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Amount Paid ($) *</Text>
                    <TextInput
                      style={styles.input}
                      value={paymentForm.amountPaid}
                      onChangeText={(value) => handlePaymentChange('amountPaid', value)}
                      placeholder="0.00"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                    />
                    <Text style={styles.helpText}>Enter amount received</Text>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Amount Due ($)</Text>
                    <TextInput
                      style={styles.input}
                      value={paymentForm.amountDue}
                      onChangeText={(value) => handlePaymentChange('amountDue', value)}
                      placeholder="Optional"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                    />
                    <Text style={styles.helpText}>Total amount due (optional)</Text>
                  </View>
                </ScrollView>
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnCancel]}
                    onPress={() => {
                      Animated.timing(slideAnim, {
                        toValue: 1000,
                        duration: 250,
                        useNativeDriver: true,
                      }).start(() => setShowPaymentModal(false));
                    }}
                  >
                    <Text style={styles.modalBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnPrimary, addingPayment && styles.modalBtnDisabled]}
                    onPress={handlePaymentSubmit}
                    disabled={addingPayment || !paymentForm.month || !paymentForm.amountPaid}
                  >
                    {addingPayment ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={[styles.modalBtnText, styles.modalBtnTextPrimary]}>Save Payment</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default PlayerDetailsScreen;
