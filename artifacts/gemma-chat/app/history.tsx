import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useMemo } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useChat, type Conversation } from "@/context/ChatContext";
import { useColors } from "@/hooks/useColors";

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { conversations, activeId, setActiveId, deleteConversation, newConversation } = useChat();
  const [query, setQuery] = useState("");

  const handleSelect = (id: string) => { setActiveId(id); router.back(); };
  const handleNew = () => { newConversation(); router.back(); };

  const handleDelete = (conv: Conversation) => {
    if (Platform.OS === "web") {
      if (window.confirm(`Delete "${conv.title}"?`)) deleteConversation(conv.id);
      return;
    }
    Alert.alert("Delete conversation?", conv.title, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteConversation(conv.id) },
    ]);
  };

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
    if (!q) return list;
    return list.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q)),
    );
  }, [conversations, query]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === "web" ? Math.max(insets.top, 16) + 6 : insets.top + 6,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => [styles.iconBtn, { backgroundColor: pressed ? colors.muted : "transparent" }]}
        >
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>History</Text>
        <Pressable
          onPress={handleNew}
          hitSlop={8}
          style={({ pressed }) => [styles.iconBtn, { backgroundColor: pressed ? colors.muted : "transparent" }]}
        >
          <Feather name="edit" size={20} color={colors.primary} />
        </Pressable>
      </View>

      {/* Search bar */}
      <View style={[styles.searchWrap, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search conversations…"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Feather name="x-circle" size={15} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {sorted.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.accent, borderColor: colors.border }]}>
            <Feather name={query ? "search" : "message-square"} size={22} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {query ? "No results found" : "No conversations yet"}
          </Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            {query ? `No chats matching "${query}"` : "Start a chat to see it appear here."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{
            padding: 12,
            paddingBottom: Platform.OS === "web" ? Math.max(insets.bottom, 24) + 12 : insets.bottom + 24,
            gap: 6,
          }}
          renderItem={({ item }) => {
            const lastMsg = item.messages[item.messages.length - 1];
            const isActive = item.id === activeId;
            return (
              <Pressable
                onPress={() => handleSelect(item.id)}
                onLongPress={() => handleDelete(item)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: isActive ? colors.accent : colors.card,
                    borderColor: isActive ? colors.primary : colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View style={styles.rowMain}>
                  <Text style={[styles.rowTitle, { color: colors.foreground }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.rowPreview, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {lastMsg?.content?.replace(/\s+/g, " ").trim() || "Empty conversation"}
                  </Text>
                  <Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>
                    {timeAgo(item.updatedAt)} · {item.messages.length} message{item.messages.length === 1 ? "" : "s"}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleDelete(item)}
                  hitSlop={8}
                  style={({ pressed }) => [styles.deleteBtn, { opacity: pressed ? 0.6 : 1 }]}
                >
                  <Feather name="trash-2" size={16} color={colors.mutedForeground} />
                </Pressable>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 17, fontFamily: "Inter_700Bold" },
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  searchWrap: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14.5, fontFamily: "Inter_400Regular" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 10 },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", marginTop: 6 },
  emptySub: { fontSize: 13.5, fontFamily: "Inter_400Regular", textAlign: "center" },
  row: { flexDirection: "row", padding: 14, borderRadius: 14, borderWidth: 1, gap: 12 },
  rowMain: { flex: 1, gap: 4 },
  rowTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  rowPreview: { fontSize: 13, fontFamily: "Inter_400Regular" },
  rowMeta: { fontSize: 11.5, fontFamily: "Inter_400Regular", marginTop: 2 },
  deleteBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
});
