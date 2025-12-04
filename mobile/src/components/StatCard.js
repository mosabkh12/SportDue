import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StatCard = ({ label, value, accent = '#22c55e', format }) => {
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
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
    position: 'relative',
    overflow: 'hidden',
  },
  chip: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  label: {
    fontSize: 12,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
    marginBottom: 8,
  },
  value: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 36,
  },
});

export default StatCard;


