import { Feather } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PromptLibrarySheet } from "@/components/PromptLibrarySheet";
import { useChat } from "@/context/ChatContext";
import { useSettings } from "@/context/SettingsContext";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { INFERENCE_ENGINE_INFO } from "@/lib/inference";

function Slider({
  label, value, min, max, step, format, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number;
  format?: (v: number) => string; onChange: (v: number) => void;
}) {
  const colors = useColors();
  const dec = () => onChange(Math.max(min, Number((value - step).toFixed(2))));
  const inc = () => onChange(Math.min(max, Number((value + step).toFixed(2))));
  return (
    <View style={sliderStyles.wrap}>
      <View style={sliderStyles.row}>
        <Text style={[sliderStyles.label, { color: colors.foreground }]}>{label}</Text>
        <Text style={[sliderStyles.value, { color: colors.mutedForeground }]}>
          {format ? format(value) : value}
        </Text>
      </View>
      <View style={sliderStyles.controls}>
        <Pressable
          onPress={dec}
          style={({ pressed }) => [sliderStyles.btn, { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="minus" size={16} color={colors.foreground} />
        </Pressable>
        <View style={[sliderStyles.track, { backgroundColor: colors.muted }]}>
          <View style={[sliderStyles.fill, { backgroundColor: colors.primary, width: `${((value - min) / (max - min)) * 100}%` }]} />
        </View>
        <Pressable
          onPress={inc}
          style={({ pressed }) => [sliderStyles.btn, { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="plus" size={16} color={colors.foreground} />
        </Pressable>
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  wrap: { gap: 10, paddingVertical: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 14.5, fontFamily: "Inter_500Medium" },
  value: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  controls: { flexDirection: "row", alignItems: "center", gap: 12 },
  btn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%" },
});

const APP_VERSION = "1.0.0";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, resetSettings } = useSettings();
  const { clearAll, exportConversations, conversations } = useChat();
  const { theme, setTheme } = useTheme();
  const [promptLibOpen, setPromptLibOpen] = useState(false);

  const totalMessages = conversations.reduce((s, c) => s + c.messages.length, 0);

  const themeOptions: { value: "light" | "dark" | "system"; label: string; icon: "sun" | "moon" | "smartphone" }[] = [
    { value: "light", label: "Light", icon: "sun" },
    { value: "dark", label: "Dark", icon: "moon" },
    { value: "system", label: "Auto", icon: "smartphone" },
  ];

  const fontSizeOptions: { value: "small" | "medium" | "large"; label: string }[] = [
    { value: "small", label: "S" },
    { value: "medium", label: "M" },
    { value: "large", label: "L" },
  ];

  const handleClearChats = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Delete all conversations? This cannot be undone.")) clearAll();
      return;
    }
    Alert.alert("Delete all conversations?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => clearAll() },
    ]);
  };

  const handleReset = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Reset all settings to defaults?")) resetSettings();
      return;
    }
    Alert.alert("Reset settings?", "Restore default values for all settings.", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: () => resetSettings() },
    ]);
  };

  const handleExport = async () => {
    try {
      const text = await exportConversations();
      if (Platform.OS === "web") {
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "gemma-chats.txt"; a.click();
        return;
      }
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) { Alert.alert("Sharing not available on this device"); return; }
      const path = (FileSystem.documentDirectory ?? "") + "gemma-chats.txt";
      await FileSystem.writeAsStringAsync(path, text);
      await Sharing.shareAsync(path, { mimeType: "text/plain", dialogTitle: "Export Conversations" });
    } catch (e) {
      Alert.alert("Export failed", e instanceof Error ? e.message : "Unknown error");
    }
  };

  const activePreset = [
    { label: "Tamil AI", emoji: "🇮🇳", prompt: "நீங்கள் ஒரு உதவிகரமான AI உதவியாளர்." },
    { label: "English", emoji: "🇬🇧", prompt: "You are a helpful, concise on-device assistant running entirely offline. Be friendly and clear." },
    { label: "Coder", emoji: "💻", prompt: "You are an expert coding assistant." },
    { label: "Teacher", emoji: "📚", prompt: "You are a patient and encouraging teacher." },
    { label: "Doctor", emoji: "🩺", prompt: "You are a medical information assistant." },
    { label: "Creative", emoji: "🎨", prompt: "You are a creative writing partner." },
    { label: "Debate", emoji: "⚖️", prompt: "You are a debate partner." },
    { label: "Tamil Poet", emoji: "🌸", prompt: "நீங்கள் ஒரு தமிழ் கவிஞர்." },
    { label: "Strict", emoji: "🎯", prompt: "You are a precise, no-nonsense assistant." },
  ].find((p) => settings.systemPrompt.startsWith(p.prompt.substring(0, 30)));

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === "web" ? Math.max(insets.top, 16) + 6 : insets.top + 6,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => [styles.iconBtn, { backgroundColor: pressed ? colors.muted : "transparent" }]}
        >
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingBottom: Platform.OS === "web" ? Math.max(insets.bottom, 24) + 16 : insets.bottom + 32,
        }}
      >

        {/* APP IDENTITY CARD */}
        <View style={styles.section}>
          <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.appIconCircle, { backgroundColor: colors.primary }]}>
              <Feather name="cpu" size={28} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.appName, { color: colors.foreground }]}>Gemma Offline Chat</Text>
              <Text style={[styles.appSub, { color: colors.mutedForeground }]}>
                Offline AI · Powered by MediaPipe
              </Text>
            </View>
            <View style={[styles.offlineBadge, { backgroundColor: colors.success + "20" }]}>
              <Feather name="wifi-off" size={12} color={colors.success} />
              <Text style={[styles.offlineBadgeText, { color: colors.success }]}>Offline</Text>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Model Engine</Text>
              <Text style={[styles.rowValue, { color: colors.mutedForeground }]} numberOfLines={1}>
                {INFERENCE_ENGINE_INFO.split("·")[0].trim()}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Conversations</Text>
              <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>
                {conversations.length} chats · {totalMessages} messages
              </Text>
            </View>
          </View>
        </View>

        {/* APPEARANCE */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>APPEARANCE</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Theme</Text>
              <View style={[styles.segmentGroup, { backgroundColor: colors.secondary }]}>
                {themeOptions.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => setTheme(opt.value)}
                    style={[
                      styles.segmentBtn,
                      { backgroundColor: theme === opt.value ? colors.primary : "transparent" },
                    ]}
                  >
                    <Feather
                      name={opt.icon}
                      size={13}
                      color={theme === opt.value ? colors.primaryForeground : colors.mutedForeground}
                    />
                    <Text
                      style={[
                        styles.segmentText,
                        { color: theme === opt.value ? colors.primaryForeground : colors.mutedForeground },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.settingRow}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Font Size</Text>
              <View style={[styles.segmentGroup, { backgroundColor: colors.secondary }]}>
                {fontSizeOptions.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => updateSettings({ fontSize: opt.value })}
                    style={[
                      styles.segmentBtn,
                      { backgroundColor: settings.fontSize === opt.value ? colors.primary : "transparent" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: settings.fontSize === opt.value ? colors.primaryForeground : colors.mutedForeground },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* GENERATION */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>GENERATION</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, paddingHorizontal: 14 }]}>
            <Slider
              label="Temperature"
              value={settings.temperature}
              min={0} max={2} step={0.1}
              format={(v) => v.toFixed(1)}
              onChange={(v) => updateSettings({ temperature: v })}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Slider label="Top K" value={settings.topK} min={1} max={100} step={1} onChange={(v) => updateSettings({ topK: v })} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Slider
              label="Top P"
              value={settings.topP}
              min={0} max={1} step={0.05}
              format={(v) => v.toFixed(2)}
              onChange={(v) => updateSettings({ topP: v })}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Slider label="Max Tokens" value={settings.maxTokens} min={64} max={2048} step={64} onChange={(v) => updateSettings({ maxTokens: v })} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Slider
              label="Context Length"
              value={settings.contextLength}
              min={512} max={8192} step={512}
              format={(v) => `${v}`}
              onChange={(v) => updateSettings({ contextLength: v })}
            />
          </View>
        </View>

        {/* AI PERSONA / SYSTEM PROMPT */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>AI PERSONA</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable
              onPress={() => setPromptLibOpen(true)}
              style={({ pressed }) => [styles.navRow, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={[styles.rowIconWrap, { backgroundColor: colors.primary + "15" }]}>
                <Feather name="layers" size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Prompt Library</Text>
                <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                  {activePreset ? `${activePreset.emoji} ${activePreset.label} active` : "Browse & apply presets"}
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </Pressable>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={{ paddingVertical: 4, paddingHorizontal: 0 }}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginBottom: 6 }]}>CUSTOM SYSTEM PROMPT</Text>
              <TextInput
                value={settings.systemPrompt}
                onChangeText={(t) => updateSettings({ systemPrompt: t })}
                multiline
                placeholder="Tell the model how to behave…"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.systemInput,
                  { color: colors.foreground, backgroundColor: colors.secondary },
                ]}
              />
            </View>
          </View>
        </View>

        {/* PREFERENCES */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PREFERENCES</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable
              onPress={() => router.push("/saved")}
              style={({ pressed }) => [styles.navRow, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={[styles.rowIconWrap, { backgroundColor: "#f59e0b20" }]}>
                <Feather name="bookmark" size={16} color="#f59e0b" />
              </View>
              <Text style={[styles.rowLabel, { color: colors.foreground, flex: 1 }]}>Bookmarks</Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </Pressable>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Pressable
              onPress={() => router.push("/language")}
              style={({ pressed }) => [styles.navRow, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={[styles.rowIconWrap, { backgroundColor: "#6366f120" }]}>
                <Feather name="globe" size={16} color="#6366f1" />
              </View>
              <Text style={[styles.rowLabel, { color: colors.foreground, flex: 1 }]}>Select Language</Text>
              <Text style={[styles.rowValue, { color: colors.mutedForeground, marginRight: 6 }]}>
                {settings.language}
              </Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </Pressable>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Pressable
              onPress={() => router.push("/privacy")}
              style={({ pressed }) => [styles.navRow, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={[styles.rowIconWrap, { backgroundColor: "#22c55e20" }]}>
                <Feather name="shield" size={16} color="#22c55e" />
              </View>
              <Text style={[styles.rowLabel, { color: colors.foreground, flex: 1 }]}>Privacy & Data</Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </Pressable>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Pressable
              onPress={() => router.push("/network-check")}
              style={({ pressed }) => [styles.navRow, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={[styles.rowIconWrap, { backgroundColor: "#06b6d420" }]}>
                <Feather name="wifi" size={16} color="#06b6d4" />
              </View>
              <Text style={[styles.rowLabel, { color: colors.foreground, flex: 1 }]}>Network Check</Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </Pressable>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={{ paddingHorizontal: 0 }}>
              <View style={styles.navRow}>
                <View style={[styles.rowIconWrap, { backgroundColor: "#a855f720" }]}>
                  <Feather name="trash-2" size={16} color="#a855f7" />
                </View>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>Auto-delete Chats</Text>
                  <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                    {settings.autoDeleteDays === 0 ? "Never" : `After ${settings.autoDeleteDays} days`}
                  </Text>
                </View>
              </View>
              <Slider
                label=""
                value={settings.autoDeleteDays}
                min={0} max={90} step={7}
                format={(v) => (v === 0 ? "Never" : `${v} days`)}
                onChange={(v) => updateSettings({ autoDeleteDays: v })}
              />
            </View>
          </View>
        </View>

        {/* APP */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>APP</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable
              onPress={() => {
                Alert.alert("Rate App", "Thank you for using Gemma Offline Chat! Please rate us on the app store.");
              }}
              style={({ pressed }) => [styles.navRow, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={[styles.rowIconWrap, { backgroundColor: "#f59e0b20" }]}>
                <Feather name="star" size={16} color="#f59e0b" />
              </View>
              <Text style={[styles.rowLabel, { color: colors.foreground, flex: 1 }]}>Rate App</Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </Pressable>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Pressable
              onPress={() => void Linking.openURL("https://example.com/terms")}
              style={({ pressed }) => [styles.navRow, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={[styles.rowIconWrap, { backgroundColor: colors.primary + "15" }]}>
                <Feather name="file-text" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.foreground, flex: 1 }]}>Terms of Service</Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </Pressable>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Pressable
              onPress={() => void Linking.openURL("https://example.com/privacy")}
              style={({ pressed }) => [styles.navRow, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={[styles.rowIconWrap, { backgroundColor: "#22c55e20" }]}>
                <Feather name="lock" size={16} color="#22c55e" />
              </View>
              <Text style={[styles.rowLabel, { color: colors.foreground, flex: 1 }]}>Privacy Policy</Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </Pressable>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Pressable
              onPress={() => router.push("/feedback")}
              style={({ pressed }) => [styles.navRow, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={[styles.rowIconWrap, { backgroundColor: "#ec489920" }]}>
                <Feather name="message-circle" size={16} color="#ec4899" />
              </View>
              <Text style={[styles.rowLabel, { color: colors.foreground, flex: 1 }]}>Feedback</Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>

        {/* DATA */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DATA</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable
              onPress={() => router.push("/stats")}
              style={({ pressed }) => [styles.navRow, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={[styles.rowIconWrap, { backgroundColor: colors.primary + "15" }]}>
                <Feather name="bar-chart-2" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.foreground, flex: 1 }]}>View Statistics</Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </Pressable>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Pressable
              onPress={() => void handleExport()}
              style={({ pressed }) => [styles.navRow, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={[styles.rowIconWrap, { backgroundColor: "#6366f120" }]}>
                <Feather name="share" size={16} color="#6366f1" />
              </View>
              <Text style={[styles.rowLabel, { color: colors.foreground, flex: 1 }]}>Export Conversations</Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </Pressable>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Pressable
              onPress={() => router.push("/storage")}
              style={({ pressed }) => [styles.navRow, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={[styles.rowIconWrap, { backgroundColor: "#06b6d420" }]}>
                <Feather name="hard-drive" size={16} color="#06b6d4" />
              </View>
              <Text style={[styles.rowLabel, { color: colors.foreground, flex: 1 }]}>Manage Model Storage</Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </Pressable>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Pressable
              onPress={handleClearChats}
              style={({ pressed }) => [styles.navRow, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={[styles.rowIconWrap, { backgroundColor: colors.destructive + "15" }]}>
                <Feather name="trash-2" size={16} color={colors.destructive} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.destructive, flex: 1 }]}>Delete All Conversations</Text>
            </Pressable>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Pressable
              onPress={handleReset}
              style={({ pressed }) => [styles.navRow, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={[styles.rowIconWrap, { backgroundColor: colors.muted }]}>
                <Feather name="refresh-ccw" size={16} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.foreground, flex: 1 }]}>Reset Settings to Defaults</Text>
            </Pressable>
          </View>
        </View>

        {/* VERSION */}
        <Text style={[styles.versionText, { color: colors.mutedForeground }]}>
          Gemma Offline Chat v{APP_VERSION}
        </Text>

      </ScrollView>

      <PromptLibrarySheet visible={promptLibOpen} onClose={() => setPromptLibOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 17, fontFamily: "Inter_700Bold" },
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  section: { paddingHorizontal: 16, paddingTop: 24, gap: 8 },
  sectionLabel: { fontSize: 11.5, fontFamily: "Inter_600SemiBold", letterSpacing: 0.6 },
  card: { borderRadius: 16, borderWidth: 1 },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 8,
  },
  appIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 2 },
  appSub: { fontSize: 12.5, fontFamily: "Inter_400Regular" },
  offlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  offlineBadgeText: { fontSize: 11.5, fontFamily: "Inter_600SemiBold" },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { fontSize: 14.5, fontFamily: "Inter_500Medium" },
  rowValue: { fontSize: 13, fontFamily: "Inter_400Regular" },
  rowSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  segmentGroup: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  segmentBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  segmentText: { fontSize: 12.5, fontFamily: "Inter_600SemiBold" },
  systemInput: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
    padding: 12,
    borderRadius: 12,
    textAlignVertical: "top",
    minHeight: 90,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  versionText: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    paddingTop: 24,
    paddingBottom: 8,
  },
});
