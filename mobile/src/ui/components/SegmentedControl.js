import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { colors, spacing, radius, typography } from '../tokens';

/**
 * SegmentedControl - A segmented control component
 * 
 * @param {array} segments - Array of segment objects: [{ label: string, value: any }]
 * @param {any} selectedValue - Currently selected value
 * @param {function} onValueChange - Callback when value changes: (value) => void
 * @param {object} style - Additional container styles
 */
const SegmentedControl = ({
  segments = [],
  selectedValue,
  onValueChange,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {segments.map((segment, index) => {
        const isSelected = segment.value === selectedValue;
        const isFirst = index === 0;
        const isLast = index === segments.length - 1;

        return (
          <TouchableOpacity
            key={segment.value}
            style={[
              styles.segment,
              isFirst && styles.segmentFirst,
              isLast && styles.segmentLast,
              isSelected && styles.segmentSelected,
            ]}
            onPress={() => onValueChange(segment.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.segmentText,
                isSelected && styles.segmentTextSelected,
              ]}
            >
              {segment.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    padding: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  segmentFirst: {
    borderTopLeftRadius: radius.sm,
    borderBottomLeftRadius: radius.sm,
  },
  segmentLast: {
    borderTopRightRadius: radius.sm,
    borderBottomRightRadius: radius.sm,
  },
  segmentSelected: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    ...typography.body,
    fontWeight: '500',
    color: colors.textMuted,
  },
  segmentTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default SegmentedControl;


