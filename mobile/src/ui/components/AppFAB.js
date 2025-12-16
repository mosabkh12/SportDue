import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadow } from '../tokens';

/**
 * AppFAB - Floating Action Button
 * 
 * @param {ReactNode} icon - Icon component to display
 * @param {function} onPress - Press handler
 * @param {boolean} disabled - Disable button
 * @param {string} position - 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' (default: 'bottom-right')
 * @param {object} style - Additional styles
 */
const AppFAB = ({
  icon,
  onPress,
  disabled = false,
  position = 'bottom-right',
  style,
  ...props
}) => {
  const insets = useSafeAreaInsets();

  const getPositionStyle = () => {
    const basePositions = {
      'bottom-right': { bottom: spacing.xl + insets.bottom, right: spacing.xl + insets.right },
      'bottom-left': { bottom: spacing.xl + insets.bottom, left: spacing.xl + insets.left },
      'top-right': { top: spacing.xl + insets.top, right: spacing.xl + insets.right },
      'top-left': { top: spacing.xl + insets.top, left: spacing.xl + insets.left },
    };
    return basePositions[position] || basePositions['bottom-right'];
  };

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        getPositionStyle(),
        disabled && styles.fabDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      {...props}
    >
      <View style={styles.iconContainer}>
        {icon}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.lg,
    zIndex: 1000,
  },
  fabDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AppFAB;

