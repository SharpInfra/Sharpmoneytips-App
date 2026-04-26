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
import { runtimeEngine } from '@services/runtimeEngine';

SplashScreen.preventAutoHideAsync();

const App: FC = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function prepare(): Promise<void> {
      try {
        // Load any custom fonts here if needed
        await Font.loadAsync({});

        // Initialize runtime before navigation renders to avoid auth flicker/races.
        await runtimeEngine.initialize();
      } catch (e) {
        console.error('App initialization error:', e);
      } finally {
        if (!isMounted) {
          return;
        }

        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    void prepare();

    return () => {
      isMounted = false;
    };
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
