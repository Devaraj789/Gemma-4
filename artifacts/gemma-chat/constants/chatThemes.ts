export type ChatTheme = {
  id: string;
  name: string;
  lightBg: string;
  darkBg: string;
  emoji: string;
};

export const CHAT_THEMES: ChatTheme[] = [
  { id: "default",   name: "Default",     lightBg: "transparent", darkBg: "transparent", emoji: "⬜" },
  { id: "navy",      name: "Deep Blue",   lightBg: "#e8f0fe",     darkBg: "#0d1b2a",     emoji: "🌊" },
  { id: "sepia",     name: "Sepia",       lightBg: "#fdf6ec",     darkBg: "#1a1208",     emoji: "📜" },
  { id: "forest",    name: "Forest",      lightBg: "#edf7ed",     darkBg: "#0a1a0a",     emoji: "🌿" },
  { id: "midnight",  name: "Midnight",    lightBg: "#f0ebff",     darkBg: "#0a0010",     emoji: "🌙" },
  { id: "rose",      name: "Rose",        lightBg: "#fff0f3",     darkBg: "#1a0008",     emoji: "🌸" },
  { id: "graphite",  name: "Graphite",    lightBg: "#f5f5f5",     darkBg: "#111111",     emoji: "🪨" },
];

export function getThemeBg(themeId: string, isDark: boolean): string {
  const theme = CHAT_THEMES.find((t) => t.id === themeId) ?? CHAT_THEMES[0];
  const bg = isDark ? theme.darkBg : theme.lightBg;
  return bg === "transparent" ? "" : bg;
}
