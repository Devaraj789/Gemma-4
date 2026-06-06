import { Feather } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import type { Message } from "@/context/ChatContext";

type Props = {
  visible: boolean;
  onClose: () => void;
  pinnedMessages: Message[];
  onUnpin: (msgId: string) => void;
  onScrollTo?: (msgId: string) => void;
};

function formatTime(ts: number) {
  return new Date(ts).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function PinnedMessagesSheet({ visible, onClose, pinnedMessages, onUnpin, onScrollTo }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 12 }]}>
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <Feather name="bookmark" size={18} color={colors.primary} />
            <Text style={[styles.title, { color: colors.foreground }]}>Pinned Messages</Text>
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{pinnedMessages.length}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.secondary }]}>
            <Feather name="x" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {pinnedMessages.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="bookmark" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No pinned messages yet</Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>Long-press any message and tap 📌 to pin it</Text>
            </View>
          ) : (
            pinnedMessages.map((msg) => (
              <Pressable
                key={msg.id}
                onPress={() => { onScrollTo?.(msg.id); onClose(); }}
                style={[styles.card, { backgroundColor: colors.secondary, borderColor: colors.border }]}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.roleDot, { backgroundColor: msg.role === "user" ? colors.primary : colors.mutedForeground }]} />
                  <Text style={[styles.roleLabel, { color: colors.mutedForeground }]}>
                    {msg.role === "user" ? "You" : "Gemma"}
                  </Text>
                  <Text style={[styles.cardTime, { color: colors.mutedForeground }]}>{formatTime(msg.createdAt)}</Text>
                  <TouchableOpacity onPress={() => onUnpin(msg.id)} style={[styles.unpinBtn, { backgroundColor: colors.accent }]}>
                    <Feather name="x" size={12} color={colors.accentForeground} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.cardContent, { color: colors.foreground }]} numberOfLines={4}>
                  {msg.content.replace(/```[\s\S]*?```/g, "[code block]").trim()}
                </Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "70%", paddingTop: 12 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 17, fontFamily: "Inter_700Bold" },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#fff" },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, gap: 12 },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 48, gap: 10 },
  emptyText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  emptySub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", maxWidth: 240 },
  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 8 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  roleDot: { width: 7, height: 7, borderRadius: 4 },
  roleLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", flex: 1 },
  cardTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
  unpinBtn: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", marginLeft: 4 },
  cardContent: { fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 20 },
});
