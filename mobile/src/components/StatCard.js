import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../ui/tokens';

const StatCard = ({ label, value, accent = colors.primary, format }) => {
  // Handle undefined, null, or NaN values - always show a number
  const numValue = typeof value === 'string' && value.startsWith('$') 
    ? parseFloat(value.replace('$', '')) 
    : parseFloat(value);
  
  const displayValue = !isNaN(numValue) && numValue !== null && numValue !== undefined 
    ? numValue 
    : 0;
  
  // Format the display value
  let formattedValue = displayValue;
  if (format === 'currency') {
    formattedValue = `$${displayValue.toFixed(2)}`;
  } else if (format === 'percentage') {
    formattedValue = `${displayValue}%`;
  } else {
    formattedValue = displayValue;
  }
  
  return (
    <View style={styles.card}>
      <View style={[styles.chip, { backgroundColor: accent }]} />
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: accent }]}>{formattedValue}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
    flex: 1,
  },
  chip: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontWeight: '600',
    marginBottom: 5,
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },
});

export default StatCard;


