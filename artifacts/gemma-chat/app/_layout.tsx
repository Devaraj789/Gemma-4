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
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ChatProvider } from "@/context/ChatContext";
import { ModelProvider } from "@/context/ModelContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { ThemeProvider } from "@/context/ThemeContext";

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

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

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView>
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
