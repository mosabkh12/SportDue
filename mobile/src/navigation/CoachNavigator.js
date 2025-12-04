import React from 'react';
import { Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CoachDashboardScreen from '../screens/coach/CoachDashboardScreen';
import CoachProfileScreen from '../screens/coach/CoachProfileScreen';
import GroupDetailsScreen from '../screens/coach/GroupDetailsScreen';
import PlayerDetailsScreen from '../screens/coach/PlayerDetailsScreen';
import AttendanceScreen from '../screens/coach/AttendanceScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const CoachTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#22c55e',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#111827',
          borderTopColor: '#374151',
          borderTopWidth: 1,
        },
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={CoachDashboardScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📊</Text>,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={CoachProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

const CoachNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#111827',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen name="CoachTabs" component={CoachTabs} options={{ headerShown: false }} />
      <Stack.Screen 
        name="GroupDetails" 
        component={GroupDetailsScreen}
        options={({ route }) => ({ title: route.params?.groupName || 'Group Details' })}
      />
      <Stack.Screen 
        name="PlayerDetails" 
        component={PlayerDetailsScreen}
        options={{ title: 'Player Details' }}
      />
      <Stack.Screen 
        name="Attendance" 
        component={AttendanceScreen}
        options={{ title: 'Attendance' }}
      />
    </Stack.Navigator>
  );
};

export default CoachNavigator;

