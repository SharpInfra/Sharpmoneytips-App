/**
 * Badge component
 * Neutral status badge
 */

import React from 'react';
import { View, Text, ViewProps, StyleSheet } from 'react-native';
import { spacing, typography, borderRadius } from '@theme/index';

interface BadgeProps extends ViewProps {
  label: string;
  variant?: 'default' | 'outline';
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeDefault: {
    backgroundColor: '#F0F0F0',
  },
  badgeOutline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  text: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: '#333333',
  },
});

export const Badge = React.forwardRef<View, BadgeProps>(
  ({ label, variant = 'default', style, ...props }, ref) => {
    return (
      <View
        ref={ref}
        style={[
          styles.badge,
          variant === 'default' ? styles.badgeDefault : styles.badgeOutline,
          style,
        ]}
        {...props}
      >
        <Text style={styles.text}>{label}</Text>
      </View>
    );
  }
);

Badge.displayName = 'Badge';
