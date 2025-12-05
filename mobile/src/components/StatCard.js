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
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#374151',
    position: 'relative',
    overflow: 'hidden',
    flex: 1,
  },
  chip: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 10,
    color: '#9ca3af',
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


