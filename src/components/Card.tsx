/**
 * Card component
 * Neutral container primitive for content grouping
 */

import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { spacing, borderRadius } from '@theme/index';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: keyof typeof spacing;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.md,
    backgroundColor: '#FFFFFF',
  },
});

export const Card = React.forwardRef<View, CardProps>(
  ({ children, padding = 'md', style, ...props }, ref) => {
    return (
      <View ref={ref} style={[styles.card, { padding: spacing[padding] }, style]} {...props}>
        {children}
      </View>
    );
  }
);

Card.displayName = 'Card';
