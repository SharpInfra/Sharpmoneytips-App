/**
 * App navigator (authenticated screens)
 * Main app navigation structure
 */

import type { FC } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '@screens/index';
import { useAuthStore } from '@store/index';

const Stack = createNativeStackNavigator();

export type AppStackParamList = {
  Home: undefined;
};

/**
 * Navigator for authenticated app screens
 */
export const AppNavigator: FC = () => {
  const { reset } = useAuthStore();

  const handleLogout = (): void => {
    reset();
  };

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} initialParams={{ onLogout: handleLogout }} />
    </Stack.Navigator>
  );
};
