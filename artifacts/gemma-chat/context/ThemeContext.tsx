import React, { createContext, useCallback, useContext, useState } from "react";
import { useColorScheme } from "react-native";

export type Theme = "light" | "dark" | "system";

export type ThemeColors = {
  background: string;
  surface: string;
  primary: string;
  text: string;
  textSecondary: string;
  bubble: {
    user: string;
    assistant: string;
    userText: string;
    assistantText: string;
  };
  border: string;
  inputBackground: string;
  statusBar: "light-content" | "dark-content";
};

const lightColors: ThemeColors = {
  background: "#FFFFFF",
  surface: "#F5F5F5",
  primary: "#1A73E8",
  text: "#1A1A1A",
  textSecondary: "#666666",
  bubble: {
    user: "#1A73E8",
    assistant: "#F0F0F0",
    userText: "#FFFFFF",
    assistantText: "#1A1A1A",
  },
  border: "#E0E0E0",
  inputBackground: "#F5F5F5",
  statusBar: "dark-content",
};

const darkColors: ThemeColors = {
  background: "#1A1A1A",
  surface: "#2A2A2A",
  primary: "#4A9EFF",
  text: "#FFFFFF",
  textSecondary: "#AAAAAA",
  bubble: {
    user: "#4A9EFF",
    assistant: "#2A2A2A",
    userText: "#FFFFFF",
    assistantText: "#FFFFFF",
  },
  border: "#333333",
  inputBackground: "#2A2A2A",
  statusBar: "light-content",
};

type ThemeContextValue = {
  theme: Theme;
  colors: ThemeColors;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>("system");

  const isDark =
    theme === "dark" || (theme === "system" && systemScheme === "dark");

  const colors = isDark ? darkColors : lightColors;

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      if (prev === "system") return "dark";
      if (prev === "dark") return "light";
      return "system";
    });
  }, []);

  return (
    <ThemeContext.Provider
      value={{ theme, colors, isDark, setTheme, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return ctx;
}
