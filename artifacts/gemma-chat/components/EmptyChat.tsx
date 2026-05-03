import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

type Suggestion = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  sublabel: string;
  prompt: string;
  color: string;
};

const SUGGESTIONS: Suggestion[] = [
  {
    icon: "edit-3",
    label: "Help me write",
    sublabel: "Emails, essays, stories",
    prompt: "Help me write a short, friendly intro email to a new client.",
    color: "#3b82f6",
  },
  {
    icon: "code",
    label: "Explain code",
    sublabel: "Bugs, logic, concepts",
    prompt: "Explain what a React useEffect hook does in simple terms.",
    color: "#6366f1",
  },
  {
    icon: "book-open",
    label: "Summarize topic",
    sublabel: "Quick 5-line summaries",
    prompt: "Give me a 5-line summary of how transformer models work.",
    color: "#22c55e",
  },
  {
    icon: "compass",
    label: "Plan something",
    sublabel: "Trips, schedules, goals",
    prompt: "Plan a relaxing weekend in 3 simple bullet points.",
    color: "#f59e0b",
  },
  {
    icon: "message-circle",
    label: "Translate text",
    sublabel: "50+ language pairs",
    prompt: "Translate 'Good morning, how are you?' to Tamil, Japanese, and Spanish.",
    color: "#06b6d4",
  },
  {
    icon: "cpu",
    label: "Debug my code",
    sublabel: "Find & fix errors fast",
    prompt: "I have a bug in my code. Here is the error message: ",
    color: "#a855f7",
  },
  {
    icon: "feather",
    label: "Write a poem",
    sublabel: "Creative & expressive",
    prompt: "Write a short poem about the night sky and solitude.",
    color: "#ec4899",
  },
  {
    icon: "bar-chart-2",
    label: "Analyse data",
    sublabel: "Insights & patterns",
    prompt: "What are the best ways to visualise sales trends over time?",
    color: "#f97316",
  },
];

type Persona = {
  emoji: string;
  label: string;
  prompt: string;
  color: string;
};

const QUICK_PERSONAS: Persona[] = [
  { emoji: "💻", label: "Coder", color: "#6366f1", prompt: "You are an expert coding assistant. Explain code clearly, suggest improvements, and write clean, well-commented code. Prefer concise answers." },
  { emoji: "📚", label: "Teacher", color: "#22c55e", prompt: "You are a patient and encouraging teacher. Break down complex topics into simple steps. Use examples and analogies. Always check for understanding." },
  { emoji: "🎨", label: "Creative", color: "#a855f7", prompt: "You are a creative writing partner. Help brainstorm ideas, write stories, poems, scripts, and creative content. Be imaginative and expressive." },
  { emoji: "🇮🇳", label: "Tamil", color: "#f97316", prompt: "நீங்கள் ஒரு உதவிகரமான AI உதவியாளர். தமிழிலும் ஆங்கிலத்திலும் பேசலாம். கேள்விகளுக்கு தெளிவாகவும் சுருக்கமாகவும் பதில் சொல்லுங்கள்." },
  { emoji: "🩺", label: "Doctor", color: "#06b6d4", prompt: "You are a medical information assistant. Provide general health information clearly. Always remind users to consult a licensed doctor for medical decisions." },
  { emoji: "⚖️", label: "Debate", color: "#f59e0b", prompt: "You are a debate partner. Present well-reasoned arguments, consider multiple perspectives, and help sharpen critical thinking. Challenge ideas respectfully." },
];

type Props = {
  onPickPrompt: (prompt: string) => void;
  onSetPersona?: (prompt: string) => void;
  hasModel: boolean;
  modelName: string | null;
};

