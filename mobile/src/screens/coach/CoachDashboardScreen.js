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
        <View style={styles.statsContainer}>
          <StatCard label="Active Groups" value={loading ? undefined : groups.length} />
          <StatCard
            label="Total Players"
            value={loading ? undefined : totalPlayers}
            accent="#f97316"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create New Training Group</Text>
          <Text style={styles.cardSubtitle}>Set up a new training group with default payment settings.</Text>

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
              <Text style={styles.buttonText}>Create Group</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Training Groups</Text>
          {loading && !refreshing ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : !groups.length ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No training groups yet</Text>
              <Text style={styles.emptySubtext}>Create your first group above to get started.</Text>
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
                >
                  <Text style={styles.groupName}>{item.name}</Text>
                  <Text style={styles.groupDescription}>
                    {item.description || 'No description provided'}
                  </Text>
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupInfoText}>
                      Default Monthly Fee: <Text style={styles.groupInfoBold}>
                        ${(item.defaultMonthlyFee || 0).toFixed(2)}
                      </Text>
                    </Text>
                    <Text style={styles.groupInfoText}>
                      Players: <Text style={styles.groupInfoBold}>{item.playerCount || 0}</Text>
                    </Text>
                  </View>
                  <View style={styles.groupButton}>
                    <Text style={styles.groupButtonText}>Manage Group →</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};


export default CoachDashboardScreen;

