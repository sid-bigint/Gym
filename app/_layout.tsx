import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, Alert } from "react-native";
import { initDatabase } from "../src/db/database";
import { useUserStore } from "../src/store/useUserStore";
import { useAuthStore } from "../src/store/useAuthStore";
import { AlertProvider } from "../src/context/AlertContext";
import { CustomAlert } from "../src/components/CustomAlert";

export default function RootLayout() {
  const loadUser = useUserStore((s) => s.loadUser);
  const loadAuthState = useAuthStore((s) => s.loadAuthState);
  const [isReady, setIsReady] = useState(false);
  const [loadingStep, setLoadingStep] = useState('Starting options...');

  useEffect(() => {
    async function init() {
      try {
        console.log('=== App Initialization Started ===');

        setLoadingStep('Loading settings...');
        await loadAuthState();
        console.log('Auth state loaded');

        setLoadingStep('Initializing database...');
        // Add a small timeout to allow UI to render the text
        await new Promise(r => setTimeout(r, 100));
        await initDatabase();
        console.log('Database initialized');

        setLoadingStep('Loading user profile...');
        await loadUser();
        console.log('User loaded');

        console.log('=== App Initialization Completed ===');
      } catch (e) {
        console.error("=== Initialization failed ===", e);
        Alert.alert('Initialization Error', 'Failed to start the app. Please restart.');
      } finally {
        setIsReady(true);
      }
    }
    init();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0A0F', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={{ color: '#fff', marginTop: 16, fontSize: 16 }}>{loadingStep}</Text>
      </View>
    );
  }

  return (
    <AlertProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="programs" />
      </Stack>
      <CustomAlert />
    </AlertProvider>
  );
}

