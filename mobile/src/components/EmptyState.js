import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../ui/tokens';

/**
 * EmptyState - A reusable empty state component
 * 
 * @param {string} icon - Ionicons icon name
 * @param {string} title - Main title text
 * @param {string} subtitle - Optional subtitle text
 * @param {string} actionLabel - Optional action button label
 * @param {function} onAction - Optional action button handler
 */
const EmptyState = ({ icon, title, subtitle, actionLabel, onAction }) => {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color={colors.textMuted} />
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h3,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 10,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default EmptyState;

