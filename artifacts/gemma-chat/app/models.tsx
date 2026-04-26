import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ModelCard } from "@/components/ModelCard";
import { useModels } from "@/context/ModelContext";
import { useColors } from "@/hooks/useColors";
import { getRecommendedModel } from "@/lib/models";

// Honor 9 Lite = 3GB RAM
const DEVICE_RAM_GB = 3;

export default function ModelsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    models,
    downloadedIds,
    activeModelId,
    downloadState,
    startDownload,
    cancelDownload,
    deleteModel,
    setActiveModel,
  } = useModels();

  const downloadedCount = downloadedIds.length;
  const recommendedModel = getRecommendedModel(DEVICE_RAM_GB);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop:
              Platform.OS === "web"
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
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Models</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom:
            Platform.OS === "web"
              ? Math.max(insets.bottom, 24) + 16
              : insets.bottom + 24,
          gap: 12,
        }}
      >
        {/* Downloaded summary */}
        <View
          style={[
            styles.summary,
            { backgroundColor: colors.accent, borderColor: colors.primary },
          ]}
        >
          <Feather name="hard-drive" size={18} color={colors.primary} />
          <View style={styles.summaryText}>
            <Text style={[styles.summaryTitle, { color: colors.accentForeground }]}>
              {downloadedCount === 0
                ? "No models downloaded yet"
                : `${downloadedCount} model${downloadedCount === 1 ? "" : "s"} ready offline`}
            </Text>
            <Text
              style={[styles.summarySub, { color: colors.accentForeground, opacity: 0.85 }]}
            >
              Once downloaded, models run on-device with no internet.
            </Text>
          </View>
        </View>

        {/* ✅ RAM-based recommendation banner */}
        <View
          style={[
            styles.ramBanner,
            { backgroundColor: colors.success + "18", borderColor: colors.success + "44" },
          ]}
        >
          <Feather name="cpu" size={16} color={colors.success} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.ramBannerTitle, { color: colors.success }]}>
              Best for your device ({DEVICE_RAM_GB}GB RAM)
            </Text>
            <Text style={[styles.ramBannerSub, { color: colors.mutedForeground }]}>
              {recommendedModel.name} — {recommendedModel.sizeLabel}
            </Text>
          </View>
        </View>

        {models.map((m) => (
          <ModelCard
            key={m.id}
            model={m}
            downloadState={downloadState[m.id]}
            isDownloaded={downloadedIds.includes(m.id)}
            isActive={activeModelId === m.id}
            onDownload={() => startDownload(m.id)}
            onCancel={() => cancelDownload(m.id)}
            onDelete={() => deleteModel(m.id)}
            onActivate={() => setActiveModel(m.id)}
          />
        ))}

        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="info" size={16} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Tip: download over Wi-Fi. Files are large and stay on your device
            forever once downloaded.
          </Text>
        </View>
      </ScrollView>
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
  iconBtn: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  summary: {
    flexDirection: "row", gap: 12, padding: 14,
    borderRadius: 14, borderWidth: 1, alignItems: "flex-start",
  },
  summaryText: { flex: 1, gap: 2 },
  summaryTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  summarySub: { fontSize: 12.5, fontFamily: "Inter_400Regular", lineHeight: 17 },
  // ✅ RAM banner
  ramBanner: {
    flexDirection: "row", alignItems: "center",
    gap: 10, padding: 12, borderRadius: 12, borderWidth: 1,
  },
  ramBannerTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  ramBannerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  infoCard: {
    flexDirection: "row", gap: 10, padding: 14,
    borderRadius: 14, borderWidth: 1, alignItems: "flex-start",
  },
  infoText: { flex: 1, fontSize: 12.5, lineHeight: 17, fontFamily: "Inter_400Regular" },
});