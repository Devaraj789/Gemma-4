/**
 * app/online-models.tsx
 * ─────────────────────────────────────────────
 * Gemma Offline Chat — Online Model Browser
 * Browse, search, filter & select OpenRouter models
 * Free models shown first · Offline-first app pattern
 */

import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSettings } from "@/context/SettingsContext";
import { useColors } from "@/hooks/useColors";
import {
  type OpenRouterModel,
  fetchOpenRouterModels,
} from "@/lib/openrouter";

// ─── Filter categories ────────────────────────────────────────────────────────

type FilterCategory = "all" | "free" | "paid";

const FILTER_OPTIONS: { key: FilterCategory; label: string; emoji: string }[] = [
  { key: "all",  label: "All",  emoji: "🌐" },
  { key: "free", label: "Free", emoji: "🆓" },
  { key: "paid", label: "Paid", emoji: "💳" },
];

// ─── Context length formatter ─────────────────────────────────────────────────

function formatContext(ctx: number): string {
  if (ctx >= 1_000_000) return `${(ctx / 1_000_000).toFixed(1)}M`;
  if (ctx >= 1_000)     return `${Math.round(ctx / 1_000)}K`;
  return `${ctx}`;
}

// ─── Single Model Card ────────────────────────────────────────────────────────

const ModelCard = React.memo(function ModelCard({
  model,
  selected,
  onSelect,
  colors,
}: {
  model: OpenRouterModel;
  selected: boolean;
  onSelect: (id: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  // Provider name: everything before "/"
  const provider = model.id.split("/")[0] ?? model.id;
  // Short model name: everything after "/"
  const shortName = model.id.includes("/") ? model.id.split("/").slice(1).join("/") : model.id;

  return (
    <Pressable
      onPress={() => onSelect(model.id)}
      style={({ pressed }) => [
        cardStyles.wrap,
        {
          backgroundColor: selected ? colors.primary + "12" : colors.card,
          borderColor:     selected ? colors.primary : colors.border,
          opacity:         pressed ? 0.82 : 1,
        },
      ]}
    >
      {/* Left: icon */}
      <View
        style={[
          cardStyles.iconCircle,
          { backgroundColor: model.isFree ? "#22c55e18" : "#3b82f618" },
        ]}
      >
        <Feather
          name={model.isFree ? "zap" : "cloud"}
          size={17}
          color={model.isFree ? "#22c55e" : "#3b82f6"}
        />
      </View>

      {/* Middle: text */}
      <View style={{ flex: 1, gap: 2 }}>
        {/* Model name */}
        <Text
          style={[cardStyles.name, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {model.name}
        </Text>

        {/* Provider + context */}
        <Text style={[cardStyles.provider, { color: colors.mutedForeground }]} numberOfLines={1}>
          {provider}  ·  {formatContext(model.contextLength)} ctx
        </Text>

        {/* Description (optional, truncated) */}
        {!!model.description && (
          <Text
            style={[cardStyles.desc, { color: colors.mutedForeground }]}
            numberOfLines={2}
          >
            {model.description}
          </Text>
        )}
      </View>

      {/* Right: badges + checkmark */}
      <View style={cardStyles.right}>
        {/* Free badge */}
        {model.isFree && (
          <View style={cardStyles.freeBadge}>
            <Text style={cardStyles.freeBadgeText}>FREE</Text>
          </View>
        )}
        {/* Selected checkmark */}
        {selected ? (
          <View style={[cardStyles.checkCircle, { backgroundColor: colors.primary }]}>
            <Feather name="check" size={13} color="#fff" />
          </View>
        ) : (
          <View style={[cardStyles.emptyCircle, { borderColor: colors.border }]} />
        )}
      </View>
    </Pressable>
  );
});

const cardStyles = StyleSheet.create({
  wrap: {
    flexDirection:  "row",
    alignItems:     "flex-start",
    borderRadius:   14,
    borderWidth:    1,
    padding:        14,
    gap:            12,
    marginBottom:   8,
  },
  iconCircle: {
    width:         36,
    height:        36,
    borderRadius:  10,
    alignItems:    "center",
    justifyContent:"center",
    marginTop:     1,
  },
  name: {
    fontSize:    14.5,
    fontFamily:  "Inter_600SemiBold",
    lineHeight:  20,
  },
  provider: {
    fontSize:   12,
    fontFamily: "Inter_400Regular",
  },
  desc: {
    fontSize:   12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
    marginTop:  2,
  },
  right: {
    alignItems:     "center",
    gap:            6,
    paddingTop:     2,
  },
  freeBadge: {
    backgroundColor: "#22c55e18",
    borderRadius:    6,
    paddingHorizontal: 6,
    paddingVertical:   2,
  },
  freeBadgeText: {
    fontSize:   9.5,
    fontFamily: "Inter_700Bold",
    color:      "#22c55e",
    letterSpacing: 0.5,
  },
  checkCircle: {
    width:         22,
    height:        22,
    borderRadius:  11,
    alignItems:    "center",
    justifyContent:"center",
  },
  emptyCircle: {
    width:       22,
    height:      22,
    borderRadius:11,
    borderWidth: 1.5,
  },
});

// ─── Empty / Error states ─────────────────────────────────────────────────────

function EmptyState({
  icon,
  title,
  subtitle,
  colors,
}: {
  icon: string;
  title: string;
  subtitle: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={emptyStyles.wrap}>
      <Text style={emptyStyles.icon}>{icon}</Text>
      <Text style={[emptyStyles.title, { color: colors.foreground }]}>{title}</Text>
      <Text style={[emptyStyles.sub, { color: colors.mutedForeground }]}>{subtitle}</Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  wrap:  { alignItems: "center", paddingTop: 60, paddingHorizontal: 32, gap: 10 },
  icon:  { fontSize: 42, marginBottom: 4 },
  title: { fontSize: 16, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  sub:   { fontSize: 13.5, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function OnlineModelsScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();

  // ── State ────────────────────────────────────────────────────────────────────
  const [models,   setModels]   = useState<OpenRouterModel[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState<FilterCategory>("all");
  const [selected, setSelected] = useState<string>(settings.openRouterModel);

  // track whether user changed the selection
  const dirty = selected !== settings.openRouterModel;

  // ── Fetch ─────────────────────────────────────────────────────────────────────
  const fetchModels = useCallback(async () => {
    if (!settings.openRouterApiKey.trim()) {
      setError("no_key");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOpenRouterModels(settings.openRouterApiKey);
      setModels(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to fetch models");
    } finally {
      setLoading(false);
    }
  }, [settings.openRouterApiKey]);

  useEffect(() => {
    void fetchModels();
  }, [fetchModels]);

  // ── Filter + Search logic ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = models;

    // Category filter
    if (filter === "free") list = list.filter((m) => m.isFree);
    if (filter === "paid") list = list.filter((m) => !m.isFree);

    // Search: match name, id, description
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q),
      );
    }

    return list;
  }, [models, filter, search]);

  // ── Counts for filter badges ──────────────────────────────────────────────────
  const freeCount = useMemo(() => models.filter((m) => m.isFree).length,  [models]);
  const paidCount = useMemo(() => models.filter((m) => !m.isFree).length, [models]);
  const countFor  = (k: FilterCategory) => {
    if (k === "all")  return models.length;
    if (k === "free") return freeCount;
    return paidCount;
  };

  // ── Select handler ────────────────────────────────────────────────────────────
  const handleSelect = useCallback((id: string) => {
    setSelected(id);
  }, []);

  // ── Save + go back ────────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    updateSettings({ openRouterModel: selected });
    router.back();
  }, [selected, updateSettings]);

  // ── Render model item ─────────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: OpenRouterModel }) => (
      <ModelCard
        model={item}
        selected={selected === item.id}
        onSelect={handleSelect}
        colors={colors}
      />
    ),
    [selected, handleSelect, colors],
  );

  const keyExtractor = useCallback((item: OpenRouterModel) => item.id, []);

  // ── UI ────────────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>

      {/* ── Header ── */}
      <View
        style={[
          styles.header,
          {
            paddingTop:      Platform.OS === "web"
              ? Math.max(insets.top, 16) + 6
              : insets.top + 6,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => [
            styles.iconBtn,
            { backgroundColor: pressed ? colors.muted : "transparent" },
          ]}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Online Models</Text>
          {models.length > 0 && (
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {models.length} models · {freeCount} free
            </Text>
          )}
        </View>

        {/* Refresh button */}
        <Pressable
          onPress={() => void fetchModels()}
          hitSlop={8}
          disabled={loading}
          style={({ pressed }) => [
            styles.iconBtn,
            { backgroundColor: pressed ? colors.muted : "transparent", opacity: loading ? 0.4 : 1 },
          ]}
        >
          <Feather name="refresh-cw" size={18} color={colors.foreground} />
        </Pressable>
      </View>

      {/* ── Search bar ── */}
      <View style={[styles.searchWrap, { borderBottomColor: colors.border }]}>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.secondary, borderColor: colors.border },
          ]}
        >
          <Feather name="search" size={15} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search models…"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Feather name="x" size={14} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Category filter chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={[styles.filterScroll, { borderBottomColor: colors.border }]}
      >
        {FILTER_OPTIONS.map((opt) => {
          const active = filter === opt.key;
          const count  = countFor(opt.key);
          return (
            <Pressable
              key={opt.key}
              onPress={() => setFilter(opt.key)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.primary : colors.secondary,
                  borderColor:     active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={styles.chipEmoji}>{opt.emoji}</Text>
              <Text
                style={[
                  styles.chipLabel,
                  { color: active ? "#fff" : colors.foreground },
                ]}
              >
                {opt.label}
              </Text>
              {/* count badge */}
              {models.length > 0 && (
                <View
                  style={[
                    styles.chipBadge,
                    { backgroundColor: active ? "#ffffff30" : colors.muted },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipBadgeText,
                      { color: active ? "#fff" : colors.mutedForeground },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Content: Loading / Error / List ── */}
      {loading ? (
        // Loading state
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Fetching models…
          </Text>
        </View>

      ) : error === "no_key" ? (
        // No API key
        <EmptyState
          icon="🔑"
          title="API Key Required"
          subtitle="Go to Settings → ONLINE AI and add your OpenRouter API key to browse models."
          colors={colors}
        />

      ) : error ? (
        // Network / API error
        <View style={styles.centerWrap}>
          <EmptyState
            icon="⚠️"
            title="Could not load models"
            subtitle={error}
            colors={colors}
          />
          <Pressable
            onPress={() => void fetchModels()}
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          >
            <Feather name="refresh-cw" size={15} color="#fff" />
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>

      ) : filtered.length === 0 && models.length > 0 ? (
        // No search results
        <EmptyState
          icon="🔍"
          title="No models found"
          subtitle={`No models match "${search}". Try a different search term.`}
          colors={colors}
        />

      ) : (
        // Model list
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingBottom:
                Platform.OS === "web"
                  ? Math.max(insets.bottom, 24) + (dirty ? 80 : 24)
                  : insets.bottom + (dirty ? 100 : 32),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          // Performance
          removeClippedSubviews
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={8}
          // Currently-selected model scroll
          getItemLayout={(_, index) => ({
            length:  94, // approx card height
            offset:  94 * index,
            index,
          })}
        />
      )}

      {/* ── Save bar — shown only when selection changed ── */}
      {dirty && (
        <View
          style={[
            styles.saveBar,
            {
              backgroundColor: colors.card,
              borderTopColor:  colors.border,
              paddingBottom:
                Platform.OS === "web"
                  ? Math.max(insets.bottom, 16)
                  : insets.bottom + 8,
            },
          ]}
        >
          {/* Selected model name preview */}
          <View style={{ flex: 1 }}>
            <Text style={[styles.saveBarLabel, { color: colors.mutedForeground }]}>
              Selected
            </Text>
            <Text
              style={[styles.saveBarModel, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {models.find((m) => m.id === selected)?.name ?? selected}
            </Text>
          </View>

          {/* Confirm button */}
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="check" size={16} color="#fff" />
            <Text style={styles.saveBtnText}>Use This Model</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection:    "row",
    alignItems:       "center",
    paddingHorizontal: 8,
    paddingBottom:    10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap:              8,
  },
  title: {
    fontSize:   16,
    fontFamily: "Inter_700Bold",
    lineHeight: 20,
  },
  subtitle: {
    fontSize:   12,
    fontFamily: "Inter_400Regular",
  },
  iconBtn: {
    width:          38,
    height:         38,
    borderRadius:   12,
    alignItems:     "center",
    justifyContent: "center",
  },

  // Search
  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical:   10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBox: {
    flexDirection:  "row",
    alignItems:     "center",
    borderRadius:   12,
    borderWidth:    1,
    paddingHorizontal: 12,
    gap:            8,
    height:         42,
  },
  searchInput: {
    flex:       1,
    fontSize:   14,
    fontFamily: "Inter_400Regular",
    paddingVertical: 0,
  },

  // Filter chips
  filterScroll: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical:   10,
    gap:               8,
    alignItems:        "center",
  },
  chip: {
    flexDirection:    "row",
    alignItems:       "center",
    gap:              5,
    paddingHorizontal: 12,
    paddingVertical:   7,
    borderRadius:     20,
    borderWidth:      1,
  },
  chipEmoji: { fontSize: 13 },
  chipLabel: {
    fontSize:   13,
    fontFamily: "Inter_600SemiBold",
  },
  chipBadge: {
    paddingHorizontal: 6,
    paddingVertical:   1,
    borderRadius:      10,
    minWidth:          22,
    alignItems:        "center",
  },
  chipBadgeText: {
    fontSize:   10.5,
    fontFamily: "Inter_700Bold",
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingTop:        12,
  },

  // Center states (loading, error, empty)
  centerWrap: {
    flex:           1,
    alignItems:     "center",
    justifyContent: "center",
    gap:            16,
  },
  loadingText: {
    fontSize:   14,
    fontFamily: "Inter_400Regular",
    marginTop:  8,
  },
  retryBtn: {
    flexDirection:  "row",
    alignItems:     "center",
    gap:            8,
    paddingHorizontal: 20,
    paddingVertical:   10,
    borderRadius:   12,
  },
  retryText: {
    fontSize:   14,
    fontFamily: "Inter_600SemiBold",
    color:      "#fff",
  },

  // Save bar
  saveBar: {
    flexDirection:    "row",
    alignItems:       "center",
    paddingHorizontal: 16,
    paddingTop:       14,
    borderTopWidth:   StyleSheet.hairlineWidth,
    gap:              12,
  },
  saveBarLabel: {
    fontSize:   11,
    fontFamily: "Inter_400Regular",
    marginBottom: 2,
  },
  saveBarModel: {
    fontSize:   13.5,
    fontFamily: "Inter_600SemiBold",
  },
  saveBtn: {
    flexDirection:    "row",
    alignItems:       "center",
    gap:              7,
    paddingHorizontal: 18,
    paddingVertical:   11,
    borderRadius:     12,
  },
  saveBtnText: {
    fontSize:   14,
    fontFamily: "Inter_700Bold",
    color:      "#fff",
  },
});