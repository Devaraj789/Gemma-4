import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useMemo } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ModelCard } from "@/components/ModelCard";
import { useModels } from "@/context/ModelContext";
import { useColors } from "@/hooks/useColors";
import { formatBytes, type Capability } from "@/lib/models";

type CapFilter = Capability | "all";
type SizeFilter = "all" | "small" | "medium" | "large";

const CAP_FILTERS: { value: CapFilter; label: string; icon: React.ComponentProps<typeof Feather>["name"]; color: string }[] = [
  { value: "all",       label: "All",       icon: "grid",           color: "#6b7280" },
  { value: "vision",    label: "Vision",    icon: "eye",            color: "#f59e0b" },
  { value: "reasoning", label: "Reasoning", icon: "cpu",            color: "#a855f7" },
  { value: "tool_use",  label: "Tool Use",  icon: "tool",           color: "#06b6d4" },
  { value: "coding",    label: "Coding",    icon: "code",           color: "#3b82f6" },
  { value: "chat",      label: "Chat",      icon: "message-circle", color: "#22c55e" },
];

// Feature 4: Model size filter
const SIZE_FILTERS: { value: SizeFilter; label: string; icon: React.ComponentProps<typeof Feather>["name"]; color: string; desc: string }[] = [
  { value: "all",    label: "All sizes", icon: "layers",    color: "#6b7280", desc: "" },
  { value: "small",  label: "< 1 GB",   icon: "zap",       color: "#22c55e", desc: "Fast download" },
  { value: "medium", label: "1–3 GB",   icon: "activity",  color: "#f59e0b", desc: "Balanced" },
  { value: "large",  label: "> 3 GB",   icon: "database",  color: "#6366f1", desc: "Most powerful" },
];

function matchesSize(sizeBytes: number, filter: SizeFilter): boolean {
  if (filter === "all") return true;
  if (filter === "small")  return sizeBytes < 1_000_000_000;
  if (filter === "medium") return sizeBytes >= 1_000_000_000 && sizeBytes < 3_000_000_000;
  if (filter === "large")  return sizeBytes >= 3_000_000_000;
  return true;
}

