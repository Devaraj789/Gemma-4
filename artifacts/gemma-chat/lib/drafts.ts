import AsyncStorage from "@react-native-async-storage/async-storage";

const DRAFT_PREFIX = "@gemma/draft_";

export async function saveDraft(convId: string, text: string): Promise<void> {
  try {
    if (text.trim()) {
      await AsyncStorage.setItem(DRAFT_PREFIX + convId, text);
    } else {
      await AsyncStorage.removeItem(DRAFT_PREFIX + convId);
    }
  } catch {}
}

export async function loadDraft(convId: string): Promise<string> {
  try {
    return (await AsyncStorage.getItem(DRAFT_PREFIX + convId)) ?? "";
  } catch {
    return "";
  }
}

export async function clearDraft(convId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(DRAFT_PREFIX + convId);
  } catch {}
}
