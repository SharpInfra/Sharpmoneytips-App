/**
 * Root navigation structure
 * Handles auth-guarded navigation
 */

import type { FC } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '@store/index';
import { AuthScreen } from '@screens/index';
import { AppNavigator } from './AppNavigator';
import { Loader } from '@components/index';
import { View } from 'react-native';
import { runtimeEngine } from '@services/runtimeEngine';

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
  const { session, setSession, isHydrating, isHydrated } = useAuthStore();
  const navigationRef = useNavigationContainerRef();

  if (isHydrating || !isHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Loader />
      </View>
    );
  }

  const isAuthenticated = !!session;

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        const initialRouteName = navigationRef.getCurrentRoute()?.name;
        if (initialRouteName) {
          runtimeEngine.trackRouteChange(initialRouteName);
        }
      }}
      onStateChange={() => {
        const routeName = navigationRef.getCurrentRoute()?.name;
        if (routeName) {
          runtimeEngine.trackRouteChange(routeName);
        }
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Auth">
            {() => (
              <AuthScreen
                onLoginSuccess={() => {
                  setSession({
                    userId: 'demo',
                    token: 'demo-token',
                    refreshToken: 'demo-refresh',
                    expiresAt: Date.now() + 86_400_000,
                  });
                }}
              />
            )}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="App" component={AppNavigator} />
            {__DEV__ && DesignLabScreen ? <Stack.Screen name="DesignLab" component={DesignLabScreen} /> : null}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