export default function ModelsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    models,
    downloadedIds,
    downloadedModels,
    activeModelId,
    downloadState,
    downloadQueue,
    startDownload,
    cancelDownload,
    deleteModel,
    setActiveModel,
    addCustomModel,
    addToQueue,
    removeFromQueue,
    clearQueue,
    startQueue,
  } = useModels();

  const [showCustom, setShowCustom] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const [customName, setCustomName] = useState("");
  const [capFilter, setCapFilter] = useState<CapFilter>("all");
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>("all");

  const downloadedCount = downloadedIds.length;
  const totalBytes = downloadedModels.reduce((sum, dm) => {
    const model = models.find((m) => m.id === dm.id);
    return sum + (model?.sizeBytes ?? 0);
  }, 0);

  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      const capMatch = capFilter === "all" || m.capabilities?.includes(capFilter as Capability);
      const sizeMatch = matchesSize(m.sizeBytes, sizeFilter);
      return capMatch && sizeMatch;
    });
  }, [models, capFilter, sizeFilter]);

  const isAnyDownloading = Object.values(downloadState).some((d) => d.status === "downloading");
  const queueCount = downloadQueue.length;
  const showQueueBar = queueCount > 0 || isAnyDownloading;

  const handleAddCustom = () => {
    const url = customUrl.trim();
    const name = customName.trim();
    if (!url || !name) {
      Alert.alert("Missing info", "Enter both a name and a download URL.");
      return;
    }
    if (!url.endsWith(".gguf")) {
      Alert.alert("Invalid URL", "URL must end with .gguf");
      return;
    }
    addCustomModel({ name, url });
    setCustomUrl("");
    setCustomName("");
    setShowCustom(false);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, {
        paddingTop: Platform.OS === "web" ? Math.max(insets.top, 16) + 6 : insets.top + 6,
        borderBottomColor: colors.border,
      }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}
          style={({ pressed }) => [styles.iconBtn, { backgroundColor: pressed ? colors.muted : "transparent" }]}>
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Models</Text>
        <View style={styles.headerRight}>
          <Pressable onPress={() => router.push("/storage")} hitSlop={8}
            style={({ pressed }) => [styles.iconBtn, { backgroundColor: pressed ? colors.muted : "transparent" }]}>
            <Feather name="hard-drive" size={20} color={colors.mutedForeground} />
          </Pressable>
          <Pressable onPress={() => setShowCustom((p) => !p)} hitSlop={8}
            style={({ pressed }) => [styles.iconBtn, { backgroundColor: pressed ? colors.muted : "transparent" }]}>
            <Feather name="plus" size={22} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {/* Capability filter row */}
      <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {CAP_FILTERS.map((f) => {
            const active = capFilter === f.value;
            return (
              <Pressable key={f.value} onPress={() => setCapFilter(f.value)}
                style={[styles.filterChip, {
                  backgroundColor: active ? f.color + "22" : colors.secondary,
                  borderColor: active ? f.color : colors.border,
                  borderWidth: active ? 1.5 : 1,
                }]}>
                <Feather name={f.icon} size={13} color={active ? f.color : colors.mutedForeground} />
                <Text style={[styles.filterChipText, { color: active ? f.color : colors.mutedForeground }]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Feature 4: Size filter row */}
      <View style={[styles.sizeBar, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {SIZE_FILTERS.map((f) => {
            const active = sizeFilter === f.value;
            return (
              <Pressable key={f.value} onPress={() => setSizeFilter(f.value)}
                style={[styles.sizeChip, {
                  backgroundColor: active ? f.color + "18" : "transparent",
                  borderColor: active ? f.color : colors.border,
                  borderWidth: active ? 1.5 : 1,
                }]}>
                <Feather name={f.icon} size={12} color={active ? f.color : colors.mutedForeground} />
                <Text style={[styles.sizeChipText, { color: active ? f.color : colors.mutedForeground }]}>
                  {f.label}
                </Text>
                {f.desc ? (
                  <Text style={[styles.sizeChipDesc, { color: active ? f.color : colors.mutedForeground, opacity: 0.7 }]}>
                    · {f.desc}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: showQueueBar
            ? 110
            : Platform.OS === "web" ? Math.max(insets.bottom, 24) + 16 : insets.bottom + 24,
          gap: 12,
        }}
      >
        {/* Storage summary */}
        <View style={[styles.summary, { backgroundColor: colors.accent, borderColor: colors.primary }]}>
          <Feather name="hard-drive" size={18} color={colors.primary} />
          <View style={styles.summaryText}>
            <Text style={[styles.summaryTitle, { color: colors.accentForeground }]}>
              {downloadedCount === 0
                ? "No models downloaded yet"
                : `${downloadedCount} model${downloadedCount === 1 ? "" : "s"} ready offline`}
            </Text>
            <Text style={[styles.summarySub, { color: colors.accentForeground, opacity: 0.85 }]}>
              {totalBytes > 0
                ? `${formatBytes(totalBytes)} used · ${filteredModels.length} models shown`
                : `${filteredModels.length} models available · Download over Wi-Fi`}
            </Text>
          </View>
        </View>

        {/* Custom model input */}
        {showCustom && (
          <View style={[styles.customCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <Text style={[styles.customTitle, { color: colors.foreground }]}>Add custom GGUF model</Text>
            <TextInput
              value={customName} onChangeText={setCustomName}
              placeholder="Model name (e.g. Mistral 7B Q4)"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.customInput, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: colors.border }]}
            />
            <TextInput
              value={customUrl} onChangeText={setCustomUrl}
              placeholder="https://huggingface.co/.../model.gguf"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none" keyboardType="url"
              style={[styles.customInput, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: colors.border }]}
            />
            <View style={styles.customActions}>
              <Pressable onPress={() => { setShowCustom(false); setCustomUrl(""); setCustomName(""); }}
                style={[styles.customBtn, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.customBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleAddCustom}
                style={[styles.customBtn, { backgroundColor: colors.primary, flex: 1 }]}>
                <Feather name="plus" size={14} color={colors.primaryForeground} />
                <Text style={[styles.customBtnText, { color: colors.primaryForeground }]}>Add model</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Model cards */}
        {filteredModels.length === 0 ? (
          <View style={[styles.emptyFilter, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={24} color={colors.mutedForeground} />
            <Text style={[styles.emptyFilterText, { color: colors.mutedForeground }]}>
              No models match this filter
            </Text>
          </View>
        ) : (
          filteredModels.map((m) => {
            const queuePos = downloadQueue.indexOf(m.id);
            return (
              <ModelCard
                key={m.id}
                model={m}
                downloadState={downloadState[m.id]}
                isDownloaded={downloadedIds.includes(m.id)}
                isActive={activeModelId === m.id}
                isQueued={queuePos >= 0}
                queuePosition={queuePos >= 0 ? queuePos + 1 : undefined}
                onDownload={() => startDownload(m.id)}
                onCancel={() => cancelDownload(m.id)}
                onDelete={() => deleteModel(m.id)}
                onActivate={() => setActiveModel(m.id)}
                onAddToQueue={() => addToQueue(m.id)}
                onRemoveFromQueue={() => removeFromQueue(m.id)}
                onTryPrompt={(prompt) => {
                  if (downloadedIds.includes(m.id)) setActiveModel(m.id);
                  router.back();
                  router.push({ pathname: "/", params: { prompt } });
                }}
              />
            );
          })
        )}

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="info" size={16} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Tap "+ Queue" to schedule multiple downloads. They run one by one automatically over Wi-Fi.
          </Text>
        </View>
      </ScrollView>

      {/* Download Queue Bar */}
      {showQueueBar && (
        <View style={[styles.queueBar, {
          backgroundColor: colors.card,
          borderTopColor: colors.primary + "40",
          paddingBottom: Platform.OS === "web" ? Math.max(insets.bottom, 12) : insets.bottom + 8,
        }]}>
          {isAnyDownloading && (() => {
            const activeEntry = Object.entries(downloadState).find(([, d]) => d.status === "downloading");
            if (!activeEntry) return null;
            const [activeId, activeDs] = activeEntry;
            const activeModel = models.find((m) => m.id === activeId);
            return (
              <View style={styles.queueActiveRow}>
                <View style={styles.queueActiveLeft}>
                  <View style={[styles.queueDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.queueActiveName, { color: colors.foreground }]} numberOfLines={1}>
                    {activeModel?.shortName ?? activeId}
                  </Text>
                  <Text style={[styles.queueActivePct, { color: colors.primary }]}>
                    {Math.round(activeDs.progress * 100)}%
                  </Text>
                </View>
                {queueCount > 0 && (
                  <Text style={[styles.queueWaiting, { color: colors.mutedForeground }]}>
                    +{queueCount} waiting
                  </Text>
                )}
              </View>
            );
          })()}
          <View style={styles.queueControls}>
            <View style={styles.queueLeft}>
              <Feather name="list" size={15} color={colors.primary} />
              <Text style={[styles.queueLabel, { color: colors.foreground }]}>
                {isAnyDownloading
                  ? queueCount > 0 ? `${queueCount} model${queueCount === 1 ? "" : "s"} queued` : "Downloading…"
                  : `${queueCount} model${queueCount === 1 ? "" : "s"} in queue`}
              </Text>
            </View>
            <View style={styles.queueActions}>
              {!isAnyDownloading && queueCount > 0 && (
                <Pressable onPress={startQueue}
                  style={({ pressed }) => [styles.queueBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}>
                  <Feather name="play" size={13} color={colors.primaryForeground} />
                  <Text style={[styles.queueBtnText, { color: colors.primaryForeground }]}>Start</Text>
                </Pressable>
              )}
              <Pressable onPress={clearQueue}
                style={({ pressed }) => [styles.queueBtn, { backgroundColor: colors.secondary, opacity: pressed ? 0.85 : 1 }]}>
                <Feather name="x" size={13} color={colors.mutedForeground} />
                <Text style={[styles.queueBtnText, { color: colors.mutedForeground }]}>Clear</Text>
              </Pressable>
            </View>
          </View>
        </View>
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
  headerRight: { flexDirection: "row", alignItems: "center", gap: 2 },
  filterBar: { borderBottomWidth: StyleSheet.hairlineWidth },
  sizeBar: { borderBottomWidth: StyleSheet.hairlineWidth },
  filterScroll: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  filterChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  filterChipText: { fontSize: 12.5, fontFamily: "Inter_600SemiBold" },
  sizeChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16,
  },
  sizeChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  sizeChipDesc: { fontSize: 11, fontFamily: "Inter_400Regular" },
  summary: {
    flexDirection: "row", gap: 12, padding: 14,
    borderRadius: 14, borderWidth: 1, alignItems: "flex-start",
  },
  summaryText: { flex: 1, gap: 2 },
  summaryTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  summarySub: { fontSize: 12.5, fontFamily: "Inter_400Regular", lineHeight: 17 },
  customCard: { borderRadius: 16, borderWidth: 1.5, padding: 14, gap: 10 },
  customTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  customInput: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13.5, fontFamily: "Inter_400Regular" },
  customActions: { flexDirection: "row", gap: 8 },
  customBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  customBtnText: { fontSize: 13.5, fontFamily: "Inter_600SemiBold" },
  emptyFilter: { padding: 32, borderRadius: 16, borderWidth: 1, alignItems: "center", gap: 8 },
  emptyFilterText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  infoCard: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: "flex-start" },
  infoText: { flex: 1, fontSize: 12.5, lineHeight: 17, fontFamily: "Inter_400Regular" },
  queueBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopWidth: 1.5, paddingTop: 10, paddingHorizontal: 16, gap: 6,
    shadowColor: "#000", shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 10,
  },
  queueActiveRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  queueActiveLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  queueDot: { width: 8, height: 8, borderRadius: 4 },
  queueActiveName: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
  queueActivePct: { fontSize: 13, fontFamily: "Inter_700Bold" },
  queueWaiting: { fontSize: 12, fontFamily: "Inter_400Regular" },
  queueControls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  queueLeft: { flexDirection: "row", alignItems: "center", gap: 7, flex: 1 },
  queueLabel: { fontSize: 13.5, fontFamily: "Inter_600SemiBold" },
  queueActions: { flexDirection: "row", gap: 8 },
  queueBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
  },
  queueBtnText: { fontSize: 12.5, fontFamily: "Inter_600SemiBold" },
});
