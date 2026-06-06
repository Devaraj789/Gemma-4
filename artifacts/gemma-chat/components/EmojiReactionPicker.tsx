import React from "react";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

const EMOJI_ROWS = [
  ["👍", "❤️", "😂", "😮", "🔥", "💯"],
  ["🙌", "😢", "😡", "🤔", "✅", "⭐"],
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  currentReactions?: string[];
};

export function EmojiReactionPicker({ visible, onClose, onSelect, currentReactions = [] }: Props) {
  const colors = useColors();

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: "#000" }]}>
          {EMOJI_ROWS.map((row, ri) => (
            <View key={ri} style={styles.row}>
              {row.map((emoji) => {
                const isActive = currentReactions.includes(emoji);
                return (
                  <TouchableOpacity
                    key={emoji}
                    onPress={() => { onSelect(emoji); onClose(); }}
                    style={[styles.emojiBtn, isActive && { backgroundColor: colors.accent }]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.emoji}>{emoji}</Text>
                    {isActive && <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.35)" },
  panel: {
    borderRadius: 20, borderWidth: StyleSheet.hairlineWidth,
    padding: 14, gap: 8,
    shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
    elevation: 14,
  },
  row: { flexDirection: "row", gap: 6 },
  emojiBtn: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 26 },
  activeDot: { width: 5, height: 5, borderRadius: 3, position: "absolute", bottom: 5 },
});
