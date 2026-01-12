/**
 * ErrorState component
 * Generic error display
 */

import React from 'react';
import { View, Text, ViewProps, StyleSheet } from 'react-native';
import { spacing, typography, borderRadius } from '@theme/index';

interface ErrorStateProps extends ViewProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: '#C62828',
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: typography.sizes.base,
    color: '#C62828',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});

export const ErrorState = React.forwardRef<View, ErrorStateProps>(
  ({ title = 'Error', message, onRetry, style, ...props }, ref) => {
    return (
      <View ref={ref} style={[styles.container, style]} {...props}>
        {title && <Text style={styles.title}>{title}</Text>}
        <Text style={styles.message}>{message}</Text>
        {onRetry && (
          <Text
            style={{
              color: '#C62828',
              fontWeight: typography.weights.semibold,
              marginTop: spacing.sm,
            }}
            onPress={onRetry}
          >
            Retry
          </Text>
        )}
      </View>
    );
  }
);

ErrorState.displayName = 'ErrorState';
