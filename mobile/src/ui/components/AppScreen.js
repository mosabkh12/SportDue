import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '../tokens';

/**
 * AppScreen - A screen wrapper with SafeArea, gradient background, soft blobs, and optional ScrollView
 * 
 * @param {ReactNode} children - Screen content
 * @param {string} edges - SafeArea edges (default: ['top', 'bottom'])
 * @param {array} gradientColors - Gradient colors array (default: dark theme gradient)
 * @param {number} padding - Content padding (default: spacing.lg = 18)
 * @param {object} contentContainerStyle - Additional ScrollView contentContainerStyle
 * @param {object} style - Additional container styles
 * @param {object} scrollViewProps - Additional ScrollView props (e.g., refreshControl)
 * @param {boolean} useScrollView - Whether to wrap content in ScrollView (default: true)
 */
const AppScreen = ({
  children,
  edges = ['top'],
  gradientColors,
  padding = spacing.lg,
  contentContainerStyle,
  style,
  scrollViewProps = {},
  useScrollView = true,
}) => {
  // Use default gradient colors if not provided (moved inside function to avoid module load issue)
  const defaultGradientColors = gradientColors || [colors.bgTertiary, colors.bgSecondary, colors.bgPrimary];
  return (
    <View style={styles.outerContainer}>
      <LinearGradient
        colors={defaultGradientColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
      >
        {/* Soft blob effects */}
        <View style={[styles.blob, styles.blob1]} pointerEvents="none" />
        <View style={[styles.blob, styles.blob2]} pointerEvents="none" />
        <View style={[styles.blob, styles.blob3]} pointerEvents="none" />
      </LinearGradient>
      <SafeAreaView 
        edges={edges} 
        style={[styles.container, { backgroundColor: 'transparent' }, style]}
      >
        {useScrollView ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { padding, paddingBottom: padding + 100 }, // Extra padding for tab bar
              contentContainerStyle,
            ]}
            showsVerticalScrollIndicator={false}
            {...scrollViewProps}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.scrollView, { padding, zIndex: 1 }]}>
            {children}
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.15,
    zIndex: 0,
  },
  blob1: {
    width: 300,
    height: 300,
    top: -150,
    right: -150,
    backgroundColor: colors.primary,
  },
  blob2: {
    width: 200,
    height: 200,
    bottom: -80,
    left: -80,
    backgroundColor: colors.accent,
  },
  blob3: {
    width: 150,
    height: 150,
    top: -60,
    left: -60,
    backgroundColor: colors.secondary,
  },
});

export default AppScreen;

