import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSettings } from "@/context/SettingsContext";
import { useColors } from "@/hooks/useColors";

type Preset = {
  label: string;
  emoji: string;
  prompt: string;
  color: string;
  tags: string[];
  description: string;
};

const BUILT_IN_PRESETS: Preset[] = [
  {
    label: "Tamil AI", emoji: "🇮🇳", color: "#f97316", tags: ["language", "regional"],
    description: "Converse naturally in Tamil and English. Perfect for Tamil speakers who want bilingual AI assistance.",
    prompt: "நீங்கள் ஒரு உதவிகரமான AI உதவியாளர். தமிழிலும் ஆங்கிலத்திலும் பேசலாம். கேள்விகளுக்கு தெளிவாகவும் சுருக்கமாகவும் பதில் சொல்லுங்கள்.",
  },
  {
    label: "English Assistant", emoji: "🇬🇧", color: "#3b82f6", tags: ["general"],
    description: "A friendly, concise on-device assistant. Clear and helpful for everyday questions.",
    prompt: "You are a helpful, concise on-device assistant running entirely offline. Be friendly and clear.",
  },
  {
    label: "Coder", emoji: "💻", color: "#6366f1", tags: ["coding", "technical"],
    description: "Expert coding help. Explains code, suggests improvements, writes clean well-commented code.",
    prompt: "You are an expert coding assistant. Explain code clearly, suggest improvements, and write clean, well-commented code. Prefer concise answers.",
  },
  {
    label: "Teacher", emoji: "📚", color: "#22c55e", tags: ["education"],
    description: "Patient and encouraging. Breaks complex topics into simple steps with examples.",
    prompt: "You are a patient and encouraging teacher. Break down complex topics into simple steps. Use examples and analogies. Always check for understanding.",
  },
  {
    label: "Doctor", emoji: "🩺", color: "#06b6d4", tags: ["health", "medical"],
    description: "General health information assistant. Always reminds users to consult a licensed doctor.",
    prompt: "You are a medical information assistant. Provide general health information clearly. Always remind users to consult a licensed doctor for medical decisions.",
  },
  {
    label: "Creative Writer", emoji: "🎨", color: "#a855f7", tags: ["creative", "writing"],
    description: "Brainstorm ideas, write stories, poems, scripts, and creative content. Be imaginative.",
    prompt: "You are a creative writing partner. Help brainstorm ideas, write stories, poems, scripts, and creative content. Be imaginative and expressive.",
  },
  {
    label: "Debate Partner", emoji: "⚖️", color: "#f59e0b", tags: ["debate", "analysis"],
    description: "Well-reasoned arguments, multiple perspectives, and sharp critical thinking.",
    prompt: "You are a debate partner. Present well-reasoned arguments, consider multiple perspectives, and help sharpen critical thinking. Challenge ideas respectfully.",
  },
  {
    label: "Tamil Poet", emoji: "🌸", color: "#ec4899", tags: ["creative", "language", "regional"],
    description: "Beautiful Tamil poetry, songs, and literary content with emotional depth.",
    prompt: "நீங்கள் ஒரு தமிழ் கவிஞர். அழகான தமிழ் கவிதைகள், பாடல்கள், மற்றும் இலக்கியம் எழுதுவீர்கள். உணர்ச்சிகரமான மொழியில் பதில் சொல்லுங்கள்.",
  },
  {
    label: "Strict Mode", emoji: "🎯", color: "#64748b", tags: ["general", "technical"],
    description: "Precise, no-nonsense answers. Only the essential information, no small talk.",
    prompt: "You are a precise, no-nonsense assistant. Give only the essential information. No small talk, no padding. Be direct and factual.",
  },
];

const TEMPLATE_CATEGORIES = [
  "All", "general", "coding", "creative", "education",
  "language", "health", "analysis", "technical", "regional",
];

