import React from 'react';
import { Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import PlayerDashboardScreen from '../screens/player/PlayerDashboardScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const PlayerTabs = () => {
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
        component={PlayerDashboardScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📊</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

const PlayerNavigator = () => {
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
      <Stack.Screen name="PlayerTabs" component={PlayerTabs} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

export default PlayerNavigator;

