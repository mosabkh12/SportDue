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

  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/groups');
      setGroups(data);
    } catch (err) {
      setError(err.message);
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