const TABS = ["My Presets", "Built-in", "Custom", "Templates"] as const;
type Tab = typeof TABS[number];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function PromptLibrarySheet({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();
  const [tab, setTab] = useState<Tab>("My Presets");
  const [filterTag, setFilterTag] = useState("All");
  const [customText, setCustomText] = useState(settings.systemPrompt);

  const activePreset = BUILT_IN_PRESETS.find(
    (p) => p.prompt === settings.systemPrompt,
  );

  const filteredTemplates =
    filterTag === "All"
      ? BUILT_IN_PRESETS
      : BUILT_IN_PRESETS.filter((p) => p.tags.includes(filterTag));

  const handleUse = (prompt: string) => {
    updateSettings({ systemPrompt: prompt });
    onClose();
  };

  const bottomPad = Platform.OS === "ios" ? insets.bottom : Math.max(insets.bottom, 16);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Dark overlay — tap to dismiss */}
      <Pressable style={styles.overlay} onPress={onClose} />

      {/* Sheet */}
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.background,
            paddingBottom: bottomPad,
          },
        ]}
      >
        {/* Drag handle */}
        <View style={styles.handleWrap}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
        </View>

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Prompt Library
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => [
              styles.closeBtn,
              { backgroundColor: pressed ? colors.muted : colors.secondary },
            ]}
          >
            <Feather name="x" size={18} color={colors.foreground} />
          </Pressable>
        </View>

        {/* Active preset banner */}
        {activePreset && (
          <View style={[styles.activeBanner, { backgroundColor: activePreset.color + "15", borderColor: activePreset.color + "40" }]}>
            <Text style={{ fontSize: 16 }}>{activePreset.emoji}</Text>
            <Text style={[styles.activeBannerText, { color: activePreset.color }]}>
              {activePreset.label} is active
            </Text>
            <Pressable onPress={() => updateSettings({ systemPrompt: "" })} hitSlop={8}>
              <Feather name="x" size={14} color={activePreset.color} />
            </Pressable>
          </View>
        )}

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.tabBar, { borderBottomColor: colors.border }]}
          contentContainerStyle={styles.tabBarContent}
        >
          {TABS.map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[
                styles.tabBtn,
                { borderBottomColor: tab === t ? colors.primary : "transparent" },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: tab === t ? colors.primary : colors.mutedForeground,
                    fontFamily: tab === t ? "Inter_600SemiBold" : "Inter_500Medium",
                  },
                ]}
              >
                {t}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Tab content */}
        {tab === "My Presets" && (
          <ScrollView contentContainerStyle={styles.content}>
            {!activePreset ? (
              <View style={styles.emptyWrap}>
                <Feather name="layers" size={40} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No preset active</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Switch to Built-in or Templates to pick a persona.
                </Text>
              </View>
            ) : (
              <PresetCard preset={activePreset} isActive colors={colors} onUse={() => handleUse(activePreset.prompt)} showTags />
            )}
            <View style={[styles.currentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.currentLabel, { color: colors.mutedForeground }]}>CURRENT SYSTEM PROMPT</Text>
              <Text style={[styles.currentText, { color: colors.foreground }]} numberOfLines={8}>
                {settings.systemPrompt || "No system prompt set — using default behaviour."}
              </Text>
            </View>
          </ScrollView>
        )}

        {tab === "Built-in" && (
          <ScrollView contentContainerStyle={styles.content}>
            {BUILT_IN_PRESETS.map((p) => (
              <PresetCard
                key={p.label}
                preset={p}
                isActive={p.prompt === settings.systemPrompt}
                colors={colors}
                onUse={() => handleUse(p.prompt)}
              />
            ))}
          </ScrollView>
        )}

        {tab === "Custom" && (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={[styles.customHint, { color: colors.mutedForeground }]}>
              Write your own system prompt to fully customise how Gemma behaves.
            </Text>
            <TextInput
              value={customText}
              onChangeText={setCustomText}
              multiline
              placeholder="e.g. You are a helpful assistant that only speaks in haiku..."
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.customInput,
                {
                  color: colors.foreground,
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                },
              ]}
              textAlignVertical="top"
            />
            <Pressable
              onPress={() => handleUse(customText)}
              style={({ pressed }) => [
                styles.applyBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Feather name="check" size={16} color="#fff" />
              <Text style={styles.applyBtnText}>Apply Prompt</Text>
            </Pressable>
          </ScrollView>
        )}

        {tab === "Templates" && (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={[styles.filterBar, { borderBottomColor: colors.border }]}
              contentContainerStyle={styles.filterBarContent}
            >
              {TEMPLATE_CATEGORIES.map((cat) => {
                const count =
                  cat === "All"
                    ? BUILT_IN_PRESETS.length
                    : BUILT_IN_PRESETS.filter((p) => p.tags.includes(cat)).length;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setFilterTag(cat)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor:
                          filterTag === cat ? colors.primary : colors.secondary,
                        borderColor:
                          filterTag === cat ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color:
                            filterTag === cat
                              ? colors.primaryForeground
                              : colors.mutedForeground,
                        },
                      ]}
                    >
                      {cat} ({count})
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <ScrollView contentContainerStyle={styles.content}>
              {filteredTemplates.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                    No templates in this category
                  </Text>
                </View>
              ) : (
                filteredTemplates.map((p) => (
                  <PresetCard
                    key={p.label}
                    preset={p}
                    isActive={p.prompt === settings.systemPrompt}
                    colors={colors}
                    onUse={() => handleUse(p.prompt)}
                    showTags
                  />
                ))
              )}
            </ScrollView>
          </>
        )}
      </View>
    </Modal>
  );
}

