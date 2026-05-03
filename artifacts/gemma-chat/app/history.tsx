import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useMemo } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useChat, type Conversation } from "@/context/ChatContext";
import { useColors } from "@/hooks/useColors";

const PREDEFINED_TAGS = ["Work", "Study", "Code", "Personal", "Ideas", "Travel", "Recipes", "Health"];

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

function groupByDate(conversations: Conversation[]): { label: string; data: Conversation[] }[] {
  const now = Date.now();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const week = new Date(today); week.setDate(today.getDate() - 7);
  const month = new Date(today); month.setDate(today.getDate() - 30);

  const groups: Record<string, Conversation[]> = {
    Pinned: [],
    Today: [],
    Yesterday: [],
    "This week": [],
    "This month": [],
    Older: [],
  };

  for (const c of conversations) {
    if (c.pinned) { groups["Pinned"].push(c); continue; }
    const d = new Date(c.updatedAt);
    if (d >= today) groups["Today"].push(c);
    else if (d >= yesterday) groups["Yesterday"].push(c);
    else if (d >= week) groups["This week"].push(c);
    else if (d >= month) groups["This month"].push(c);
    else groups["Older"].push(c);
  }

  return Object.entries(groups)
    .filter(([, data]) => data.length > 0)
    .map(([label, data]) => ({ label, data }));
}

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    conversations, activeId, setActiveId,
    deleteConversation, newConversation,
    pinConversation, unpinConversation, renameConversation,
    tagConversation,
  } = useChat();

  const [query, setQuery] = useState("");
  const [renameTarget, setRenameTarget] = useState<Conversation | null>(null);
  const [renameText, setRenameText] = useState("");
  const [tagTarget, setTagTarget] = useState<Conversation | null>(null);
  const [tagDraft, setTagDraft] = useState<string[]>([]);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

  const handleSelect = (id: string) => { setActiveId(id); router.back(); };
  const handleNew = () => { newConversation(); router.back(); };

  const openTagModal = (conv: Conversation) => {
    setTagTarget(conv);
    setTagDraft(conv.tags ?? []);
  };
  const toggleTagDraft = (tag: string) => {
    setTagDraft((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };
  const confirmTags = () => {
    if (tagTarget) tagConversation(tagTarget.id, tagDraft);
    setTagTarget(null);
    setTagDraft([]);
  };

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const c of conversations) for (const t of c.tags ?? []) set.add(t);
    return [...set];
  }, [conversations]);

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

  const handlePinToggle = (conv: Conversation) => {
    if (conv.pinned) unpinConversation(conv.id);
    else pinConversation(conv.id);
  };

  const openRename = (conv: Conversation) => {
    setRenameTarget(conv);
    setRenameText(conv.title);
  };

  const confirmRename = () => {
    if (renameTarget && renameText.trim()) {
      renameConversation(renameTarget.id, renameText.trim());
    }
    setRenameTarget(null);
    setRenameText("");
  };

  const sorted = useMemo(() => {
    return [...conversations].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [conversations]);

  const filtered = useMemo(() => {
    let result = sorted;
    if (activeTagFilter) result = result.filter((c) => c.tags?.includes(activeTagFilter));
    const q = query.trim().toLowerCase();
    if (!q) return result;
    return result.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q)),
    );
  }, [sorted, query, activeTagFilter]);

  const grouped = useMemo(() => {
    if (query.trim() || activeTagFilter) return [{ label: activeTagFilter ? `#${activeTagFilter}` : "Results", data: filtered }];
    return groupByDate(sorted);
  }, [sorted, filtered, query, activeTagFilter]);

  const totalChats = conversations.length;
  const pinnedCount = conversations.filter((c) => c.pinned).length;

  type FlatItem =
    | { type: "header"; label: string }
    | { type: "item"; conv: Conversation };

  const flatData: FlatItem[] = useMemo(() => {
    const items: FlatItem[] = [];
    for (const group of grouped) {
      items.push({ type: "header", label: group.label });
      for (const conv of group.data) {
        items.push({ type: "item", conv });
      }
    }
    return items;
  }, [grouped]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Tag modal */}
      <Modal
        visible={!!tagTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setTagTarget(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setTagTarget(null)}>
          <Pressable style={[styles.renameModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.renameTitle, { color: colors.foreground }]}>Add tags</Text>
            <View style={styles.tagGrid}>
              {PREDEFINED_TAGS.map((tag) => {
                const sel = tagDraft.includes(tag);
                return (
                  <Pressable
                    key={tag}
                    onPress={() => toggleTagDraft(tag)}
                    style={[
                      styles.tagChipBtn,
                      { backgroundColor: sel ? colors.primary : colors.secondary, borderColor: sel ? colors.primary : colors.border },
                    ]}
                  >
                    <Text style={[styles.tagChipBtnText, { color: sel ? colors.primaryForeground : colors.foreground }]}>
                      {tag}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.renameActions}>
              <Pressable
                onPress={() => setTagTarget(null)}
                style={[styles.renameBtn, { backgroundColor: colors.secondary }]}
              >
                <Text style={[styles.renameBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmTags}
                style={[styles.renameBtn, { backgroundColor: colors.primary, flex: 1 }]}
              >
                <Text style={[styles.renameBtnText, { color: colors.primaryForeground }]}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Rename modal */}
      <Modal
        visible={!!renameTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameTarget(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setRenameTarget(null)}>
          <Pressable style={[styles.renameModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.renameTitle, { color: colors.foreground }]}>Rename conversation</Text>
            <TextInput
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
              selectTextOnFocus
              style={[styles.renameInput, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: colors.border }]}
              onSubmitEditing={confirmRename}
              returnKeyType="done"
              maxLength={80}
            />
            <View style={styles.renameActions}>
              <Pressable
                onPress={() => setRenameTarget(null)}
                style={[styles.renameBtn, { backgroundColor: colors.secondary }]}
              >
                <Text style={[styles.renameBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmRename}
                style={[styles.renameBtn, { backgroundColor: colors.primary, flex: 1 }]}
              >
                <Text style={[styles.renameBtnText, { color: colors.primaryForeground }]}>Rename</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === "web" ? Math.max(insets.top, 16) + 6 : insets.top + 6,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
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
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: colors.foreground }]}>Chats</Text>
          {totalChats > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.countBadgeText, { color: colors.mutedForeground }]}>{totalChats}</Text>
            </View>
          )}
        </View>
        <Pressable
          onPress={handleNew}
          hitSlop={8}
          style={({ pressed }) => [
            styles.newChatBtn,
            { backgroundColor: pressed ? colors.primary + "cc" : colors.primary },
          ]}
        >
          <Feather name="edit" size={16} color="#fff" />
          <Text style={styles.newChatText}>New</Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { borderBottomColor: colors.border }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.secondary }]}>
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

      {/* Stats strip */}
      {totalChats > 0 && !query && (
        <View style={[styles.statsStrip, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.statItem}>
            <Feather name="message-square" size={13} color={colors.primary} />
            <Text style={[styles.statText, { color: colors.mutedForeground }]}>
              {totalChats} conversation{totalChats !== 1 ? "s" : ""}
            </Text>
          </View>
          {pinnedCount > 0 && (
            <View style={styles.statItem}>
              <Feather name="bookmark" size={13} color={colors.primary} />
              <Text style={[styles.statText, { color: colors.mutedForeground }]}>
                {pinnedCount} pinned
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Tag filter chips */}
      {allTags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.tagFilterBar, { borderBottomColor: colors.border }]}
          contentContainerStyle={styles.tagFilterContent}
        >
          <Pressable
            onPress={() => setActiveTagFilter(null)}
            style={[
              styles.tagFilterChip,
              { backgroundColor: !activeTagFilter ? colors.primary : colors.secondary, borderColor: !activeTagFilter ? colors.primary : colors.border },
            ]}
          >
            <Text style={[styles.tagFilterText, { color: !activeTagFilter ? colors.primaryForeground : colors.mutedForeground }]}>
              All
            </Text>
          </Pressable>
          {allTags.map((tag) => (
            <Pressable
              key={tag}
              onPress={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
              style={[
                styles.tagFilterChip,
                { backgroundColor: activeTagFilter === tag ? colors.primary : colors.secondary, borderColor: activeTagFilter === tag ? colors.primary : colors.border },
              ]}
            >
              <Text style={[styles.tagFilterText, { color: activeTagFilter === tag ? colors.primaryForeground : colors.foreground }]}>
                #{tag}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {flatData.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.accent, borderColor: colors.border }]}>
            <Feather name={query ? "search" : "message-square"} size={24} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {query ? "No results found" : "No conversations yet"}
          </Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            {query ? `No chats matching "${query}"` : "Start a new chat to see it here."}
          </Text>
          {!query && (
            <Pressable
              onPress={handleNew}
              style={({ pressed }) => [
                styles.emptyNewBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Feather name="edit" size={15} color="#fff" />
              <Text style={styles.emptyNewBtnText}>Start a chat</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={(item, idx) =>
            item.type === "header" ? `hdr-${item.label}` : `item-${item.conv.id}-${idx}`
          }
          contentContainerStyle={{
            paddingHorizontal: 12,
            paddingTop: 8,
            paddingBottom: Platform.OS === "web" ? Math.max(insets.bottom, 24) + 12 : insets.bottom + 24,
            gap: 4,
          }}
          renderItem={({ item }) => {
            if (item.type === "header") {
              return (
                <View style={styles.groupHeader}>
                  <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
                  {item.label === "Pinned" && (
                    <View style={[styles.pinIcon, { backgroundColor: colors.primary + "18" }]}>
                      <Feather name="bookmark" size={11} color={colors.primary} />
                    </View>
                  )}
                </View>
              );
            }

            const conv = item.conv;
            const lastMsg = conv.messages[conv.messages.length - 1];
            const isActive = conv.id === activeId;
            const msgCount = conv.messages.length;

            return (
              <Pressable
                onPress={() => handleSelect(conv.id)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: isActive ? colors.accent : colors.card,
                    borderColor: conv.pinned
                      ? colors.primary + "60"
                      : isActive
                      ? colors.primary + "40"
                      : colors.border,
                    borderWidth: conv.pinned || isActive ? 1.5 : 1,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
              >
                {/* Avatar */}
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: isActive
                        ? colors.primary + "25"
                        : colors.secondary,
                    },
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {conv.title.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.rowMain}>
                  <View style={styles.rowTop}>
                    <Text style={[styles.rowTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {conv.title}
                    </Text>
                    <Text style={[styles.rowTime, { color: colors.mutedForeground }]}>
                      {timeAgo(conv.updatedAt)}
                    </Text>
                  </View>
                  <Text style={[styles.rowPreview, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {lastMsg?.content?.replace(/\s+/g, " ").trim() || "Empty conversation"}
                  </Text>
                  <View style={styles.rowBottom}>
                    <View style={[styles.msgCountBadge, { backgroundColor: colors.secondary }]}>
                      <Text style={[styles.msgCountText, { color: colors.mutedForeground }]}>
                        {msgCount} msg{msgCount !== 1 ? "s" : ""}
                      </Text>
                    </View>
                    {conv.pinned && (
                      <Feather name="bookmark" size={11} color={colors.primary} />
                    )}
                    {(conv.tags ?? []).slice(0, 2).map((tag) => (
                      <View key={tag} style={[styles.inlineTagChip, { backgroundColor: colors.primary + "18" }]}>
                        <Text style={[styles.inlineTagText, { color: colors.primary }]}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.rowActions}>
                  <Pressable
                    onPress={() => openRename(conv)}
                    hitSlop={8}
                    style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.6 : 1 }]}
                  >
                    <Feather name="edit-2" size={15} color={colors.mutedForeground} />
                  </Pressable>
                  <Pressable
                    onPress={() => openTagModal(conv)}
                    hitSlop={8}
                    style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.6 : 1 }]}
                  >
                    <Feather name="tag" size={15} color={(conv.tags?.length ?? 0) > 0 ? colors.primary : colors.mutedForeground} />
                  </Pressable>
                  <Pressable
                    onPress={() => handlePinToggle(conv)}
                    hitSlop={8}
                    style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.6 : 1 }]}
                  >
                    <Feather
                      name="bookmark"
                      size={15}
                      color={conv.pinned ? colors.primary : colors.mutedForeground}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDelete(conv)}
                    hitSlop={8}
                    style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.6 : 1 }]}
                  >
                    <Feather name="trash-2" size={15} color={colors.mutedForeground} />
                  </Pressable>
                </View>
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
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  titleWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  newChatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  newChatText: { fontSize: 13.5, fontFamily: "Inter_600SemiBold", color: "#fff" },
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
    paddingVertical: 10,
    borderRadius: 12,
  },
  searchInput: { flex: 1, fontSize: 14.5, fontFamily: "Inter_400Regular" },
  statsStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  statText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
    paddingTop: 14,
    paddingBottom: 6,
  },
  groupLabel: { fontSize: 11.5, fontFamily: "Inter_600SemiBold", letterSpacing: 0.4, textTransform: "uppercase" },
  pinIcon: { width: 18, height: 18, borderRadius: 5, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 12 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginTop: 4 },
  emptySub: { fontSize: 13.5, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  emptyNewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
  },
  emptyNewBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  row: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 16,
    gap: 10,
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#3b82f6" },
  rowMain: { flex: 1, gap: 4 },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  rowTitle: { flex: 1, fontSize: 14.5, fontFamily: "Inter_600SemiBold" },
  rowTime: { fontSize: 11.5, fontFamily: "Inter_400Regular" },
  rowPreview: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  rowBottom: { flexDirection: "row", alignItems: "center", gap: 6 },
  msgCountBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  msgCountText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  rowActions: { flexDirection: "row", alignItems: "center", gap: 2 },
  actionBtn: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", padding: 24 },
  renameModal: { width: "100%", borderRadius: 20, borderWidth: 1, padding: 20, gap: 14 },
  renameTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  renameInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  renameActions: { flexDirection: "row", gap: 10 },
  renameBtn: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  renameBtnText: { fontSize: 14.5, fontFamily: "Inter_600SemiBold" },
  tagFilterBar: { borderBottomWidth: StyleSheet.hairlineWidth, maxHeight: 48 },
  tagFilterContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, alignItems: "center" },
  tagFilterChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, borderWidth: 1 },
  tagFilterText: { fontSize: 12.5, fontFamily: "Inter_600SemiBold" },
  tagGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagChipBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  tagChipBtnText: { fontSize: 13.5, fontFamily: "Inter_500Medium" },
  inlineTagChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  inlineTagText: { fontSize: 10.5, fontFamily: "Inter_600SemiBold" },
});
