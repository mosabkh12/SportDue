import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { getCurrentIP } from '../utils/networkDetector';
import { AppScreen, AppBackground } from '../ui/components';
import { styles } from '../styles/screens/LoginScreen.styles';
import { colors } from '../styles/theme';

const LoginScreen = () => {
  const { login } = useAuth();
  const notifications = useNotifications();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentIP, setCurrentIP] = useState('');

  // Update IP display when component mounts or IP changes
  React.useEffect(() => {
    const updateIP = () => {
      const ip = getCurrentIP();
      setCurrentIP(ip || 'Detecting...');
    };
    
    updateIP();
    const interval = setInterval(updateIP, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const role = await login(form);
      notifications.success(`Welcome back! You have been successfully authenticated as ${role}.`);
    } catch (err) {
      setError(err.message);
      notifications.error(err.message || 'Authentication failed. Please verify your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen edges={[]} useScrollView={false}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <AppBackground>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <View style={styles.logoContainer}>
                <View style={styles.logoIcon}>
                  <Text style={styles.logoText}>SD</Text>
                </View>
                <Text style={styles.logoTitle}>SportDue</Text>
                
                {/* IP Status Indicator */}
                <View style={styles.ipStatusContainer}>
                  <View style={[styles.ipStatusDot, currentIP && currentIP !== 'Detecting...' && styles.ipStatusDotConnected]} />
                  <Text style={styles.ipStatusText}>
                    {currentIP ? `Server: ${currentIP}` : 'Detecting server...'}
                  </Text>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.title}>Sign In</Text>
                <Text style={styles.subtitle}>Enter your credentials to access your account.</Text>

                <View style={styles.form}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Email Address or Username</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email address or username"
                      placeholderTextColor={colors.textMuted}
                      value={form.identifier}
                      onChangeText={(value) => handleChange('identifier', value)}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      returnKeyType="next"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your password"
                      placeholderTextColor={colors.textMuted}
                      value={form.password}
                      onChangeText={(value) => handleChange('password', value)}
                      secureTextEntry
                      autoCapitalize="none"
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit}
                    />
                  </View>

                  {error && <Text style={styles.errorText}>{error}</Text>}

                  <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Sign In</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.features}>
                <Text style={styles.featuresTitle}>Features</Text>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>✓</Text>
                  <Text style={styles.featureText}>Real-time Payment Tracking</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>✓</Text>
                  <Text style={styles.featureText}>Automated Payment Reminders</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>✓</Text>
                  <Text style={styles.featureText}>Digital Attendance Management</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </AppBackground>
      </KeyboardAvoidingView>
    </AppScreen>
  );
};


export default LoginScreen;


