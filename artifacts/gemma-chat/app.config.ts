import type { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const devDomain = process.env.EXPO_PUBLIC_DOMAIN;
  const originPort = process.env.EXPO_PUBLIC_ORIGIN_PORT;
  const portSuffix = originPort ? `:${originPort}` : "";
  const origin = devDomain ? `https://${devDomain}${portSuffix}` : "https://replit.com/";

  return {
    ...config,
    name: "Gemma Offline Chat",
    slug: "gemma-chat",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "gemma-chat",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/icon.png",
      resizeMode: "contain",
      backgroundColor: "#0a0a0b",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.devarajrdx9.gemmachat",
      // deploymentTarget: "16.0",
      infoPlist: {
        NSMicrophoneUsageDescription:
          "Used for voice input to chat with Gemma AI",
        NSDocumentsFolderUsageDescription:
          "Used to store downloaded GGUF model files",
      },
    },
    android: {
      package: "com.devarajrdx9.gemmachat",
      // minSdkVersion: 26,
      // compileSdkVersion: 35,
      // targetSdkVersion: 35,
      permissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.INTERNET",
      ],
    },
    plugins: [
      [
        "expo-router",
        { origin },
      ],
      "expo-font",
      "expo-web-browser",
      [
        "expo-build-properties",
        {
          android: {
            // minSdkVersion: 26,
            // compileSdkVersion: 35,
            // targetSdkVersion: 35,
            buildToolsVersion: "35.0.0",
            kotlinVersion: "2.0.21",
            packagingOptions: {
              pickFirst: [
                "**/libllama.so",
                "**/libwhisper.so",
                "**/libc++_shared.so",
                "**/libgomp-52d2c847.so.1",
              ],
            },
            enableDangerousExperimentalLeanBuilds: false,
          },
          ios: {
            // deploymentTarget: "16.0",
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      eas: {
        projectId: "236cb843-b9d8-46f7-986a-9dfb08ad835e",
      },
    },
    owner: "devarajrdx9",
  };
};
