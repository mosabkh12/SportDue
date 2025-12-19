import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../ui/tokens';

const CONTAINER_PADDING = 4; // Inner padding on pillContainer
const CONTAINER_HEIGHT = 48;

/**
 * SegmentedTabs - Premium segmented control with animated indicator
 * 
 * @param {string} value - Currently selected tab key
 * @param {function} onChange - Callback when tab changes: (key) => void
 * @param {array} tabs - Array of tab objects: [{ key: string, label: string, icon: string }]
 */
const SegmentedTabs = ({ value, onChange, tabs = [] }) => {
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);
  const tabCount = tabs.length || 4;

  // Calculate tab width based on measured container width (accounting for padding on pillContainer)
  const tabWidth = containerWidth > 0 
    ? (containerWidth - CONTAINER_PADDING * 2) / tabCount 
    : 0;

  // Calculate indicator position based on selected index
  const selectedIndex = tabs.findIndex(tab => tab.key === value);
  const indicatorPosition = selectedIndex >= 0 && tabWidth > 0
    ? CONTAINER_PADDING + selectedIndex * tabWidth
    : CONTAINER_PADDING;

  useEffect(() => {
    if (tabWidth > 0) {
      Animated.spring(indicatorAnim, {
        toValue: indicatorPosition,
        useNativeDriver: true,
        tension: 68,
        friction: 8,
      }).start();
    }
  }, [indicatorPosition, indicatorAnim, tabWidth]);

  const handleContainerLayout = (event) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && width !== containerWidth) {
      setContainerWidth(width);
    }
  };

  return (
    <View style={styles.container}>
      <View 
        style={styles.pillContainer}
        onLayout={handleContainerLayout}
      >
        {/* Animated Indicator */}
        {tabWidth > 0 && (
          <Animated.View
            style={[
              styles.indicator,
              {
                width: tabWidth,
                transform: [{ translateX: indicatorAnim }],
              },
            ]}
          />
        )}

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {tabs.map((tab, index) => {
            const isActive = tab.key === value;
            return (
              <Pressable
                key={tab.key}
                style={styles.tab}
                onPress={() => onChange(tab.key)}
              >
                <Ionicons
                  name={isActive ? tab.icon.replace('-outline', '') : tab.icon}
                  size={16}
                  color={isActive ? '#0B0F0D' : 'rgba(255,255,255,0.80)'}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    isActive && styles.tabLabelActive,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pillContainer: {
    width: '100%',
    height: CONTAINER_HEIGHT,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
    position: 'relative',
    padding: 4,
  },
  tabsRow: {
    flexDirection: 'row',
    height: '100%',
    zIndex: 1,
  },
  indicator: {
    position: 'absolute',
    top: CONTAINER_PADDING,
    bottom: CONTAINER_PADDING,
    borderRadius: 18,
    backgroundColor: colors.primary,
    zIndex: 0,
    pointerEvents: 'none',
    ...shadow.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 6,
    gap: 6,
  },
  tabLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.80)',
    paddingBottom: 1,
    ...(Platform.OS === 'android' && {
      includeFontPadding: false,
      textAlignVertical: 'center',
    }),
  },
  tabLabelActive: {
    color: '#0B0F0D',
    fontWeight: '700',
  },
});

export default SegmentedTabs;

