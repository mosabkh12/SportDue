/**
 * Design tokens for the SportDue mobile app
 * Provides a consistent design system with colors, spacing, typography, etc.
 */

/**
 * Helper function to add opacity to a hex color
 * @param {string} hex - Hex color code (e.g., '#22c55e')
 * @param {number} opacity - Opacity value between 0 and 1
 * @returns {string} - RGBA color string
 */
export const alpha = (hex, opacity) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Color palette - Dark theme
 */
export const colors = {
  // Primary colors (green)
  primary: '#22c55e',
  primaryDark: '#16a34a',
  primaryLight: '#4ade80',
  
  // Secondary colors
  secondary: '#14b8a6',
  accent: '#38bdf8',
  
  // Semantic colors
  success: '#22c55e',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#38bdf8',
  
  // Text colors
  textPrimary: '#ffffff',
  textSecondary: '#e5e7eb',
  textMuted: '#9ca3af',
  textDisabled: '#6b7280',
  
  // Background layers
  bgPrimary: '#000000',
  bgSecondary: '#111827',
  bgTertiary: '#1f2937',
  bgQuaternary: '#2a3441',
  
  // Border colors
  border: '#374151',
  borderLight: '#4b5563',
  borderDark: '#1f2937',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayDark: 'rgba(0, 0, 0, 0.75)',
};

/**
 * Spacing scale
 */
export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
};

/**
 * Border radius scale
 */
export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
};

/**
 * Typography scale
 * Using direct color values to avoid reference issues
 */
export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
    color: '#ffffff', // colors.textPrimary
  },
  h2: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    color: '#ffffff', // colors.textPrimary
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    color: '#ffffff', // colors.textPrimary
  },
  h4: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    color: '#ffffff', // colors.textPrimary
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: '#ffffff', // colors.textPrimary
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    color: '#ffffff', // colors.textPrimary
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: '#9ca3af', // colors.textMuted
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: '#e5e7eb', // colors.textSecondary
  },
};

/**
 * Shadow definitions for iOS and Android
 */
export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
};


