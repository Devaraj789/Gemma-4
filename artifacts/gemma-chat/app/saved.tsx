import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import {
  clearAllSaved,
  getSavedMessages,
  unsaveMessage,
  type SavedMessage,
} from "@/lib/savedMessages";

function SavedCard({ item, onRemove }: { item: SavedMessage; onRemove: () => void }) {
  const colors = useColors();
  const isAI = item.role === "assistant";

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.roleTag, { backgroundColor: isAI ? colors.primary + "20" : colors.secondary }]}>
          <Feather name={isAI ? "cpu" : "user"} size={11} color={isAI ? colors.primary : colors.mutedForeground} />
          <Text style={[styles.roleText, { color: isAI ? colors.primary : colors.mutedForeground }]}>
            {isAI ? "Gemma" : "You"}
          </Text>
        </View>
        <Text style={[styles.convTitle, { color: colors.mutedForeground }]} numberOfLines={1}>
          {item.convTitle}
        </Text>
        <Pressable onPress={onRemove} hitSlop={8}>
          <Feather name="bookmark" size={16} color={colors.primary} />
        </Pressable>
      </View>
      <Text style={[styles.content, { color: colors.foreground }]} numberOfLines={6}>
        {item.content}
      </Text>
      <Text style={[styles.time, { color: colors.mutedForeground }]}>
        {new Date(item.savedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
      </Text>
    </View>
  );
}

export default function SavedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [saved, setSaved] = useState<SavedMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getSavedMessages();
    setSaved(data);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleRemove = useCallback((id: string) => {
    void unsaveMessage(id).then(() => setSaved((prev) => prev.filter((m) => m.id !== id)));
  }, []);

  const handleClearAll = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Remove all saved messages?")) {
        void clearAllSaved().then(() => setSaved([]));
      }
      return;
    }
    Alert.alert("Clear all saved?", "All bookmarked messages will be removed.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => void clearAllSaved().then(() => setSaved([])) },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, {
        paddingTop: Platform.OS === "web" ? Math.max(insets.top, 16) + 6 : insets.top + 6,
        borderBottomColor: colors.border,
      }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}
          style={({ pressed }) => [styles.iconBtn, { backgroundColor: pressed ? colors.muted : "transparent" }]}>
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Bookmarks</Text>
        {saved.length > 0 ? (
          <Pressable onPress={handleClearAll} hitSlop={8}
            style={({ pressed }) => [styles.iconBtn, { backgroundColor: pressed ? colors.muted : "transparent" }]}>
            <Feather name="trash-2" size={20} color={colors.destructive} />
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Loading…</Text>
        </View>
      ) : saved.length === 0 ? (
        <View style={styles.center}>
          <Feather name="bookmark" size={40} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No saved messages</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Tap the bookmark icon on any AI response to save it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={saved}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: Platform.OS === "web" ? Math.max(insets.bottom, 24) + 16 : insets.bottom + 24,
            gap: 12,
          }}
          ListHeaderComponent={
            <Text style={[styles.countLabel, { color: colors.mutedForeground }]}>
              {saved.length} saved message{saved.length !== 1 ? "s" : ""}
            </Text>
          }
          renderItem={({ item }) => (
            <SavedCard item={item} onRemove={() => handleRemove(item.id)} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 8, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 17, fontFamily: "Inter_700Bold" },
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  emptyText: { fontSize: 13.5, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  countLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 4 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  roleTag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  roleText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  convTitle: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular" },
  content: { fontSize: 14, lineHeight: 20, fontFamily: "Inter_400Regular" },
  time: { fontSize: 11.5, fontFamily: "Inter_400Regular" },
});
