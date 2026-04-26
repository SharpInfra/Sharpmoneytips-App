/**
 * Auth screen (Login)
 * Stub login screen with navigation placeholder
 */

import type { FC } from 'react';
import { Text, SafeAreaView, StyleSheet, Pressable } from 'react-native';
import { spacing, typography } from '@theme/index';

type AuthScreenProps = {
  onLoginSuccess?: () => void;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: '#666666',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#333333',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
});

export const AuthScreen: FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const handleLogin = (): void => {
    onLoginSuccess?.();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>SharpMoneyTips</Text>
      <Text style={styles.subtitle}>Sign in to access your personalized financial tips</Text>

      <Pressable style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Continue with Demo</Text>
      </Pressable>
    </SafeAreaView>
  );
};
