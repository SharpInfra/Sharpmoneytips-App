/**
 * StatusLabel component
 * Neutral status display
 */

import React from 'react';
import { View, Text, ViewProps, StyleSheet } from 'react-native';
import { spacing, typography, borderRadius } from '@theme/index';

type StatusType = 'success' | 'error' | 'warning' | 'info';

interface StatusLabelProps extends ViewProps {
  label: string;
  status?: StatusType;
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  success: {
    backgroundColor: '#E8F5E9',
  },
  error: {
    backgroundColor: '#FFEBEE',
  },
  warning: {
    backgroundColor: '#FFF3E0',
  },
  info: {
    backgroundColor: '#E3F2FD',
  },
  textSuccess: {
    color: '#2E7D32',
  },
  textError: {
    color: '#C62828',
  },
  textWarning: {
    color: '#E65100',
  },
  textInfo: {
    color: '#1565C0',
  },
});

export const StatusLabel = React.forwardRef<View, StatusLabelProps>(
  ({ label, status = 'info', style, ...props }, ref) => {
    const statusStyles = {
      success: styles.success,
      error: styles.error,
      warning: styles.warning,
      info: styles.info,
    };

    const textStyles = {
      success: styles.textSuccess,
      error: styles.textError,
      warning: styles.textWarning,
      info: styles.textInfo,
    };

    return (
      <View ref={ref} style={[styles.container, statusStyles[status], style]} {...props}>
        <Text style={[styles.text, textStyles[status]]}>{label}</Text>
      </View>
    );
  }
);

StatusLabel.displayName = 'StatusLabel';
