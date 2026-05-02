import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { useColors } from "@/hooks/useColors";

type QuickReply = {
  label: string;
  text: string;
  icon: React.ComponentProps<typeof Feather>["name"];
};

const QUICK_REPLIES: QuickReply[] = [
  { label: "Explain more",    text: "Can you explain that in more detail?",           icon: "zoom-in" },
  { label: "Give example",    text: "Can you give me a practical example?",            icon: "code" },
  { label: "In Tamil",        text: "Please explain this in Tamil (தமிழில் விளக்கு).", icon: "globe" },
  { label: "Shorter",         text: "Please give a shorter, simpler answer.",          icon: "minimize-2" },
  { label: "Step by step",    text: "Can you explain this step by step?",              icon: "list" },
  { label: "Why?",            text: "Why does this work? What is the reason?",         icon: "help-circle" },
  { label: "What's next?",    text: "What should I do next?",                          icon: "arrow-right" },
  { label: "Key points",      text: "What are the most important key points?",         icon: "star" },
  { label: "Pros & cons",     text: "What are the pros and cons?",                     icon: "git-branch" },
  { label: "Summarize",       text: "Can you summarize everything so far?",            icon: "align-left" },
];

type Props = {
  onSelect: (text: string) => void;
};

export function QuickReplies({ onSelect }: Props) {
  const colors = useColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="always"
    >
      {QUICK_REPLIES.map((qr) => (
        <Pressable
          key={qr.label}
          onPress={() => onSelect(qr.text)}
          style={({ pressed }) => [
            styles.chip,
            {
              backgroundColor: pressed ? colors.primary + "18" : colors.secondary,
              borderColor: pressed ? colors.primary + "60" : colors.border,
            },
          ]}
        >
          <Feather name={qr.icon} size={13} color={colors.mutedForeground} />
          <Text style={[styles.chipText, { color: colors.foreground }]}>{qr.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    flexDirection: "row",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
});
