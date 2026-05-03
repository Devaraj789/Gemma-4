/**
 * Root Layout — Gemma Offline Chat
 * FIXES:
 * 1. Removed react-native-keyboard-controller (KeyboardProvider) → crashes Huawei Android 8-9
 * 2. Removed useFonts / @expo-google-fonts → blocks JS thread, freeze on old devices
 * 3. GestureHandlerRootView moved to outermost (correct order)
 * 4. App renders immediately — zero loading gate
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";

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

export default function RootLayout() {
  // Render immediately — no font loading gate, no keyboard controller
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <SettingsProvider>
                <ModelProvider>
                  <ChatProvider>
                    <RootLayoutNav />
                  </ChatProvider>
                </ModelProvider>
              </SettingsProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});