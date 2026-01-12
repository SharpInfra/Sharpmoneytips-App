/**
 * Home screen
 * Main app entry screen after authentication
 */

import type { FC } from 'react';
import { View, Text, SafeAreaView, StyleSheet, ScrollView, Pressable } from 'react-native';
import { spacing, typography } from '@theme/index';
import { Card, EmptyState } from '@components/index';

type HomeScreenProps = {
  onLogout?: () => void;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: '#666666',
  },
  content: {
    padding: spacing.lg,
  },
  logoutButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#666666',
    fontWeight: typography.weights.semibold,
  },
});

export const HomeScreen: FC<HomeScreenProps> = ({ onLogout }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>Your financial tips will appear here</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card>
          <EmptyState
            title="No Tips Yet"
            message="Financial tips and insights will be personalized for you once you complete your profile."
          />
        </Card>

        {onLogout && (
          <Pressable style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
