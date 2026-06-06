import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { ReplyTo } from "@/context/ChatContext";

type Props = {
  replyTo: ReplyTo;
  onCancel: () => void;
};

export function ReplyPreviewBar({ replyTo, onCancel }: Props) {
  const colors = useColors();
  const isUser = replyTo.role === "user";

  return (
    <View style={[styles.container, { backgroundColor: colors.secondary, borderLeftColor: colors.primary, borderTopColor: colors.border }]}>
      <View style={styles.left}>
        <View style={styles.labelRow}>
          <Feather name="corner-up-left" size={11} color={colors.primary} />
          <Text style={[styles.label, { color: colors.primary }]}>
            Replying to {isUser ? "yourself" : "Gemma"}
          </Text>
        </View>
        <Text style={[styles.preview, { color: colors.mutedForeground }]} numberOfLines={2}>
          {replyTo.content.trim().replace(/```[\s\S]*?```/g, "[code block]").slice(0, 120)}
        </Text>
      </View>
      <Pressable onPress={onCancel} hitSlop={12} style={styles.closeBtn}>
        <Feather name="x" size={16} color={colors.mutedForeground} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderLeftWidth: 3,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  left: { flex: 1, gap: 3 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  label: { fontSize: 11.5, fontFamily: "Inter_600SemiBold" },
  preview: { fontSize: 12.5, fontFamily: "Inter_400Regular", lineHeight: 17 },
  closeBtn: { padding: 4 },
});
