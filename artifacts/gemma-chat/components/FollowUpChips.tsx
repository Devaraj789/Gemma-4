import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useColors } from "@/hooks/useColors";

const GENERIC = ["Tell me more", "Give me an example", "Summarize this"];

function pickChips(content: string): string[] {
  const lc = content.toLowerCase();
  if (lc.includes("```") || lc.includes("function") || lc.includes("class ") || (lc.includes("code") && lc.length > 100)) {
    return ["Show full code", "Explain step by step", "How to optimize this?"];
  }
  if (lc.includes("error") || lc.includes("issue") || lc.includes("bug") || lc.includes("problem")) {
    return ["How to fix this?", "Show me the solution", "What causes this?"];
  }
  if (lc.includes("1.") || lc.includes("step ") || (lc.includes("•") && lc.includes("\n"))) {
    return ["Explain the first step", "Give me more details", "Can you simplify this?"];
  }
  if (lc.includes("means ") || lc.includes("is a ") || lc.includes("definition") || lc.includes("concept")) {
    return ["Give me an example", "How is this used in practice?", "What are the alternatives?"];
  }
  if (lc.includes("formula") || lc.includes("equation") || lc.includes("calculat") || lc.includes("math")) {
    return ["Show the full calculation", "Give me a practice problem", "Explain the formula"];
  }
  if (lc.includes("recipe") || lc.includes("ingredient") || lc.includes("cook") || lc.includes("food")) {
    return ["Show full recipe", "Suggest variations", "How long does it take?"];
  }
  if (lc.includes("histor") || lc.includes("year ") || lc.includes("century") || lc.includes("ancient")) {
    return ["Tell me more about this", "What happened next?", "Any interesting facts?"];
  }
  if (lc.includes("translat") || lc.includes("language") || lc.includes("word")) {
    return ["Translate to Hindi", "Give me more examples", "How is it pronounced?"];
  }
  return GENERIC;
}

type Props = {
  lastAssistantMessage: string | null;
  onSelect: (text: string) => void;
  visible: boolean;
};

export function FollowUpChips({ lastAssistantMessage, onSelect, visible }: Props) {
  const colors = useColors();

  const chips = useMemo(() => {
    if (!lastAssistantMessage?.trim() || lastAssistantMessage.trim().length < 20) return [];
    return pickChips(lastAssistantMessage);
  }, [lastAssistantMessage]);

  if (!visible || chips.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ paddingVertical: 4 }}
      contentContainerStyle={styles.row}
    >
      {chips.map((chip) => (
        <Pressable
          key={chip}
          onPress={() => onSelect(chip)}
          style={({ pressed }) => [
            styles.chip,
            {
              backgroundColor: colors.accent,
              borderColor: colors.primary + "50",
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text style={[styles.chipText, { color: colors.primary }]}>{chip}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 12, gap: 8, alignItems: "center" },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 12.5, fontFamily: "Inter_500Medium" },
});
