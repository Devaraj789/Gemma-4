import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

type QuickReply = {
  label: string;
  text: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  color?: string;
};

const QUICK_REPLIES: QuickReply[] = [
  { label: "Explain more",   text: "Can you explain that in more detail?",            icon: "zoom-in" },
  { label: "Give example",   text: "Can you give me a practical example?",             icon: "code" },
  { label: "Shorter",        text: "Please give a shorter, simpler answer.",           icon: "minimize-2" },
  { label: "Step by step",   text: "Can you explain this step by step?",               icon: "list" },
  { label: "In Tamil",       text: "Please explain this in Tamil (தமிழில் விளக்கு).", icon: "globe" },
  { label: "Why?",           text: "Why does this work? What is the reason behind it?",icon: "help-circle" },
  { label: "Continue",       text: "Please continue from where you left off.",         icon: "arrow-right", color: "#3b82f6" },
  { label: "Key points",     text: "What are the most important key points?",          icon: "star" },
  { label: "Pros & Cons",    text: "What are the pros and cons of this?",              icon: "git-branch" },
  { label: "Summarize",      text: "Can you summarize everything so far?",             icon: "align-left" },
  { label: "Fix code",       text: "Please fix any bugs in the code above.",           icon: "tool" },
  { label: "Translate",      text: "Translate the above text to English.",             icon: "type" },
  { label: "Improve writing",text: "Please improve the writing style and clarity.",    icon: "edit-3" },
  { label: "What's next?",   text: "What should I do next?",                           icon: "chevron-right" },
];

type Props = {
  onSelect: (text: string) => void;
};

export function QuickReplies({ onSelect }: Props) {
  const colors = useColors();
  const [pressed, setPressed] = useState<string | null>(null);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="always"
    >
      {QUICK_REPLIES.map((qr) => {
        const accent = qr.color ?? colors.mutedForeground;
        const isPressed = pressed === qr.label;
        return (
          <Pressable
            key={qr.label}
            onPressIn={() => setPressed(qr.label)}
            onPressOut={() => setPressed(null)}
            onPress={() => onSelect(qr.text)}
            style={[
              styles.chip,
              {
                backgroundColor: isPressed ? (qr.color ?? colors.primary) + "18" : colors.secondary,
                borderColor: isPressed ? (qr.color ?? colors.primary) + "60" : colors.border,
              },
            ]}
          >
            <Feather name={qr.icon} size={12} color={accent} />
            <Text style={[styles.chipText, { color: isPressed ? (qr.color ?? colors.primary) : colors.foreground }]}>
              {qr.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 12, paddingVertical: 7, gap: 7, flexDirection: "row" },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 11, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  chipText: { fontSize: 12.5, fontFamily: "Inter_500Medium" },
});
