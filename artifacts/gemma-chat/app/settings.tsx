import { Feather } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useChat } from "@/context/ChatContext";
import { useSettings } from "@/context/SettingsContext";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { INFERENCE_ENGINE_INFO } from "@/lib/inference";

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const colors = useColors();
  const dec = () => onChange(Math.max(min, Number((value - step).toFixed(2))));
  const inc = () => onChange(Math.min(max, Number((value + step).toFixed(2))));
  const display = format ? format(value) : value.toString();
  return (
    <View style={sliderStyles.wrap}>
      <View style={sliderStyles.row}>
        <Text style={[sliderStyles.label, { color: colors.foreground }]}>{label}</Text>
        <Text style={[sliderStyles.value, { color: colors.mutedForeground }]}>{display}</Text>
      </View>
      <View style={sliderStyles.controls}>
        <Pressable onPress={dec} style={({ pressed }) => [sliderStyles.btn, { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 }]}>
          <Feather name="minus" size={16} color={colors.foreground} />
        </Pressable>
        <View style={[sliderStyles.track, { backgroundColor: colors.muted }]}>
          <View style={[sliderStyles.fill, { backgroundColor: colors.primary, width: `${((value - min) / (max - min)) * 100}%` }]} />
        </View>
        <Pressable onPress={inc} style={({ pressed }) => [sliderStyles.btn, { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 }]}>
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

const TAMIL_PROMPT =
  "நீங்கள் ஒரு உதவிகரமான AI உதவியாளர். தமிழிலும் ஆங்கிலத்திலும் பேசலாம். கேள்விகளுக்கு தெளிவாகவும் சுருக்கமாகவும் பதில் சொல்லுங்கள்.";
const ENGLISH_PROMPT =
  "You are a helpful, concise on-device assistant running entirely offline. Be friendly and clear.";
const CODER_PROMPT =
  "You are an expert coding assistant. Explain code clearly, suggest improvements, and write clean, well-commented code. Prefer concise answers.";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, resetSettings } = useSettings();
  const { clearAll, exportConversations } = useChat();
  const { theme, setTheme, isDark } = useTheme();
  const [showPromptPresets, setShowPromptPresets] = useState(false);

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
    Alert.alert("Reset settings?", "Restore default values for all controls.", [
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
        a.href = url;
        a.download = "gemma-chats.txt";
        a.click();
        return;
      }
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("Sharing not available on this device");
        return;
      }
      const path = (FileSystem.documentDirectory ?? "") + "gemma-chats.txt";
      await FileSystem.writeAsStringAsync(path, text);
      await Sharing.shareAsync(path, {
        mimeType: "text/plain",
        dialogTitle: "Export Conversations",
      });
    } catch (e) {
      Alert.alert("Export failed", e instanceof Error ? e.message : "Unknown error");
    }
  };

  const themeOptions: { value: "light" | "dark" | "system"; label: string; icon: "sun" | "moon" | "smartphone" }[] = [
    { value: "light", label: "Light", icon: "sun" },
    { value: "dark", label: "Dark", icon: "moon" },
    { value: "system", label: "Auto", icon: "smartphone" },
  ];

  const fontSizeOptions: { value: "small" | "medium" | "large"; label: string }[] = [
    { value: "small", label: "Small" },
    { value: "medium", label: "Medium" },
    { value: "large", label: "Large" },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === "web" ? Math.max(insets.top, 16) + 6 : insets.top + 6,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={8} style={({ pressed }) => [styles.iconBtn, { backgroundColor: pressed ? colors.muted : "transparent" }]}>
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Platform.OS === "web" ? Math.max(insets.bottom, 24) + 16 : insets.bottom + 24,
        }}
      >
        {/* APPEARANCE */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>Theme</Text>
            <View style={styles.segmentGroup}>
              {themeOptions.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setTheme(opt.value)}
                  style={[styles.segmentBtn, { backgroundColor: theme === opt.value ? colors.primary : colors.secondary }]}
                >
                  <Feather name={opt.icon} size={13} color={theme === opt.value ? colors.primaryForeground : colors.mutedForeground} />
                  <Text style={[styles.segmentText, { color: theme === opt.value ? colors.primaryForeground : colors.mutedForeground }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>Font size</Text>
            <View style={styles.segmentGroup}>
              {fontSizeOptions.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => updateSettings({ fontSize: opt.value })}
                  style={[styles.segmentBtn, { backgroundColor: settings.fontSize === opt.value ? colors.primary : colors.secondary }]}
                >
                  <Text style={[styles.segmentText, { color: settings.fontSize === opt.value ? colors.primaryForeground : colors.mutedForeground }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* GENERATION */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 24 }]}>GENERATION</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Slider label="Temperature" value={settings.temperature} min={0} max={2} step={0.1} format={(v) => v.toFixed(1)} onChange={(v) => updateSettings({ temperature: v })} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Slider label="Top K" value={settings.topK} min={1} max={100} step={1} onChange={(v) => updateSettings({ topK: v })} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Slider label="Top P" value={settings.topP} min={0} max={1} step={0.05} format={(v) => v.toFixed(2)} onChange={(v) => updateSettings({ topP: v })} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Slider label="Max tokens" value={settings.maxTokens} min={64} max={2048} step={64} onChange={(v) => updateSettings({ maxTokens: v })} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Slider label="Context length" value={settings.contextLength} min={512} max={8192} step={512} format={(v) => `${v}`} onChange={(v) => updateSettings({ contextLength: v })} />
        </View>

        {/* SYSTEM PROMPT */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 24 }]}>SYSTEM PROMPT</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 14 }]}>
          <Pressable onPress={() => setShowPromptPresets((p) => !p)} style={styles.presetToggle}>
            <Feather name="layers" size={14} color={colors.primary} />
            <Text style={[styles.presetToggleText, { color: colors.primary }]}>Presets</Text>
            <Feather name={showPromptPresets ? "chevron-up" : "chevron-down"} size={14} color={colors.primary} />
          </Pressable>
          {showPromptPresets && (
            <View style={styles.presetRow}>
              {[
                { label: "🇮🇳 Tamil AI", prompt: TAMIL_PROMPT },
                { label: "🇬🇧 English", prompt: ENGLISH_PROMPT },
                { label: "💻 Coder", prompt: CODER_PROMPT },
              ].map((p) => (
                <Pressable
                  key={p.label}
                  onPress={() => { updateSettings({ systemPrompt: p.prompt }); setShowPromptPresets(false); }}
                  style={[styles.presetChip, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                >
                  <Text style={[styles.presetChipText, { color: colors.foreground }]}>{p.label}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <TextInput
            value={settings.systemPrompt}
            onChangeText={(t) => updateSettings({ systemPrompt: t })}
            multiline
            placeholder="Tell the model how to behave…"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.systemInput, { color: colors.foreground, backgroundColor: colors.secondary, minHeight: 100 }]}
          />
        </View>

        {/* PREFERENCES */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 24 }]}>PREFERENCES</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.toggleTitle, { color: colors.foreground }]}>Haptic feedback</Text>
              <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>Light buzz when sending messages.</Text>
            </View>
            <Switch
              value={settings.haptics}
              onValueChange={(v) => updateSettings({ haptics: v })}
              trackColor={{ false: colors.muted, true: colors.primary }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={{ paddingVertical: 4 }}>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleTitle, { color: colors.foreground }]}>Auto-delete chats</Text>
                <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>
                  {settings.autoDeleteDays === 0
                    ? "Never delete automatically"
                    : `Delete conversations older than ${settings.autoDeleteDays} days`}
                </Text>
              </View>
            </View>
            <Slider
              label=""
              value={settings.autoDeleteDays}
              min={0}
              max={90}
              step={7}
              format={(v) => (v === 0 ? "Never" : `${v} days`)}
              onChange={(v) => updateSettings({ autoDeleteDays: v })}
            />
          </View>
        </View>

        {/* DATA */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 24 }]}>DATA</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable onPress={() => void handleExport()} style={({ pressed }) => [styles.actionRow, { opacity: pressed ? 0.7 : 1 }]}>
            <Feather name="share" size={18} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>Export conversations</Text>
          </Pressable>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Pressable onPress={handleClearChats} style={({ pressed }) => [styles.actionRow, { opacity: pressed ? 0.7 : 1 }]}>
            <Feather name="trash-2" size={18} color={colors.destructive} />
            <Text style={[styles.actionText, { color: colors.destructive }]}>Delete all conversations</Text>
          </Pressable>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Pressable onPress={handleReset} style={({ pressed }) => [styles.actionRow, { opacity: pressed ? 0.7 : 1 }]}>
            <Feather name="refresh-ccw" size={18} color={colors.foreground} />
            <Text style={[styles.actionText, { color: colors.foreground }]}>Reset settings to defaults</Text>
          </Pressable>
        </View>

        {/* ABOUT */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 24 }]}>ABOUT</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 14, gap: 10 }]}>
          <Text style={[styles.aboutText, { color: colors.foreground }]}>Gemma Offline Chat</Text>
          <Text style={[styles.aboutSub, { color: colors.mutedForeground }]}>{INFERENCE_ENGINE_INFO}</Text>
          <Text style={[styles.aboutSub, { color: colors.mutedForeground }]}>
            Conversations and downloaded models stay on this device. {isDark ? "🌙 Dark mode" : "☀️ Light mode"} active.
          </Text>
        </View>
      </ScrollView>
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
  sectionTitle: { fontSize: 11.5, fontFamily: "Inter_600SemiBold", letterSpacing: 0.6, marginBottom: 8, paddingHorizontal: 4 },
  card: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 14 },
  divider: { height: StyleSheet.hairlineWidth },
  systemInput: {
    fontSize: 14.5, lineHeight: 20, fontFamily: "Inter_400Regular",
    padding: 12, borderRadius: 12, textAlignVertical: "top", marginTop: 8,
  },
  toggleRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  toggleTitle: { fontSize: 14.5, fontFamily: "Inter_500Medium" },
  toggleSub: { fontSize: 12.5, fontFamily: "Inter_400Regular", marginTop: 2 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
  actionText: { fontSize: 14.5, fontFamily: "Inter_500Medium" },
  aboutText: { fontSize: 14.5, fontFamily: "Inter_600SemiBold" },
  aboutSub: { fontSize: 12.5, lineHeight: 18, fontFamily: "Inter_400Regular" },
  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14 },
  settingLabel: { fontSize: 14.5, fontFamily: "Inter_500Medium" },
  segmentGroup: { flexDirection: "row", gap: 6 },
  segmentBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  segmentText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  presetToggle: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8 },
  presetToggleText: { fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1 },
  presetRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", paddingBottom: 10 },
  presetChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  presetChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
});
