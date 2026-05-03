import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Image, StyleSheet, View, ActivityIndicator } from "react-native";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ChatProvider } from "@/context/ChatContext";
import { ModelProvider } from "@/context/ModelContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { ThemeProvider } from "@/context/ThemeContext";

const queryClient = new QueryClient();

const MODAL_OPTIONS = {
  presentation: "modal" as const,
  animation: "slide_from_bottom" as const,
};

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="models"        options={MODAL_OPTIONS} />
      <Stack.Screen name="settings"      options={MODAL_OPTIONS} />
      <Stack.Screen name="history"       options={MODAL_OPTIONS} />
      <Stack.Screen name="storage"       options={MODAL_OPTIONS} />
      <Stack.Screen name="stats"         options={MODAL_OPTIONS} />
      <Stack.Screen name="saved"         options={MODAL_OPTIONS} />
      <Stack.Screen name="language"      options={MODAL_OPTIONS} />
      <Stack.Screen name="network-check" options={MODAL_OPTIONS} />
      <Stack.Screen name="privacy"       options={MODAL_OPTIONS} />
      <Stack.Screen name="feedback"      options={MODAL_OPTIONS} />
    </Stack>
  );
}

/**
 * Pure React Native loading screen — zero native module dependencies.
 * Rendered OUTSIDE all providers so it can never be blocked by a
 * provider hang/crash.
 */
function LoadingScreen() {
  return (
    <View style={styles.loadingRoot}>
      <Image
        source={require("../assets/images/icon.png")}
        style={styles.loadingIcon}
        resizeMode="contain"
      />
      <ActivityIndicator size="small" color="#3b82f6" style={styles.loadingSpinner} />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Hard 3-second deadline — if fonts haven't resolved by then, proceed anyway.
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => setTimedOut(true), 3000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const fontsReady = fontsLoaded || !!fontError || timedOut;

  // ── CRITICAL: return loading screen BEFORE mounting any providers/native ──
  // This guarantees it renders even if a provider or native module hangs.
  if (!fontsReady) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
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
  loadingRoot: {
    flex: 1,
    backgroundColor: "#0a0a0b",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingIcon: {
    width: 120,
    height: 120,
  },
  loadingSpinner: {
    marginTop: 32,
  },
});
