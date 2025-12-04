import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import CoachNavigator from './CoachNavigator';
import AdminNavigator from './AdminNavigator';
import PlayerNavigator from './PlayerNavigator';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  const getInitialRoute = () => {
    if (!isAuthenticated) return 'Login';
    if (role === 'admin') return 'Admin';
    if (role === 'coach') return 'Coach';
    if (role === 'player') return 'Player';
    return 'Login';
  };

  return (
    <Stack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName={getInitialRoute()}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Admin" component={AdminNavigator} />
      <Stack.Screen name="Coach" component={CoachNavigator} />
      <Stack.Screen name="Player" component={PlayerNavigator} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
});

export default AppNavigator;


