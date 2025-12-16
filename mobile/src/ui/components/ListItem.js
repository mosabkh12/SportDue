import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { colors, spacing, radius, typography } from '../tokens';

/**
 * ListItem - A list item component with icon, title, subtitle, and chevron
 * 
 * @param {string} title - Item title
 * @param {string} subtitle - Optional subtitle
 * @param {ReactNode|string} leftIcon - Icon component or image source
 * @param {boolean} showChevron - Show right chevron
 * @param {function} onPress - Press handler
 * @param {object} style - Additional container styles
 */
const ListItem = ({
  title,
  subtitle,
  leftIcon,
  showChevron = true,
  onPress,
  style,
  ...props
}) => {
  const renderLeftIcon = () => {
    if (!leftIcon) return null;

    if (typeof leftIcon === 'string') {
      // Image source (URI string)
      return (
        <Image
          source={{ uri: leftIcon }}
          style={styles.avatar}
        />
      );
    }

    // React component
    return <View style={styles.iconContainer}>{leftIcon}</View>;
  };

  const content = (
    <View style={[styles.container, style]} {...props}>
      {renderLeftIcon()}
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {showChevron && (
        <View style={styles.right}>
          <Text style={styles.chevron}>›</Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.touchable}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  touchable: {
    backgroundColor: colors.bgSecondary,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    ...typography.body,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    marginTop: 2,
    color: colors.textMuted,
  },
  right: {
    marginLeft: spacing.md,
  },
  chevron: {
    fontSize: 24,
    color: colors.textMuted,
    fontWeight: '300',
  },
});

export default ListItem;


