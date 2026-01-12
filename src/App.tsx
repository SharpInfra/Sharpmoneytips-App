/**
 * Root App component
 * Entry point for the application
 */

import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { StatusBar } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { RootNavigator } from '@navigation/index';

SplashScreen.preventAutoHideAsync();

const App: FC = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare(): Promise<void> {
      try {
        // Load any custom fonts here if needed
        await Font.loadAsync({});

        // Perform any other initialization here
      } catch (e) {
        console.error('App initialization error:', e);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <RootNavigator />
    </>
  );
};

export default App;
