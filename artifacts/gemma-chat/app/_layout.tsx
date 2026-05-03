import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback, useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ChatProvider } from "@/context/ChatContext";
import { ModelProvider } from "@/context/ModelContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { ThemeProvider } from "@/context/ThemeContext";

// Keep the splash visible while we load resources.
// Must be called as early as possible, before any rendering.
SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient();

// If fonts haven't loaded in 3 seconds, force-dismiss the splash anyway.
const SPLASH_TIMEOUT_MS = 3000;

const MODAL_OPTIONS = {
  presentation: "modal" as const,
  animation: "slide_from_bottom" as const,
};

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="models"         options={MODAL_OPTIONS} />
      <Stack.Screen name="settings"       options={MODAL_OPTIONS} />
      <Stack.Screen name="history"        options={MODAL_OPTIONS} />
      <Stack.Screen name="storage"        options={MODAL_OPTIONS} />
      <Stack.Screen name="stats"          options={MODAL_OPTIONS} />
      <Stack.Screen name="saved"          options={MODAL_OPTIONS} />
      <Stack.Screen name="language"       options={MODAL_OPTIONS} />
      <Stack.Screen name="network-check"  options={MODAL_OPTIONS} />
      <Stack.Screen name="privacy"        options={MODAL_OPTIONS} />
      <Stack.Screen name="feedback"       options={MODAL_OPTIONS} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [ready, setReady] = useState(false);

  const hideSplash = useCallback(async () => {
    if (ready) return;
    setReady(true);
    try {
      await SplashScreen.hideAsync();
    } catch {
      // already hidden or not shown — safe to ignore
    }
  }, [ready]);

  // Force-dismiss after SPLASH_TIMEOUT_MS even if fonts are stuck
  useEffect(() => {
    const timer = setTimeout(() => { void hideSplash(); }, SPLASH_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Dismiss as soon as fonts are done (success or error)
  useEffect(() => {
    if (fontsLoaded || fontError) { void hideSplash(); }
  }, [fontsLoaded, fontError, hideSplash]);

  // Show nothing (splash is still visible) until fonts are ready or timeout fired
  if (!ready && !fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary onError={() => { void SplashScreen.hideAsync().catch(() => {}); }}>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={styles.flex}>
            <KeyboardProvider>
              <ThemeProvider>
                <SettingsProvider>
                  <ModelProvider>
                    <ChatProvider>
                      <RootLayoutNav />
                    </ChatProvider>
                  </ModelProvider>
                </SettingsProvider>
              </ThemeProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
