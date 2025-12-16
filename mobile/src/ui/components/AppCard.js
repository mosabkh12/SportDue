import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, shadow, typography } from '../tokens';

/**
 * AppCard - A container component with border, padding, and optional header
 * 
 * @param {string} title - Optional header title
 * @param {string} subtitle - Optional header subtitle
 * @param {ReactNode} headerRight - Optional right-side header content
 * @param {ReactNode} children - Card content
 * @param {object} style - Additional container styles
 * @param {boolean} noPadding - Remove default padding
 */
const AppCard = ({
  title,
  subtitle,
  headerRight,
  children,
  style,
  noPadding = false,
}) => {
  return (
    <View style={[styles.card, style]}>
      {(title || subtitle || headerRight) && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {headerRight && <View style={styles.headerRight}>{headerRight}</View>}
        </View>
      )}
      
      <View style={[styles.content, noPadding && styles.contentNoPadding]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    marginLeft: spacing.md,
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
  },
  content: {
    padding: spacing.lg,
  },
  contentNoPadding: {
    padding: 0,
  },
});

export default AppCard;


