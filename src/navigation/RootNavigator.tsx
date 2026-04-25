/**
 * Root navigation structure
 * Handles auth-guarded navigation
 */

import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '@store/index';
import { AuthScreen } from '@screens/index';
import { AppNavigator } from './AppNavigator';
import { Loader } from '@components/index';
import { View } from 'react-native';

// DEV-only import
let DesignLabScreen: FC | null = null;
if (__DEV__) {
  // Note: require is necessary to avoid bundling src/dev into production builds
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  DesignLabScreen = require('@dev/DesignLabScreen').DesignLabScreen;
}

const Stack = createNativeStackNavigator();

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

/**
 * Root navigation component with auth state handling
 */
export const RootNavigator: FC = () => {
  const { session, setSession } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  // Simulate checking for existing session on app start
  useEffect(() => {
    const initializeAuth = async (): Promise<void> => {
      try {
        // TODO: Check for stored session
        setIsInitializing(false);
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, []);

  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Loader />
      </View>
    );
  }

  const isAuthenticated = !!session;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {__DEV__ && DesignLabScreen ? (
          <Stack.Screen name="DesignLab" component={DesignLabScreen} />
        ) : null}
        {!isAuthenticated ? (
          <Stack.Screen name="Auth">
            {() => (
              <AuthScreen
                onLoginSuccess={() =>
                  setSession({
                    userId: 'demo',
                    token: 'demo-token',
                    refreshToken: 'demo-refresh',
                    expiresAt: Date.now() + 86_400_000,
                  })
                }
              />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="App" component={AppNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