function PresetCard({
  preset,
  isActive,
  colors,
  onUse,
  showTags,
}: {
  preset: Preset;
  isActive: boolean;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  onUse: () => void;
  showTags?: boolean;
}) {
  return (
    <View
      style={[
        styles.presetCard,
        {
          backgroundColor: colors.card,
          borderColor: isActive ? preset.color : colors.border,
          borderWidth: isActive ? 1.5 : 1,
        },
      ]}
    >
      <View style={styles.presetTop}>
        <View style={[styles.presetIcon, { backgroundColor: preset.color + "20" }]}>
          <Text style={styles.presetEmoji}>{preset.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.presetNameRow}>
            <Text style={[styles.presetName, { color: colors.foreground }]}>
              {preset.label}
            </Text>
            {isActive && (
              <View style={[styles.activePill, { backgroundColor: preset.color + "20" }]}>
                <Text style={[styles.activePillText, { color: preset.color }]}>Active</Text>
              </View>
            )}
          </View>
          {showTags && (
            <View style={styles.tagRow}>
              {preset.tags.map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.tagText, { color: colors.mutedForeground }]}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
      <Text style={[styles.presetDesc, { color: colors.mutedForeground }]}>
        {preset.description}
      </Text>
      <Pressable
        onPress={onUse}
        style={({ pressed }) => [
          styles.useBtn,
          {
            backgroundColor: isActive ? colors.secondary : preset.color,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.useBtnText,
            { color: isActive ? colors.mutedForeground : "#fff" },
          ]}
        >
          {isActive ? "✓ In Use" : "Use"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "88%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 24,
  },
  handleWrap: { alignItems: "center", paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  activeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  activeBannerText: { flex: 1, fontSize: 13.5, fontFamily: "Inter_600SemiBold" },
  tabBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    maxHeight: 44,
  },
  tabBarContent: { paddingHorizontal: 8, gap: 4 },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
  },
  tabText: { fontSize: 13.5 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  filterBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    maxHeight: 52,
  },
  filterBarContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    alignItems: "center",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 12.5, fontFamily: "Inter_500Medium" },
  emptyWrap: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyText: {
    fontSize: 13.5,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  presetCard: { borderRadius: 16, padding: 14, gap: 10 },
  presetTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  presetIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  presetEmoji: { fontSize: 22 },
  presetNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 4,
  },
  presetName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  activePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  activePillText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  tagRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  tagText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  presetDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  useBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  useBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  customHint: {
    fontSize: 13.5,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginBottom: 4,
  },
  customInput: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    fontSize: 14.5,
    fontFamily: "Inter_400Regular",
    minHeight: 180,
    lineHeight: 22,
  },
  applyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  applyBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  currentCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  currentLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  currentText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
});
