import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import {
  type FavouritePrompt,
  getFavourites,
  removeFavourite,
  clearFavourites,
} from "@/lib/favouritePrompts";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (text: string) => void;
  onSaved?: boolean;
};

export function FavouritePromptsSheet({ visible, onClose, onSelect, onSaved }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<FavouritePrompt[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (visible) {
      void getFavourites().then(setItems);
      setSearch("");
    }
  }, [visible, onSaved]);

  const filtered = search.trim()
    ? items.filter((f) => f.text.toLowerCase().includes(search.toLowerCase()))
    : items;

  const handleDelete = async (id: string) => {
    const next = await removeFavourite(id);
    setItems(next);
  };

  const handleClearAll = async () => {
    await clearFavourites();
    setItems([]);
  };

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.card,
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Feather name="star" size={18} color={colors.primary} />
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Favourite Prompts</Text>
            {items.length > 0 && (
              <View style={[styles.countBadge, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[styles.countBadgeText, { color: colors.primary }]}>{items.length}</Text>
              </View>
            )}
          </View>
          <View style={styles.headerRight}>
            {items.length > 0 && (
              <Pressable onPress={handleClearAll} hitSlop={8}>
                <Text style={[styles.clearAll, { color: colors.destructive }]}>Clear all</Text>
              </Pressable>
            )}
            <Pressable onPress={onClose} hitSlop={8} style={[styles.closeBtn, { backgroundColor: colors.secondary }]}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>

        {/* Search */}
        {items.length > 3 && (
          <View style={[styles.searchBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Feather name="search" size={14} color={colors.mutedForeground} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search saved prompts…"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.searchInput, { color: colors.foreground }]}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")} hitSlop={8}>
                <Feather name="x-circle" size={14} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
        )}

        {/* List */}
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="star" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {items.length === 0 ? "No saved prompts yet" : "No results"}
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              {items.length === 0
                ? "Tap ★ while typing to save a message."
                : `Nothing matching "${search}"`}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(f) => f.id}
            style={styles.list}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => { onSelect(item.text); onClose(); }}
                activeOpacity={0.75}
                style={[styles.item, { backgroundColor: colors.background, borderColor: colors.border }]}
              >
                <View style={styles.itemContent}>
                  <Text style={[styles.itemText, { color: colors.foreground }]} numberOfLines={2}>
                    {item.text}
                  </Text>
                  <Text style={[styles.itemDate, { color: colors.mutedForeground }]}>
                    {formatDate(item.createdAt)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => void handleDelete(item.id)}
                  hitSlop={8}
                  style={({ pressed }) => [styles.deleteBtn, { opacity: pressed ? 0.6 : 1 }]}
                >
                  <Feather name="trash-2" size={15} color={colors.destructive} />
                </Pressable>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: "70%", minHeight: 260,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 20,
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 4 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  countBadgeText: { fontSize: 11.5, fontFamily: "Inter_600SemiBold" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  clearAll: { fontSize: 12.5, fontFamily: "Inter_500Medium" },
  closeBtn: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginBottom: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  list: { flexGrow: 0 },
  item: { flexDirection: "row", alignItems: "flex-start", padding: 12, borderRadius: 14, borderWidth: 1, gap: 10 },
  itemContent: { flex: 1, gap: 3 },
  itemText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  itemDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  deleteBtn: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 36, gap: 8 },
  emptyTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  emptySub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 32 },
});
