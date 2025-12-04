import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';

const Notification = ({ notification, onClose }) => {
  const fadeAnim = new Animated.Value(1);

  useEffect(() => {
    if (notification.autoClose) {
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onClose(notification.id);
        });
      }, notification.duration || 3000);

      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'info':
        return 'ℹ';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  const getColor = () => {
    switch (notification.type) {
      case 'success':
        return '#22c55e';
      case 'error':
        return '#ef4444';
      case 'info':
        return '#3b82f6';
      case 'warning':
        return '#f59e0b';
      default:
        return '#3b82f6';
    }
  };

  return (
    <Animated.View style={[styles.notification, { opacity: fadeAnim, borderLeftColor: getColor() }]}>
      <TouchableOpacity
        style={styles.notificationContent}
        onPress={() => onClose(notification.id)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${getColor()}20` }]}>
          <Text style={[styles.icon, { color: getColor() }]}>{getIcon()}</Text>
        </View>
        <Text style={styles.message}>{notification.message}</Text>
        <TouchableOpacity
          onPress={() => onClose(notification.id)}
          style={styles.closeButton}
        >
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const NotificationContainer = ({ notifications = [], removeNotification }) => {
  if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          onClose={removeNotification}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 16,
    left: 16,
    zIndex: 10000,
    pointerEvents: 'box-none',
  },
  notification: {
    backgroundColor: '#111827',
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  message: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  closeText: {
    color: '#9ca3af',
    fontSize: 24,
    lineHeight: 24,
  },
});

export default NotificationContainer;


