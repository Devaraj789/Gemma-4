import AsyncStorage from "@react-native-async-storage/async-storage";

export type SavedMessage = {
  id: string;
  convId: string;
  convTitle: string;
  role: "user" | "assistant";
  content: string;
  savedAt: number;
};

const KEY = "@gemma/saved_messages";

export async function getSavedMessages(): Promise<SavedMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedMessage[]) : [];
  } catch {
    return [];
  }
}

export async function saveMessage(msg: SavedMessage): Promise<void> {
  const existing = await getSavedMessages();
  if (existing.find((m) => m.id === msg.id)) return;
  await AsyncStorage.setItem(KEY, JSON.stringify([msg, ...existing]));
}

export async function unsaveMessage(id: string): Promise<void> {
  const existing = await getSavedMessages();
  await AsyncStorage.setItem(KEY, JSON.stringify(existing.filter((m) => m.id !== id)));
}

export async function isMessageSaved(id: string): Promise<boolean> {
  const existing = await getSavedMessages();
  return existing.some((m) => m.id === id);
}

export async function clearAllSaved(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
