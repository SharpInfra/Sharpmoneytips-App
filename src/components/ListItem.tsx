/**
 * ListItem component
 * Neutral list item primitive
 */

import React from 'react';
import { View, Text, ViewProps, StyleSheet, Pressable } from 'react-native';
import { spacing, typography } from '@theme/index';

interface ListItemProps extends ViewProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  disabled?: boolean;
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  pressable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: '#666666',
  },
});

export const ListItem = React.forwardRef<View, ListItemProps>(
  ({ title, subtitle, onPress, disabled = false, style, ...props }, ref) => {
    return (
      <View ref={ref} style={[styles.container, style]} {...props}>
        <Pressable style={styles.pressable} onPress={onPress} disabled={disabled}>
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </Pressable>
      </View>
    );
  }
);

ListItem.displayName = 'ListItem';
