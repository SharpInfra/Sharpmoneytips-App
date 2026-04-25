/**
 * Root App component
 * Entry point for the application
 */

import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { Alert, StatusBar } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import * as Updates from 'expo-updates';
import { RootNavigator } from '@navigation/index';

SplashScreen.preventAutoHideAsync();

const App: FC = () => {
  const [isReady, setIsReady] = useState(false);

  // OTA update engine — runs independently, never blocks UI or navigation.
  // Skipped in Expo Go / dev builds where Updates.isEnabled is false.
  useEffect(() => {
    if (!Updates.isEnabled) {
      return;
    }

    let cancelled = false;

    async function checkForUpdate(): Promise<void> {
      try {
        const result = await Updates.checkForUpdateAsync();

        if (cancelled || !result.isAvailable) {
          return;
        }

        await Updates.fetchUpdateAsync();

        if (cancelled) {
          return;
        }

        Alert.alert(
          'Update available',
          'A new version has been downloaded and is ready to install.',
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Restart now',
              style: 'default',
              onPress: () => Updates.reloadAsync(),
            },
          ],
          { cancelable: true },
        );
      } catch (error) {
        // Non-fatal — update failure must never surface to the user
        console.error('[OTA] Update check failed:', error);
      }
    }

    checkForUpdate();

    return () => {
      cancelled = true;
    };
  }, []);

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
