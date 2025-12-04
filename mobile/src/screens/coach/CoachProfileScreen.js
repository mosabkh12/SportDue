import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import apiClient from '../../services/apiClient';
import { styles } from '../../styles/screens/CoachProfileScreen.styles';
import { colors } from '../../styles/theme';

const CoachProfileScreen = () => {
  const { updateUser } = useAuth();
  const notifications = useNotifications();
  const [profile, setProfile] = useState({ username: '', email: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const saveProfile = async () => {
    setError(null);
    try {
      const { data } = await apiClient.put('/coach/me', {
        username: profile.username,
        phone: profile.phone,
      });
      updateUser(data);
      notifications.success('Profile updated successfully!');
    } catch (err) {
      setError(err.message);
      notifications.error(err.message || 'Failed to update profile.');
    }
  };

  const changePassword = async () => {
    setError(null);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New password confirmation does not match.');
      notifications.error('Password confirmation does not match.');
      return;
    }
    try {
      await apiClient.put('/coach/me', {
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      notifications.success('Password updated successfully!');
    } catch (err) {
      setError(err.message);
      notifications.error(err.message || 'Failed to update password.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile & Security</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profile</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={profile.username}
            onChangeText={(value) => setProfile({ ...profile, username: value })}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={profile.email}
            editable={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={profile.phone}
            onChangeText={(value) => setProfile({ ...profile, phone: value })}
            keyboardType="phone-pad"
            maxLength={20}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={saveProfile}>
          <Text style={styles.buttonText}>Save Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Change Password</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            value={passwordForm.newPassword}
            onChangeText={(value) => setPasswordForm({ ...passwordForm, newPassword: value })}
            secureTextEntry
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            value={passwordForm.confirmPassword}
            onChangeText={(value) => setPasswordForm({ ...passwordForm, confirmPassword: value })}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={changePassword}>
          <Text style={styles.buttonText}>Update Password</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};


export default CoachProfileScreen;



