import * as FileSystem from "expo-file-system/legacy";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useModels } from "@/context/ModelContext";
import { useColors } from "@/hooks/useColors";
import { formatBytes } from "@/lib/models";

type ModelFileInfo = {
  id: string;
  name: string;
  shortName: string;
  sizeLabel: string;
  expectedBytes: number;
  actualBytes: number;
  downloadedAt: number;
  localPath: string;
};

const DEVICE_STORAGE_ESTIMATE = 64 * 1024 * 1024 * 1024; // 64 GB baseline for bar display

export default function StorageScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { downloadedModels, models, deleteModel } = useModels();
  const [fileInfos, setFileInfos] = useState<ModelFileInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFileSizes = useCallback(async () => {
    setLoading(true);
    const results: ModelFileInfo[] = [];
    for (const dm of downloadedModels) {
      const model = models.find((m) => m.id === dm.id);
      if (!model) continue;
      let actualBytes = 0;
      try {
        const info = await FileSystem.getInfoAsync(dm.localPath);
        if (info.exists) actualBytes = (info as unknown as { size?: number }).size ?? 0;
      } catch {
        actualBytes = model.sizeBytes;
      }
      results.push({
        id: dm.id,
        name: model.name,
        shortName: model.shortName,
        sizeLabel: model.sizeLabel,
        expectedBytes: model.sizeBytes,
        actualBytes,
        downloadedAt: dm.downloadedAt,
        localPath: dm.localPath,
      });
    }
    results.sort((a, b) => b.actualBytes - a.actualBytes);
    setFileInfos(results);
    setLoading(false);
  }, [downloadedModels, models]);

  useEffect(() => { void loadFileSizes(); }, [loadFileSizes]);

  const totalBytes = fileInfos.reduce((s, f) => s + f.actualBytes, 0);
  const storageRatio = Math.min(totalBytes / DEVICE_STORAGE_ESTIMATE, 1);

  const handleDeleteOne = (id: string, name: string) => {
    Alert.alert(
      "Delete model?",
      `"${name}" will be removed from your device. You can re-download it anytime.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete", style: "destructive",
          onPress: () => {
            deleteModel(id);
            setFileInfos((prev) => prev.filter((f) => f.id !== id));
          },
        },
      ],
    );
  };

  const handleDeleteAll = () => {
    if (fileInfos.length === 0) return;
    Alert.alert(
      "Delete all models?",
      `This will remove all ${fileInfos.length} downloaded model${fileInfos.length === 1 ? "" : "s"} (${formatBytes(totalBytes)}) from your device.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All", style: "destructive",
          onPress: () => {
            fileInfos.forEach((f) => deleteModel(f.id));
            setFileInfos([]);
          },
        },
      ],
    );
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
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
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Storage</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Platform.OS === "web" ? Math.max(insets.bottom, 24) + 16 : insets.bottom + 32,
          gap: 14,
        }}
      >
        {/* ── Total storage card ── */}
        <View style={[styles.totalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.totalTop}>
            <View style={[styles.totalIconWrap, { backgroundColor: colors.primary + "18" }]}>
              <Feather name="hard-drive" size={22} color={colors.primary} />
            </View>
            <View style={styles.totalInfo}>
              <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Models on Device</Text>
              <Text style={[styles.totalBytes, { color: colors.foreground }]}>
                {loading ? "Calculating…" : totalBytes > 0 ? formatBytes(totalBytes) : "0 MB"}
              </Text>
            </View>
            <View style={[styles.countBadge, { backgroundColor: colors.primary + "18" }]}>
              <Text style={[styles.countBadgeText, { color: colors.primary }]}>
                {fileInfos.length} file{fileInfos.length !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>

          {/* Storage bar */}
          <View style={[styles.barBg, { backgroundColor: colors.secondary }]}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.max(storageRatio * 100, totalBytes > 0 ? 2 : 0)}%` as `${number}%`,
                  backgroundColor: storageRatio > 0.85 ? colors.destructive : storageRatio > 0.6 ? colors.warning : colors.primary,
                },
              ]}
            />
          </View>
          <Text style={[styles.barLabel, { color: colors.mutedForeground }]}>
            {totalBytes > 0
              ? `${formatBytes(totalBytes)} used by AI models`
              : "No models downloaded yet"}
          </Text>
        </View>

        {/* ── Delete All button ── */}
        {fileInfos.length > 0 && (
          <Pressable
            onPress={handleDeleteAll}
            style={({ pressed }) => [
              styles.deleteAllBtn,
              { backgroundColor: colors.destructive + (pressed ? "dd" : "18"), borderColor: colors.destructive + "55" },
            ]}
          >
            <Feather name="trash-2" size={16} color={colors.destructive} />
            <Text style={[styles.deleteAllText, { color: colors.destructive }]}>
              Delete All Models · Free {formatBytes(totalBytes)}
            </Text>
          </Pressable>
        )}

        {/* ── Per-model list ── */}
        {loading ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="loader" size={22} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Reading file sizes…</Text>
          </View>
        ) : fileInfos.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="inbox" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No models downloaded</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Go to Models and download a model to see it here.
            </Text>
            <Pressable
              onPress={() => router.replace("/models")}
              style={({ pressed }) => [styles.goToModelsBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
            >
              <Feather name="download" size={15} color={colors.primaryForeground} />
              <Text style={[styles.goToModelsBtnText, { color: colors.primaryForeground }]}>Browse Models</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              DOWNLOADED MODELS
            </Text>
            {fileInfos.map((f, idx) => {
              const barWidth = totalBytes > 0 ? (f.actualBytes / totalBytes) * 100 : 0;
              return (
                <View
                  key={f.id}
                  style={[styles.modelRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  {/* Rank */}
                  <View style={[styles.rankBadge, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.rankText, { color: colors.mutedForeground }]}>
                      #{idx + 1}
                    </Text>
                  </View>

                  <View style={styles.modelRowContent}>
                    <View style={styles.modelRowTop}>
                      <Text style={[styles.modelName, { color: colors.foreground }]} numberOfLines={1}>
                        {f.shortName}
                      </Text>
                      <Text style={[styles.modelSize, { color: colors.primary }]}>
                        {formatBytes(f.actualBytes)}
                      </Text>
                    </View>
                    <Text style={[styles.modelDate, { color: colors.mutedForeground }]}>
                      Downloaded {formatDate(f.downloadedAt)}
                    </Text>

                    {/* Mini bar */}
                    <View style={[styles.miniBarBg, { backgroundColor: colors.secondary }]}>
                      <View
                        style={[
                          styles.miniBarFill,
                          {
                            width: `${Math.max(barWidth, barWidth > 0 ? 2 : 0)}%` as `${number}%`,
                            backgroundColor: colors.primary + "90",
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Delete button */}
                  <Pressable
                    onPress={() => handleDeleteOne(f.id, f.name)}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.deleteBtn,
                      { backgroundColor: pressed ? colors.destructive + "22" : colors.secondary },
                    ]}
                  >
                    <Feather name="trash-2" size={16} color={colors.destructive} />
                  </Pressable>
                </View>
              );
            })}
          </>
        )}

        {/* ── Tips card ── */}
        <View style={[styles.tipsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="info" size={15} color={colors.mutedForeground} />
          <Text style={[styles.tipsText, { color: colors.mutedForeground }]}>
            Models are stored in the app's private directory. Uninstalling the app will also remove all downloaded models.
          </Text>
        </View>
      </ScrollView>
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
  // Total card
  totalCard: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 12 },
  totalTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  totalIconWrap: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  totalInfo: { flex: 1, gap: 2 },
  totalLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  totalBytes: { fontSize: 26, fontFamily: "Inter_700Bold", lineHeight: 30 },
  countBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  countBadgeText: { fontSize: 12.5, fontFamily: "Inter_600SemiBold" },
  barBg: { height: 8, borderRadius: 999, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 999 },
  barLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  // Delete all
  deleteAllBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, padding: 14, borderRadius: 14, borderWidth: 1,
  },
  deleteAllText: { fontSize: 14.5, fontFamily: "Inter_600SemiBold" },
  // Section label
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: -4 },
  // Model row
  modelRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 16, borderWidth: 1, padding: 12,
  },
  rankBadge: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rankText: { fontSize: 11.5, fontFamily: "Inter_700Bold" },
  modelRowContent: { flex: 1, gap: 4 },
  modelRowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modelName: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold", marginRight: 8 },
  modelSize: { fontSize: 14, fontFamily: "Inter_700Bold" },
  modelDate: { fontSize: 11.5, fontFamily: "Inter_400Regular" },
  miniBarBg: { height: 4, borderRadius: 999, overflow: "hidden", marginTop: 2 },
  miniBarFill: { height: "100%", borderRadius: 999 },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  // Empty
  emptyCard: { padding: 36, borderRadius: 20, borderWidth: 1, alignItems: "center", gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
  goToModelsBtn: { flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 11, paddingHorizontal: 20, borderRadius: 12, marginTop: 4 },
  goToModelsBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  // Tips
  tipsCard: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: "flex-start" },
  tipsText: { flex: 1, fontSize: 12.5, lineHeight: 17, fontFamily: "Inter_400Regular" },
});
