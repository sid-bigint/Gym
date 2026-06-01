import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { LogBox } from "react-native";
import { GlobalAlert } from "../src/components/GlobalAlert";
import { initDatabase } from "../src/db/database";
import { useAlertStore } from "../src/store/useAlertStore";
import { useAuthStore } from "../src/store/useAuthStore";
import { useUserStore } from "../src/store/useUserStore";
import { CloudSyncService } from "../src/services/cloudSyncService";

import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from '../src/widgets/WidgetTaskHandler';

registerWidgetTaskHandler(widgetTaskHandler);

import { useWorkoutNotification } from "../src/hooks/useWorkoutNotification";
// Ignore specific warnings that are irrelevant to our Local Notification implementation
LogBox.ignoreLogs([
  "expo-notifications: Android Push notifications",
  "The 'expo-notifications' functionality"
]);

SplashScreen.preventAutoHideAsync().catch(() => { });

export default function RootLayout() {
  const loadUser = useUserStore((s) => s.loadUser);
  const loadAuthState = useAuthStore((s) => s.loadAuthState);
  const [isReady, setIsReady] = useState(false);

  useWorkoutNotification();

  useEffect(() => {
    async function init() {
      try {
        console.log('=== App Initialization Started ===');

        await loadAuthState();
        console.log('Auth state loaded');

        await initDatabase();
        console.log('Database initialized');

        await CloudSyncService.restoreFromCloudIfLocalEmpty();

        await loadUser();
        console.log('User loaded');

        console.log('=== App Initialization Completed ===');
      } catch (e) {
        console.error("=== Initialization failed ===", e);
        useAlertStore.getState().showAlert('Initialization Error', 'Failed to start the app. Please restart.');
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync().catch(() => { });
      }
    }
    init();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="programs" />
        <Stack.Screen name="notes" />
      </Stack>
      <GlobalAlert />
    </>
  );
}

