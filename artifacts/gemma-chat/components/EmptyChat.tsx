import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

type Suggestion = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  prompt: string;
};

const SUGGESTIONS: Suggestion[] = [
  {
    icon: "edit-3",
    label: "Help me write",
    prompt: "Help me write a short, friendly intro email to a new client.",
  },
  {
    icon: "code",
    label: "Explain this code",
    prompt: "Explain what a React useEffect hook does in simple terms.",
  },
  {
    icon: "book-open",
    label: "Summarize a topic",
    prompt: "Give me a 5-line summary of how transformer models work.",
  },
  {
    icon: "compass",
    label: "Plan something",
    prompt: "Plan a relaxing weekend in 3 simple bullet points.",
  },
];

type Props = {
  onPickPrompt: (prompt: string) => void;
  hasModel: boolean;
  modelName: string | null;
};

export function EmptyChat({ onPickPrompt, hasModel, modelName }: Props) {
  const colors = useColors();
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.logoCircle,
          {
            backgroundColor: colors.accent,
            borderColor: colors.primary,
          },
        ]}
      >
        <Feather name="message-circle" size={28} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>
        {hasModel ? "How can I help today?" : "Choose a model to begin"}
      </Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        {hasModel
          ? `${modelName} runs entirely on this device — your messages never leave it.`
          : "Download an offline Gemma model from the Models tab to start chatting."}
      </Text>

      {hasModel ? (
        <View style={styles.suggestionsGrid}>
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
              <Feather name={s.icon} size={16} color={colors.primary} />
              <Text
                style={[styles.suggestionText, { color: colors.foreground }]}
                numberOfLines={2}
              >
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 14,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14.5,
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 12,
  },
  suggestionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 24,
    width: "100%",
  },
  suggestionCard: {
    width: "47%",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    minHeight: 78,
  },
  suggestionText: {
    fontSize: 13.5,
    fontFamily: "Inter_500Medium",
  },
});