export function EmptyChat({ onPickPrompt, onSetPersona, hasModel, modelName }: Props) {
  const colors = useColors();

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* App Identity */}
      <View style={styles.heroSection}>
        <View style={[styles.appIconWrap, { backgroundColor: colors.primary }]}>
          <Feather name="cpu" size={32} color="#fff" />
        </View>
        <Text style={[styles.heroTitle, { color: colors.foreground }]}>
          Gemma Offline Chat
        </Text>
        <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
          {hasModel
            ? "Ask anything. Runs entirely on your device."
            : "Download a model to start chatting offline."}
        </Text>

        {!hasModel && (
          <Pressable
            onPress={() => router.push("/models")}
            style={({ pressed }) => [
              styles.downloadBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Feather name="download" size={16} color="#fff" />
            <Text style={styles.downloadBtnText}>Download a Model</Text>
          </Pressable>
        )}

        {hasModel && (
          <View style={[styles.modelPill, { backgroundColor: colors.success + "18", borderColor: colors.success + "40" }]}>
            <View style={[styles.dot, { backgroundColor: colors.success }]} />
            <Text style={[styles.modelPillText, { color: colors.success }]}>{modelName}</Text>
            <Text style={[styles.modelPillSub, { color: colors.success + "99" }]}>· Online on-device</Text>
          </View>
        )}
      </View>

      {hasModel && (
        <>
          {/* Quick Persona Switcher */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>AI Personas</Text>
            <Pressable onPress={() => router.push("/settings")} hitSlop={8}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>Manage →</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.personaRow}
          >
            {QUICK_PERSONAS.map((p) => (
              <Pressable
                key={p.label}
                onPress={() => onSetPersona?.(p.prompt)}
                style={({ pressed }) => [
                  styles.personaChip,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <View style={[styles.personaIconCircle, { backgroundColor: p.color + "20" }]}>
                  <Text style={styles.personaEmoji}>{p.emoji}</Text>
                </View>
                <Text style={[styles.personaLabel, { color: colors.foreground }]}>{p.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Suggestions */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Suggestions</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsRow}
          >
            {SUGGESTIONS.map((s) => (
              <Pressable
                key={s.label}
                onPress={() => onPickPrompt(s.prompt)}
                style={({ pressed }) => [
                  styles.suggestionCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View style={[styles.suggestionIconWrap, { backgroundColor: s.color + "18" }]}>
                  <Feather name={s.icon} size={20} color={s.color} />
                </View>
                <View style={styles.suggestionText}>
                  <Text style={[styles.suggestionLabel, { color: colors.foreground }]}>
                    {s.label}
                  </Text>
                  <Text style={[styles.suggestionSub, { color: colors.mutedForeground }]}>
                    {s.sublabel}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>

          {/* Quick action pills */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
          </View>
          <View style={styles.quickPillsWrap}>
            {[
              { icon: "zap" as const, label: "Summarize text", prompt: "Please summarize the following text for me: " },
              { icon: "translate" as const, label: "Translate", prompt: "Translate the following to English: " },
              { icon: "list" as const, label: "Make a list", prompt: "Give me a numbered list of " },
              { icon: "help-circle" as const, label: "Explain simply", prompt: "Explain this in simple terms like I'm 10 years old: " },
              { icon: "check-square" as const, label: "Review my work", prompt: "Please review and improve the following: " },
              { icon: "star" as const, label: "Give ideas", prompt: "Give me 5 creative ideas for " },
            ].map((item) => (
              <Pressable
                key={item.label}
                onPress={() => onPickPrompt(item.prompt)}
                style={({ pressed }) => [
                  styles.quickPill,
                  {
                    backgroundColor: colors.secondary,
                    borderColor: colors.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Feather name={item.icon} size={13} color={colors.primary} />
                <Text style={[styles.quickPillText, { color: colors.foreground }]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {/* Offline info badge */}
      <View style={[styles.offlineBadge, { backgroundColor: colors.accent, borderColor: colors.border }]}>
        <Feather name="shield" size={14} color={colors.primary} />
        <Text style={[styles.offlineBadgeText, { color: colors.mutedForeground }]}>
          100% private · No internet needed · On-device AI
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  heroSection: {
    alignItems: "center",
    paddingTop: 36,
    paddingBottom: 24,
    paddingHorizontal: 28,
    gap: 10,
  },
  appIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  heroSub: {
    fontSize: 14.5,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 21,
  },
  modelPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 4,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  modelPillText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  modelPillSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 8,
  },
  downloadBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  seeAll: { fontSize: 13, fontFamily: "Inter_500Medium" },
  personaRow: {
    paddingHorizontal: 12,
    gap: 10,
    paddingBottom: 4,
  },
  personaChip: {
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 72,
  },
  personaIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  personaEmoji: { fontSize: 22 },
  personaLabel: { fontSize: 11.5, fontFamily: "Inter_600SemiBold" },
  suggestionsRow: {
    paddingHorizontal: 12,
    gap: 10,
    paddingBottom: 4,
  },
  suggestionCard: {
    width: 160,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  suggestionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionText: { gap: 3 },
  suggestionLabel: { fontSize: 13.5, fontFamily: "Inter_600SemiBold" },
  suggestionSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 16 },
  quickPillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 14,
  },
  quickPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  quickPillText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  offlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 24,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  offlineBadgeText: { fontSize: 12.5, fontFamily: "Inter_400Regular" },
});
