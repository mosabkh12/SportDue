import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import apiClient from '../../services/apiClient';
import { AppScreen, AppCard, AppButton, AppFAB } from '../../ui/components';
import { styles } from '../../styles/screens/CoachHomeScreen.styles';
import { getNextSession as getNextSessionHelper, formatGroupSchedule } from '../../utils/schedule';
import { colors } from '../../ui/tokens';

// Helper: Get time of day greeting
const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
};

// Helper: Format date
const formatDate = (date) => {
  const options = { weekday: 'long', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

// Helper: Calculate next session from all groups
const getNextSession = (groups) => {
  if (!groups || groups.length === 0) return null;

  const now = new Date();
  let earliestSession = null;
  let earliestDate = null;

  // Find the earliest next session across all groups
  for (const group of groups) {
    const session = getNextSessionHelper(group, now);
    if (session) {
      if (!earliestDate || session.date < earliestDate) {
        earliestDate = session.date;
        earliestSession = {
          ...session,
          groupId: group._id,
          groupName: group.name,
        };
      }
    }
  }

  return earliestSession;
};

// QuickActionTile Component
const QuickActionTile = ({ icon, title, onPress, color }) => {
  const tileColor = color || colors.primary;
  return (
    <TouchableOpacity
      style={[styles.quickActionTile, { borderColor: tileColor + '40' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: tileColor + '20' }]}>
        {icon}
      </View>
      <Text style={styles.quickActionTitle}>{title}</Text>
    </TouchableOpacity>
  );
};

// TeamCard Component
const TeamCard = ({ team, onAttendance, onPlayers }) => {
  const scheduleText = formatGroupSchedule(team);

  return (
    <View style={styles.teamCard}>
      <View style={styles.teamCardHeader}>
        <View style={styles.teamCardLeft}>
          <View style={styles.teamIcon}>
            <Ionicons name="people" size={20} color={colors.primary} />
          </View>
          <View style={styles.teamInfo}>
            <Text style={styles.teamName}>{team.name}</Text>
            <Text style={styles.teamSchedule}>{scheduleText}</Text>
          </View>
        </View>
      </View>
      <View style={styles.teamCardActions}>
        <AppButton
          variant="secondary"
          title="Attendance"
          onPress={() => onAttendance(team)}
          style={styles.teamActionButton}
          leftIcon={<Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
        />
        <AppButton
          variant="secondary"
          title="Players"
          onPress={() => onPlayers(team)}
          style={styles.teamActionButton}
          leftIcon={<Ionicons name="person" size={18} color={colors.primary} />}
        />
      </View>
    </View>
  );
};

// SectionHeader Component
const SectionHeader = ({ title, subtitle, rightAction }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionHeaderLeft}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
    {rightAction && <View style={styles.sectionHeaderRight}>{rightAction}</View>}
  </View>
);

const CoachHomeScreen = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const notifications = useNotifications();
  const [groups, setGroups] = useState([]);
  const [coachProfile, setCoachProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/groups');
      setGroups(data);
    } catch (err) {
      notifications.error(err.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchCoachProfile = async () => {
    try {
      const { data } = await apiClient.get('/coach/me');
      setCoachProfile(data);
    } catch (err) {
      // Silent fail
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchGroups(), fetchCoachProfile()]);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchGroups();
    fetchCoachProfile();
  }, []);

  const handleCreateTeam = () => {
    navigation.navigate('Teams');
    // Could also open create modal directly if needed
  };

  const handlePaymentReminders = () => {
    navigation.navigate('Teams');
    notifications.info('Select a team to send payment reminders');
  };

  const handleMarkAttendance = () => {
    if (groups.length === 0) {
      notifications.error('No teams available');
      return;
    }
    if (groups.length === 1) {
      navigation.navigate('Attendance', { groupId: groups[0]._id });
    } else {
      navigation.navigate('Teams');
    }
  };

  const nextSession = getNextSession(groups);
  const topTeams = groups.slice(0, 4);
  const coachName = coachProfile?.username || user?.username || 'Coach';
  const timeOfDay = getTimeOfDay();
  const today = new Date();

  return (
    <AppScreen
      scrollViewProps={{
        refreshControl: <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />,
      }}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Good {timeOfDay}, {coachName}</Text>
          <Text style={styles.date}>{formatDate(today)}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.7}
          >
            <Ionicons name="person-circle" size={40} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: logout,
                  },
                ]
              );
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Next Session Card */}
      <AppCard style={styles.nextSessionCard}>
        <SectionHeader
          title="Next Session"
          subtitle={nextSession ? `${nextSession.dayName}, ${nextSession.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'No upcoming sessions'}
        />
        {nextSession ? (
          <View style={styles.nextSessionContent}>
            <View style={styles.nextSessionInfo}>
              <Text style={styles.nextSessionTeam}>{nextSession.groupName}</Text>
              <View style={styles.nextSessionDetails}>
                <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                <Text style={styles.nextSessionTime}>
                  {nextSession.time} - {nextSession.endTime}
                </Text>
                {nextSession.location && (
                  <>
                    <Ionicons name="location-outline" size={16} color={colors.textMuted} style={styles.nextSessionIcon} />
                    <Text style={styles.nextSessionLocation}>{nextSession.location}</Text>
                  </>
                )}
              </View>
            </View>
            <View style={styles.nextSessionActions}>
              <AppButton
                variant="primary"
                title="Take Attendance"
                onPress={() => {
                  if (nextSession.groupId) {
                    navigation.navigate('Attendance', { groupId: nextSession.groupId });
                  } else {
                    navigation.navigate('Teams');
                  }
                }}
                style={styles.nextSessionButton}
              />
              <AppButton
                variant="secondary"
                title="Send Announcement"
                onPress={() => Alert.alert('Coming Soon', 'Announcement feature coming soon!')}
                style={styles.nextSessionButton}
              />
            </View>
          </View>
        ) : (
          <View style={styles.noSessionContent}>
            <Text style={styles.noSessionText}>No session scheduled</Text>
            <AppButton
              variant="primary"
              title="Set Schedule"
              onPress={() => navigation.navigate('Calendar')}
              style={styles.noSessionButton}
            />
          </View>
        )}
      </AppCard>

      {/* Quick Actions */}
      <View style={styles.sectionHeaderSpacing}>
        <SectionHeader title="Quick Actions" />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickActionsContainer}
      >
        <QuickActionTile
          icon={<Ionicons name="add-circle" size={28} color={colors.primary} />}
          title="Create Team"
          onPress={handleCreateTeam}
          color={colors.primary}
        />
        <QuickActionTile
          icon={<Ionicons name="notifications" size={28} color={colors.warning} />}
          title="Payment Reminders"
          onPress={handlePaymentReminders}
          color={colors.warning}
        />
        <QuickActionTile
          icon={<Ionicons name="checkmark-circle" size={28} color={colors.success} />}
          title="Mark Attendance"
          onPress={handleMarkAttendance}
          color={colors.success}
        />
      </ScrollView>

      {/* Your Teams */}
      <View style={styles.sectionHeaderSpacing}>
        <SectionHeader
          title="Your Teams"
          subtitle={groups.length > 0 ? `${groups.length} team${groups.length > 1 ? 's' : ''}` : 'No teams yet'}
          rightAction={
            groups.length > 4 ? (
              <TouchableOpacity onPress={() => navigation.navigate('Teams')}>
                <Text style={styles.viewAllText}>View all</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : topTeams.length === 0 ? (
        <AppCard>
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No teams yet</Text>
            <Text style={styles.emptySubtext}>Create your first team to get started</Text>
          </View>
        </AppCard>
      ) : (
        <View style={styles.teamsList}>
          {topTeams.map((team) => (
            <TeamCard
              key={team._id}
              team={team}
              onAttendance={(team) => navigation.navigate('Attendance', { groupId: team._id })}
              onPlayers={(team) => navigation.navigate('GroupDetails', { groupId: team._id, groupName: team.name })}
            />
          ))}
        </View>
      )}

      {/* FAB */}
      <AppFAB
        icon={<Ionicons name="add" size={28} color="#ffffff" />}
        onPress={handleCreateTeam}
        position="bottom-right"
      />
    </AppScreen>
  );
};


export default CoachHomeScreen;
