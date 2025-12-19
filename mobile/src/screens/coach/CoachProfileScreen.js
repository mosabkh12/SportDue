import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import apiClient from '../../services/apiClient';
import { AppScreen, AppCard, AppButton, ListItem, BottomSheet } from '../../ui/components';
import { styles } from '../../styles/screens/CoachProfileScreen.styles';
import { colors, spacing } from '../../ui/tokens';

const CoachProfileScreen = () => {
  const { updateUser } = useAuth();
  const notifications = useNotifications();
  const [profile, setProfile] = useState({ username: '', email: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Notification toggles (placeholders)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/coach/me');
      setProfile({
        username: data.username || '',
        email: data.email || '',
        phone: data.phone || '',
      });
    } catch (err) {
      setError(err.message);
      notifications.error(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const saveProfile = async () => {
    setError(null);
    setSaving(true);
    try {
      const { data } = await apiClient.put('/coach/me', {
        username: profile.username,
        phone: profile.phone,
      });
      updateUser(data);
      notifications.success('Profile updated successfully!');
      setShowEditProfile(false);
      fetchProfile();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update profile';
      setError(errorMessage);
      notifications.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    setError(null);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New password confirmation does not match.');
      notifications.error('Password confirmation does not match.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      notifications.error('Password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    try {
      await apiClient.put('/coach/me', {
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      notifications.success('Password updated successfully!');
      setShowChangePassword(false);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update password';
      setError(errorMessage);
      notifications.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleAbout = () => {
    Alert.alert(
      'About SportDue',
      'SportDue - Sports Team Management App\n\nVersion 1.0.0\n\nManage your teams, players, attendance, and payments all in one place.',
      [{ text: 'OK' }]
    );
  };

  const handleContact = () => {
    Alert.alert(
      'Contact Support',
      'Need help? Contact us:\n\nEmail: support@sportdue.com\nPhone: +1 (555) 123-4567',
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      {/* Profile Header Card */}
      <AppCard style={styles.profileHeaderCard}>
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}>
            <Ionicons name="person" size={40} color={colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile.username || 'Coach'}</Text>
            <Text style={styles.profileEmail}>{profile.email}</Text>
          </View>
        </View>
      </AppCard>

      {/* Account Section */}
      <AppCard style={styles.sectionCard} title="Account" noPadding>
        <ListItem
          title="Edit Profile"
          subtitle="Update your username and phone number"
          leftIcon={<Ionicons name="person-outline" size={20} color={colors.primary} />}
          onPress={() => setShowEditProfile(true)}
        />
        <ListItem
          title="Change Password"
          subtitle="Update your account password"
          leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.primary} />}
          onPress={() => setShowChangePassword(true)}
          style={styles.listItemNoBorder}
        />
      </AppCard>

      {/* Notifications Section */}
      <AppCard style={styles.sectionCard} title="Notifications" noPadding>
        <View style={styles.toggleItem}>
          <View style={styles.toggleLeft}>
            <Ionicons name="notifications-outline" size={20} color={colors.primary} style={styles.toggleIcon} />
            <View style={styles.toggleContent}>
              <Text style={styles.toggleTitle}>Push Notifications</Text>
              <Text style={styles.toggleSubtitle}>Receive push notifications</Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: colors.border, true: colors.primary + '80' }}
            thumbColor={notificationsEnabled ? colors.primary : colors.textMuted}
          />
        </View>
        <View style={styles.toggleItem}>
          <View style={styles.toggleLeft}>
            <Ionicons name="mail-outline" size={20} color={colors.primary} style={styles.toggleIcon} />
            <View style={styles.toggleContent}>
              <Text style={styles.toggleTitle}>Email Notifications</Text>
              <Text style={styles.toggleSubtitle}>Receive email updates</Text>
            </View>
          </View>
          <Switch
            value={emailNotifications}
            onValueChange={setEmailNotifications}
            trackColor={{ false: colors.border, true: colors.primary + '80' }}
            thumbColor={emailNotifications ? colors.primary : colors.textMuted}
          />
        </View>
        <View style={[styles.toggleItem, styles.toggleItemLast]}>
          <View style={styles.toggleLeft}>
            <Ionicons name="chatbubble-outline" size={20} color={colors.primary} style={styles.toggleIcon} />
            <View style={styles.toggleContent}>
              <Text style={styles.toggleTitle}>SMS Notifications</Text>
              <Text style={styles.toggleSubtitle}>Receive SMS reminders</Text>
            </View>
          </View>
          <Switch
            value={smsNotifications}
            onValueChange={setSmsNotifications}
            trackColor={{ false: colors.border, true: colors.primary + '80' }}
            thumbColor={smsNotifications ? colors.primary : colors.textMuted}
          />
        </View>
      </AppCard>

      {/* Support Section */}
      <AppCard style={styles.sectionCard} title="Support" noPadding>
        <ListItem
          title="About"
          subtitle="App version and information"
          leftIcon={<Ionicons name="information-circle-outline" size={20} color={colors.primary} />}
          onPress={handleAbout}
        />
        <ListItem
          title="Contact"
          subtitle="Get help and support"
          leftIcon={<Ionicons name="help-circle-outline" size={20} color={colors.primary} />}
          onPress={handleContact}
          style={styles.listItemNoBorder}
        />
      </AppCard>

      {/* Edit Profile BottomSheet */}
      <BottomSheet
        visible={showEditProfile}
        onClose={() => {
          setShowEditProfile(false);
          setError(null);
        }}
        snapHeight={0.7}
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Edit Profile</Text>
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.input}
              value={profile.username}
              onChangeText={(value) => setProfile({ ...profile, username: value })}
              placeholder="Enter username"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={profile.email}
              editable={false}
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.inputHint}>Email cannot be changed</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput
              style={styles.input}
              value={profile.phone}
              onChangeText={(value) => setProfile({ ...profile, phone: value })}
              placeholder="Enter phone number"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              maxLength={20}
            />
          </View>

          <View style={styles.sheetFooter}>
            <AppButton
              variant="secondary"
              title="Cancel"
              onPress={() => {
                setShowEditProfile(false);
                setError(null);
                fetchProfile(); // Reset to original values
              }}
              style={[styles.sheetButton, { marginRight: spacing.sm }]}
            />
            <AppButton
              variant="primary"
              title="Save Changes"
              onPress={saveProfile}
              loading={saving}
              style={[styles.sheetButton, { flex: 1 }]}
            />
          </View>
        </View>
      </BottomSheet>

      {/* Change Password BottomSheet */}
      <BottomSheet
        visible={showChangePassword}
        onClose={() => {
          setShowChangePassword(false);
          setPasswordForm({ newPassword: '', confirmPassword: '' });
          setError(null);
        }}
        snapHeight={0.65}
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Change Password</Text>
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={styles.input}
              value={passwordForm.newPassword}
              onChangeText={(value) => setPasswordForm({ ...passwordForm, newPassword: value })}
              placeholder="Enter new password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />
            <Text style={styles.inputHint}>Must be at least 6 characters</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              value={passwordForm.confirmPassword}
              onChangeText={(value) => setPasswordForm({ ...passwordForm, confirmPassword: value })}
              placeholder="Confirm new password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />
          </View>

          <View style={styles.sheetFooter}>
            <AppButton
              variant="secondary"
              title="Cancel"
              onPress={() => {
                setShowChangePassword(false);
                setPasswordForm({ newPassword: '', confirmPassword: '' });
                setError(null);
              }}
              style={[styles.sheetButton, { marginRight: spacing.sm }]}
            />
            <AppButton
              variant="primary"
              title="Update Password"
              onPress={changePassword}
              loading={saving}
              style={[styles.sheetButton, { flex: 1 }]}
            />
          </View>
        </View>
      </BottomSheet>
    </AppScreen>
  );
};


export default CoachProfileScreen;
