import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import React, { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  Animated,
  Image,
  StyleSheet,
  View,
  ActivityIndicator,
} from "react-native";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ChatProvider } from "@/context/ChatContext";
import { ModelProvider } from "@/context/ModelContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { ThemeProvider } from "@/context/ThemeContext";

// NOTE: We intentionally do NOT call SplashScreen.preventAutoHideAsync().
// That API caused the installed APK to freeze because the JS bundle takes
// time to evaluate on device — keeping the native splash open indefinitely.
// Instead we let the native splash auto-dismiss, then show our own React
// Native loading screen while custom fonts finish loading. This is 100%
// reliable across all Android versions and New Architecture.

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

/** Shown while Inter fonts are loading — pure React Native, no native API. */
function AppLoadingScreen({ visible }: { visible: boolean }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, opacity]);

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.splash, { opacity }]}
      pointerEvents={visible ? "auto" : "none"}
    >
      <Image
        source={require("../assets/images/icon.png")}
        style={styles.splashIcon}
        resizeMode="contain"
      />
      <ActivityIndicator
        size="small"
        color="#3b82f6"
        style={styles.splashSpinner}
      />
    </Animated.View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const fontsReady = fontsLoaded || !!fontError;

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
                      {/* Always render nav so the JS tree is ready */}
                      <RootLayoutNav />
                      {/* Overlay our own loading screen until fonts are done */}
                      <AppLoadingScreen visible={!fontsReady} />
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
  splash: {
    backgroundColor: "#0a0a0b",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  splashIcon: {
    width: 120,
    height: 120,
  },
  splashSpinner: {
    marginTop: 32,
  },
});
