import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CoachHomeScreen from '../screens/coach/CoachHomeScreen';
import CoachGroupsScreen from '../screens/coach/CoachGroupsScreen';
import CoachScheduleScreen from '../screens/coach/CoachScheduleScreen';
import CoachProfileScreen from '../screens/coach/CoachProfileScreen';
import GroupDetailsScreen from '../screens/coach/GroupDetailsScreen';
import PlayerDetailsScreen from '../screens/coach/PlayerDetailsScreen';
import AttendanceScreen from '../screens/coach/AttendanceScreen';
import GroupScheduleEditorScreen from '../screens/coach/GroupScheduleEditorScreen';
import { colors, shadow } from '../ui/tokens';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const CoachTabs = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          height: 64 + Math.max(insets.bottom, 8),
          backgroundColor: colors.bgSecondary,
          borderTopWidth: 0,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            },
            android: {
              elevation: 8,
            },
          }),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={CoachHomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Teams" 
        component={CoachGroupsScreen}
        options={{
          tabBarLabel: 'Teams',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Calendar" 
        component={CoachScheduleScreen}
        options={{
          tabBarLabel: 'Calendar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={CoachProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
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
          backgroundColor: colors.bgSecondary,
        },
        headerTintColor: colors.textPrimary,
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
      <Stack.Screen 
        name="GroupScheduleEditor" 
        component={GroupScheduleEditorScreen}
        options={({ route }) => ({ title: route.params?.groupName || 'Schedule Editor' })}
      />
    </Stack.Navigator>
  );
};

export default CoachNavigator;

