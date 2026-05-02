import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
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
import { formatBytes } from "@/lib/models";

export default function ModelsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    models,
    downloadedIds,
    downloadedModels,
    activeModelId,
    downloadState,
    startDownload,
    cancelDownload,
    deleteModel,
    setActiveModel,
    addCustomModel,
  } = useModels();

  const [showCustom, setShowCustom] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const [customName, setCustomName] = useState("");

  const downloadedCount = downloadedIds.length;

  const totalBytes = downloadedModels.reduce((sum, dm) => {
    const model = models.find((m) => m.id === dm.id);
    return sum + (model?.sizeBytes ?? 0);
  }, 0);

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
        <Text style={[styles.title, { color: colors.foreground }]}>Models</Text>
        <Pressable
          onPress={() => setShowCustom((p) => !p)}
          hitSlop={8}
          style={({ pressed }) => [styles.iconBtn, { backgroundColor: pressed ? colors.muted : "transparent" }]}
        >
          <Feather name="plus" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Platform.OS === "web" ? Math.max(insets.bottom, 24) + 16 : insets.bottom + 24,
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
                ? `${formatBytes(totalBytes)} used on device`
                : "Once downloaded, models run on-device with no internet."}
            </Text>
          </View>
        </View>

        {/* Custom model URL input */}
        {showCustom && (
          <View style={[styles.customCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <Text style={[styles.customTitle, { color: colors.foreground }]}>Add custom GGUF model</Text>
            <TextInput
              value={customName}
              onChangeText={setCustomName}
              placeholder="Model name (e.g. Mistral 7B Q4)"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.customInput, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: colors.border }]}
            />
            <TextInput
              value={customUrl}
              onChangeText={setCustomUrl}
              placeholder="https://huggingface.co/.../model.gguf"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              keyboardType="url"
              style={[styles.customInput, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: colors.border }]}
            />
            <View style={styles.customActions}>
              <Pressable
                onPress={() => { setShowCustom(false); setCustomUrl(""); setCustomName(""); }}
                style={[styles.customBtn, { backgroundColor: colors.secondary }]}
              >
                <Text style={[styles.customBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAddCustom}
                style={[styles.customBtn, { backgroundColor: colors.primary, flex: 1 }]}
              >
                <Feather name="plus" size={14} color={colors.primaryForeground} />
                <Text style={[styles.customBtnText, { color: colors.primaryForeground }]}>Add model</Text>
              </Pressable>
            </View>
          </View>
        )}

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

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="info" size={16} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Tip: download over Wi-Fi. Files are large and stay on your device forever once downloaded. Tap + to add any GGUF from Hugging Face.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 17, fontFamily: "Inter_700Bold" },
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  summary: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: "flex-start" },
  summaryText: { flex: 1, gap: 2 },
  summaryTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  summarySub: { fontSize: 12.5, fontFamily: "Inter_400Regular", lineHeight: 17 },
  customCard: { borderRadius: 16, borderWidth: 1.5, padding: 14, gap: 10 },
  customTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  customInput: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13.5, fontFamily: "Inter_400Regular" },
  customActions: { flexDirection: "row", gap: 8 },
  customBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  customBtnText: { fontSize: 13.5, fontFamily: "Inter_600SemiBold" },
  infoCard: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: "flex-start" },
  infoText: { flex: 1, fontSize: 12.5, lineHeight: 17, fontFamily: "Inter_400Regular" },
});
