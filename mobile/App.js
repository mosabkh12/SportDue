import React, { useRef, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Linking } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';

const AppContent = () => {
  const navigationRef = useRef(null);
  const { isAuthenticated, role } = useAuth();
  const prevAuthState = React.useRef({ isAuthenticated, role });

  // Handle deep links (QR codes, URLs)
  useEffect(() => {
    // Handle initial URL if app was opened via deep link
    const getInitialURL = async () => {
      const url = await Linking.getInitialURL();
      if (url && navigationRef.current) {
        handleDeepLink(url);
      }
    };

    // Handle URL when app is already running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (navigationRef.current) {
        handleDeepLink(url);
      }
    });

    getInitialURL();

    return () => {
      subscription?.remove();
    };
  }, []);

  // Handle deep link navigation
  const handleDeepLink = (url) => {
    try {
      console.log(`🔗 [Deep Link] Processing URL: ${url}`);
      // Parse URL and navigate accordingly
      // Example: sportdue://coach/groups/123 or http://...
      if (url.includes('sportdue://')) {
        const path = url.replace('sportdue://', '');
        const parts = path.split('/');
        
        if (parts[0] === 'coach' && parts[1] === 'groups' && parts[2]) {
          // Navigate to group details
          navigationRef.current?.navigate('Coach', {
            screen: 'GroupDetails',
            params: { groupId: parts[2] },
          });
        } else if (parts[0] === 'player' && parts[1] === 'dashboard') {
          navigationRef.current?.navigate('Player');
        }
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
    }
  };

  React.useEffect(() => {
    if (navigationRef.current) {
      const authChanged = prevAuthState.current.isAuthenticated !== isAuthenticated;
      
      if (authChanged) {
        if (isAuthenticated) {
          // Navigate to the appropriate screen after login
          if (role === 'admin') {
            navigationRef.current.reset({
              index: 0,
              routes: [{ name: 'Admin' }],
            });
          } else if (role === 'coach') {
            navigationRef.current.reset({
              index: 0,
              routes: [{ name: 'Coach' }],
            });
          } else if (role === 'player') {
            navigationRef.current.reset({
              index: 0,
              routes: [{ name: 'Player' }],
            });
          }
        } else {
          // Navigate to login after logout
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
        prevAuthState.current = { isAuthenticated, role };
      }
    }
  }, [isAuthenticated, role]);

  return (
    <NavigationContainer ref={navigationRef}>
      <AppNavigator />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NotificationProvider>
        <AuthProvider>
          <AppContent />
          <StatusBar style="light" />
        </AuthProvider>
      </NotificationProvider>
    </SafeAreaProvider>
  );
}


