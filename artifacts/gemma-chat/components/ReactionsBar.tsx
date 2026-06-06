import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

type Props = {
  reactions: string[];
  isUser: boolean;
  onToggle: (emoji: string) => void;
};

export function ReactionsBar({ reactions, isUser, onToggle }: Props) {
  const colors = useColors();
  if (reactions.length === 0) return null;

  const counts: Record<string, number> = {};
  for (const e of reactions) counts[e] = (counts[e] ?? 0) + 1;
  const entries = Object.entries(counts);

  return (
    <View style={[styles.bar, { justifyContent: isUser ? "flex-end" : "flex-start" }]}>
      {entries.map(([emoji, count]) => (
        <TouchableOpacity
          key={emoji}
          onPress={() => onToggle(emoji)}
          style={[styles.chip, { backgroundColor: colors.accent, borderColor: colors.border }]}
          activeOpacity={0.75}
        >
          <Text style={styles.emoji}>{emoji}</Text>
          {count > 1 && <Text style={[styles.count, { color: colors.accentForeground }]}>{count}</Text>}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, paddingBottom: 4, gap: 5 },
  chip: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth },
  emoji: { fontSize: 15 },
  count: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});
