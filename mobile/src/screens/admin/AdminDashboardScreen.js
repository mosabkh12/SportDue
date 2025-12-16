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
  Modal,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import apiClient from '../../services/apiClient';
import StatCard from '../../components/StatCard';
import { AppScreen } from '../../ui/components';
import { styles } from '../../styles/screens/AdminDashboardScreen.styles';
import { colors } from '../../styles/theme';

const AdminDashboardScreen = () => {
  const { logout } = useAuth();
  const notifications = useNotifications();
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', password: '', phone: '', sportType: 'basketball' });
  const [creatingCoach, setCreatingCoach] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCoach, setDeletingCoach] = useState(null);

  const fetchCoaches = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/admin/coaches');
      setCoaches(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCoaches();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchCoaches();
  }, []);

  const totals = coaches.reduce(
    (acc, coach) => ({
      players: acc.players + coach.playerCount,
      groups: acc.groups + coach.groupCount,
      revenue: acc.revenue + coach.totalReceived,
      debt: acc.debt + coach.totalDebt,
    }),
    { players: 0, groups: 0, revenue: 0, debt: 0 }
  );

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateCoach = async () => {
    setCreatingCoach(true);
    setError(null);
    try {
      await apiClient.post('/admin/coaches', form);
      setForm({ username: '', email: '', password: '', phone: '', sportType: 'basketball' });
      fetchCoaches();
      notifications.success(`Coach "${form.username}" created successfully!`);
    } catch (err) {
      setError(err.message);
      notifications.error(err.message || 'Failed to create coach.');
    } finally {
      setCreatingCoach(false);
    }
  };

  const handleToggle = async (coachId, isActive) => {
    try {
      await apiClient.patch(`/admin/coaches/${coachId}/toggle-active`);
      fetchCoaches();
      notifications.success(`Coach ${isActive ? 'deactivated' : 'activated'} successfully.`);
    } catch (err) {
      setError(err.message);
      notifications.error(err.message || 'Failed to update coach status.');
    }
  };

  const handleDelete = async () => {
    if (!deletingCoach) return;
    try {
      const coachToDelete = coaches.find(c => c.id === deletingCoach);
      await apiClient.delete(`/admin/coaches/${deletingCoach}`);
      setShowDeleteModal(false);
      setDeletingCoach(null);
      fetchCoaches();
      notifications.success(`Coach "${coachToDelete?.username || 'deleted'}" deleted successfully.`);
    } catch (err) {
      setError(err.message);
      notifications.error(err.message || 'Failed to delete coach.');
      setShowDeleteModal(false);
      setDeletingCoach(null);
    }
  };

  return (
    <AppScreen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.logoutText} onPress={logout}>Logout</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
        <View style={styles.statsContainer}>
          <StatCard label="Coaches" value={coaches.length} />
          <StatCard label="Groups" value={totals.groups} accent="#10b981" />
          <StatCard label="Players" value={totals.players} accent="#f59e0b" />
          <StatCard label="Revenue" value={`$${totals.revenue.toFixed(2)}`} accent="#6366f1" />
          <StatCard label="Outstanding debt" value={`$${totals.debt.toFixed(2)}`} accent="#ef4444" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create a new coach</Text>
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="coach_username"
                placeholderTextColor={colors.textMuted}
                value={form.username}
                onChangeText={(value) => handleFormChange('username', value)}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="coach@example.com"
                placeholderTextColor={colors.textMuted}
                value={form.email}
                onChangeText={(value) => handleFormChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                value={form.password}
                onChangeText={(value) => handleFormChange('password', value)}
                secureTextEntry
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="0526867838 or +972526867838"
                placeholderTextColor={colors.textMuted}
                value={form.phone}
                onChangeText={(value) => handleFormChange('phone', value)}
                keyboardType="phone-pad"
                maxLength={20}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Sport Type</Text>
              <View style={styles.sportTypeContainer}>
                <TouchableOpacity
                  style={[styles.sportButton, form.sportType === 'basketball' && styles.sportButtonActive]}
                  onPress={() => handleFormChange('sportType', 'basketball')}
                >
                  <Text style={styles.sportButtonText}>🏀 Basketball</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sportButton, form.sportType === 'football' && styles.sportButtonActive]}
                  onPress={() => handleFormChange('sportType', 'football')}
                >
                  <Text style={styles.sportButtonText}>⚽ Football</Text>
                </TouchableOpacity>
              </View>
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.button, creatingCoach && styles.buttonDisabled]}
              onPress={handleCreateCoach}
              disabled={creatingCoach}
            >
              {creatingCoach ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Coach</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Coaches</Text>
          {loading && !refreshing ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : !coaches.length ? (
            <Text style={styles.emptyText}>No coaches yet.</Text>
          ) : (
            <FlatList
              data={coaches || []}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.coachCard}>
                  <View style={styles.coachHeader}>
                    <View>
                      <Text style={styles.coachName}>{item.username}</Text>
                      <Text style={styles.coachEmail}>{item.email}</Text>
                      {item.displayPassword && (
                        <Text style={styles.coachPassword}>Password: {item.displayPassword}</Text>
                      )}
                    </View>
                    <View style={styles.sportBadge}>
                      <Text style={styles.sportBadgeText}>
                        {item.sportType === 'basketball' ? '🏀' : '⚽'} {item.sportType || 'N/A'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.coachStats}>
                    <Text style={styles.coachStat}>Groups: {item.groupCount}</Text>
                    <Text style={styles.coachStat}>Players: {item.playerCount}</Text>
                    <Text style={styles.coachStat}>Revenue: ${item.totalReceived.toFixed(2)}</Text>
                    <Text style={styles.coachStat}>Debt: ${item.totalDebt.toFixed(2)}</Text>
                  </View>
                  <View style={styles.coachActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.toggleButton]}
                      onPress={() => handleToggle(item.id, item.isActive)}
                    >
                      <Text style={styles.actionButtonText}>
                        {item.isActive ? 'Deactivate' : 'Activate'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => {
                        setDeletingCoach(item.id);
                        setShowDeleteModal(true);
                      }}
                    >
                      <Text style={[styles.actionButtonText, { color: colors.error }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⚠️ Delete Coach</Text>
            <Text style={styles.modalBody}>
              Are you sure you want to delete this coach? This will permanently delete:
            </Text>
            <Text style={styles.modalList}>• The coach account</Text>
            <Text style={styles.modalList}>• All groups created by this coach</Text>
            <Text style={styles.modalList}>• All players in those groups</Text>
            <Text style={styles.modalList}>• All payments and attendance records</Text>
            <Text style={styles.modalWarning}>This action cannot be undone!</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={handleDelete}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Delete Coach</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </View>
    </AppScreen>
  );
};


export default AdminDashboardScreen;


