import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
} from 'react-native';
import { colors, spacing, radius, typography } from '../tokens';

/**
 * AppInput - A styled input component with label, error, and icon support
 * 
 * @param {string} label - Input label
 * @param {string} error - Error message (shows in red)
 * @param {ReactNode} leftIcon - Icon component to show on the left
 * @param {boolean} multiline - Enable multiline input
 * @param {number} numberOfLines - Number of lines for multiline
 * @param {object} style - Additional container styles
 * @param {object} inputStyle - Additional input styles
 */
const AppInput = ({
  label,
  error,
  leftIcon,
  multiline = false,
  numberOfLines = 4,
  style,
  inputStyle,
  ...props
}) => {
  const hasError = !!error;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View
        style={[
          styles.inputContainer,
          hasError && styles.inputContainerError,
          multiline && styles.inputContainerMultiline,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithIcon,
            multiline && styles.inputMultiline,
            inputStyle,
          ]}
          placeholderTextColor={colors.textMuted}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          {...props}
        />
      </View>

      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  inputContainerError: {
    borderColor: colors.error,
  },
  inputContainerMultiline: {
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    minHeight: 100,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  input: {
    ...typography.body,
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  inputMultiline: {
    textAlignVertical: 'top',
    paddingTop: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.error,
  },
});

export default AppInput;


