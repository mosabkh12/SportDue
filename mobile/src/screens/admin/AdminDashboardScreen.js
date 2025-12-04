import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  logoutText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: 20,
    margin: 16,
    marginTop: 0,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.bgTertiary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 2,
    borderColor: colors.border,
  },
  sportTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  sportButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.bgTertiary,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  sportButtonActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}20`,
  },
  sportButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 40,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  coachCard: {
    backgroundColor: colors.bgTertiary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  coachHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  coachName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  coachEmail: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 4,
  },
  coachPassword: {
    fontSize: 12,
    color: colors.primary,
    fontFamily: 'monospace',
  },
  sportBadge: {
    backgroundColor: colors.bgSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sportBadgeText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  coachStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  coachStat: {
    fontSize: 12,
    color: colors.textMuted,
  },
  coachActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButton: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deleteButton: {
    backgroundColor: `${colors.error}20`,
    borderWidth: 1,
    borderColor: colors.error,
  },
  actionButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  modalBody: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  modalList: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 8,
  },
  modalWarning: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.error,
    marginTop: 12,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonDelete: {
    backgroundColor: colors.error,
  },
  modalButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminDashboardScreen;


