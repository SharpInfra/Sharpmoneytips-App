/**
 * Loader component
 * Generic loading indicator
 */

import React from 'react';
import { View, ActivityIndicator, ViewProps, StyleSheet } from 'react-native';
import { spacing } from '@theme/index';

interface LoaderProps extends ViewProps {
  size?: 'small' | 'large';
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
});

export const Loader = React.forwardRef<View, LoaderProps>(
  ({ size = 'large', style, ...props }, ref) => {
    return (
      <View ref={ref} style={[styles.container, style]} {...props}>
        <ActivityIndicator size={size} color="#666666" />
      </View>
    );
  }
);

Loader.displayName = 'Loader';
