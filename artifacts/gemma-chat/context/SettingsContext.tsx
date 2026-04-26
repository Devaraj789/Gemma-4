import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { StorageKeys, loadJSON, saveJSON } from "@/lib/storage";

export type Settings = {
  temperature: number;
  topK: number;
  topP: number;
  maxTokens: number;
  systemPrompt: string;
  haptics: boolean;
};

const DEFAULT_SETTINGS: Settings = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxTokens: 512,
  systemPrompt:
    "You are a helpful, concise on-device assistant running entirely offline. Be friendly and clear.",
  haptics: true,
};

type SettingsContextValue = {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
  resetSettings: () => void;
  ready: boolean;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const stored = await loadJSON<Settings>(
        StorageKeys.SETTINGS,
        DEFAULT_SETTINGS,
      );
      if (!mounted) return;
      setSettings({ ...DEFAULT_SETTINGS, ...stored });
      setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      void saveJSON(StorageKeys.SETTINGS, next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    void saveJSON(StorageKeys.SETTINGS, DEFAULT_SETTINGS);
  }, []);

  return (
    <SettingsContext.Provider
      value={{ settings, updateSettings, resetSettings, ready }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used inside SettingsProvider");
  }
  return ctx;
}
