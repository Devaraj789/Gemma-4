import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  CONVERSATIONS: "@gemma/conversations",
  ACTIVE_CONVERSATION: "@gemma/active_conversation",
  SETTINGS: "@gemma/settings",
  ACTIVE_MODEL: "@gemma/active_model",
  DOWNLOADED_MODELS: "@gemma/downloaded_models",
} as const;

export const StorageKeys = KEYS;

export async function loadJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function saveJSON<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silently fail — storage is non-critical
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // ignore
  }
}
