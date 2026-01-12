/**
 * EmptyState component
 * Generic empty state display
 */

import React from 'react';
import { View, Text, ViewProps, StyleSheet } from 'react-native';
import { spacing, typography, borderRadius } from '@theme/index';

interface EmptyStateProps extends ViewProps {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: '#333333',
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: typography.sizes.base,
    color: '#666666',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionText: {
    color: '#333333',
    fontWeight: typography.weights.semibold,
  },
});

export const EmptyState = React.forwardRef<View, EmptyStateProps>(
  ({ title = 'No Data', message, actionLabel, onAction, style, ...props }, ref) => {
    return (
      <View ref={ref} style={[styles.container, style]} {...props}>
        {title && <Text style={styles.title}>{title}</Text>}
        <Text style={styles.message}>{message}</Text>
        {actionLabel && onAction && (
          <View style={styles.actionButton}>
            <Text style={styles.actionText} onPress={onAction}>
              {actionLabel}
            </Text>
          </View>
        )}
      </View>
    );
  }
);

EmptyState.displayName = 'EmptyState';
