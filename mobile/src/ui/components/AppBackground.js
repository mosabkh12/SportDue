import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, alpha } from '../tokens';

/**
 * AppBackground - LinearGradient background with soft blob effects
 * 
 * @param {ReactNode} children - Content
 * @param {array} gradientColors - Gradient colors array (default: dark theme gradient)
 * @param {object} style - Additional container styles
 */
const AppBackground = ({
  children,
  gradientColors = [colors.bgTertiary, colors.bgSecondary, colors.bgPrimary],
  style,
}) => {
  return (
    <LinearGradient
      colors={gradientColors}
      style={[styles.container, style]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      {/* Soft blob effects */}
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />
      <View style={[styles.blob, styles.blob3]} />
      
      <View style={styles.content}>
        {children}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.1,
  },
  blob1: {
    width: 300,
    height: 300,
    top: -100,
    right: -100,
    backgroundColor: colors.primary,
  },
  blob2: {
    width: 200,
    height: 200,
    bottom: -50,
    left: -50,
    backgroundColor: colors.accent,
  },
  blob3: {
    width: 150,
    height: 150,
    top: '40%',
    right: '20%',
    backgroundColor: colors.secondary,
  },
});

export default AppBackground;


