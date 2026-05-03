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

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={styles.flex}>
            <ThemeProvider>
              <SettingsProvider>
                <ModelProvider>
                  <ChatProvider>
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
                  </ChatProvider>
                </ModelProvider>
              </SettingsProvider>
            </ThemeProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
