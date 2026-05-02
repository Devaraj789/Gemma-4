import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ProgressBar } from "@/components/ProgressBar";
import { ModelSuggestionsSheet } from "@/components/ModelSuggestionsSheet";
import type { DownloadState } from "@/context/ModelContext";
import { useColors } from "@/hooks/useColors";
import type { Capability, ModelVariant } from "@/lib/models";

type Props = {
  model: ModelVariant;
  downloadState: DownloadState | undefined;
  isDownloaded: boolean;
  isActive: boolean;
  isQueued?: boolean;
  queuePosition?: number;
  onDownload: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onActivate: () => void;
  onAddToQueue?: () => void;
  onRemoveFromQueue?: () => void;
  onTryPrompt?: (prompt: string) => void;
};

type CapabilityConfig = {
  label: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  color: string;
};

const CAPABILITY_CONFIG: Record<Capability, CapabilityConfig> = {
  chat:       { label: "Chat",       icon: "message-circle", color: "#22c55e" },
  coding:     { label: "Coding",     icon: "code",           color: "#3b82f6" },
  vision:     { label: "Vision",     icon: "eye",            color: "#f59e0b" },
  reasoning:  { label: "Reasoning",  icon: "cpu",            color: "#a855f7" },
  tool_use:   { label: "Tool Use",   icon: "tool",           color: "#06b6d4" },
  tamil:      { label: "Tamil",      icon: "globe",          color: "#f97316" },
  uncensored: { label: "Uncensored", icon: "unlock",         color: "#ef4444" },
};

export function ModelCard({
  model,
  downloadState,
  isDownloaded,
  isActive,
  isQueued = false,
  queuePosition,
  onDownload,
  onCancel,
  onDelete,
  onActivate,
  onAddToQueue,
  onRemoveFromQueue,
  onTryPrompt,
}: Props) {
  const colors = useColors();
  const [sheetOpen, setSheetOpen] = useState(false);
  const status = downloadState?.status ?? "idle";
  const progress = downloadState?.progress ?? 0;
  const isLoading = status === "loading";
  const hasCaps = (model.capabilities?.length ?? 0) > 0;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isActive ? colors.primary : isQueued ? colors.primary + "60" : colors.border,
          borderWidth: isActive ? 1.5 : isQueued ? 1.5 : 1,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          {model.recommended && (
            <View style={[styles.pillRecommended, { backgroundColor: colors.accent }]}>
              <Text style={[styles.pillText, { color: colors.accentForeground }]}>⭐ Recommended</Text>
            </View>
          )}
          {isQueued && (
            <View style={[styles.pillQueued, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "50" }]}>
              <Feather name="clock" size={11} color={colors.primary} />
              <Text style={[styles.pillText, { color: colors.primary }]}>
                Queue #{queuePosition}
              </Text>
            </View>
          )}
          <Text style={[styles.title, { color: colors.foreground }]}>{model.name}</Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>{model.description}</Text>
        </View>
      </View>

      {/* Capability icons */}
      {hasCaps && (
        <View style={styles.capRow}>
          {model.capabilities!.map((cap) => {
            const cfg = CAPABILITY_CONFIG[cap];
            if (!cfg) return null;
            return (
              <View
                key={cap}
                style={[styles.capIcon, { backgroundColor: cfg.color + "20", borderColor: cfg.color + "50" }]}
              >
                <Feather name={cfg.icon} size={13} color={cfg.color} />
                <Text style={[styles.capLabel, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* RAM warning */}
      {model.ramWarning && (
        <View style={[styles.ramWarn, { backgroundColor: colors.warning + "22", borderColor: colors.warning + "55" }]}>
          <Feather name="alert-triangle" size={13} color={colors.warning} />
          <Text style={[styles.ramWarnText, { color: colors.warning }]}>
            Requires {model.ramRequiredGb}GB+ RAM — may be slow on low-end devices
          </Text>
        </View>
      )}

      {/* Badges */}
      <View style={styles.badgeRow}>
        {model.badges.map((b) => (
          <View key={b} style={[styles.badge, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.badgeText, { color: colors.secondaryForeground }]}>{b}</Text>
          </View>
        ))}
        <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.badgeText, { color: colors.secondaryForeground }]}>{model.sizeLabel}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.badgeText, { color: colors.secondaryForeground }]}>{model.ramRequiredGb}+ GB RAM</Text>
        </View>
      </View>

      {/* Download progress */}
      {status === "downloading" && (
        <View style={styles.downloadProgress}>
          <View style={styles.progressLabelRow}>
            <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
              Downloading {Math.round(progress * 100)}%
            </Text>
            <Pressable onPress={onCancel} hitSlop={8}>
              <Text style={[styles.cancelText, { color: colors.destructive }]}>Cancel</Text>
            </Pressable>
          </View>
          <ProgressBar progress={progress} />
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsCol}>
        <View style={styles.actionsRow}>
          {isDownloaded ? (
            <>
              <Pressable
                onPress={onActivate}
                disabled={isActive || isLoading}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: isActive ? colors.muted : colors.primary, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Feather
                  name={isLoading ? "loader" : isActive ? "check" : "zap"}
                  size={16}
                  color={isActive ? colors.mutedForeground : colors.primaryForeground}
                />
                <Text style={[styles.primaryBtnText, { color: isActive ? colors.mutedForeground : colors.primaryForeground }]}>
                  {isLoading ? "Loading…" : isActive ? "Active" : "Use this model"}
                </Text>
              </Pressable>
              <Pressable
                onPress={onDelete}
                style={({ pressed }) => [
                  styles.iconOnlyBtn,
                  { backgroundColor: colors.secondary, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Feather name="trash-2" size={16} color={colors.destructive} />
              </Pressable>
            </>
          ) : status === "downloading" ? null : (
            <>
              {/* Download now */}
              <Pressable
                onPress={onDownload}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Feather name="download" size={16} color={colors.primaryForeground} />
                <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>Download</Text>
              </Pressable>

              {/* Add to queue / remove from queue */}
              {isQueued ? (
                <Pressable
                  onPress={onRemoveFromQueue}
                  style={({ pressed }) => [
                    styles.queueToggleBtn,
                    { backgroundColor: colors.primary + "20", borderColor: colors.primary + "60", opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Feather name="clock" size={14} color={colors.primary} />
                  <Text style={[styles.queueToggleBtnText, { color: colors.primary }]}>#{queuePosition}</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={onAddToQueue}
                  style={({ pressed }) => [
                    styles.queueToggleBtn,
                    { backgroundColor: colors.secondary, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Feather name="plus" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.queueToggleBtnText, { color: colors.mutedForeground }]}>Queue</Text>
                </Pressable>
              )}
            </>
          )}
        </View>

        {/* "What can I do?" */}
        {hasCaps && (
          <Pressable
            onPress={() => setSheetOpen(true)}
            style={({ pressed }) => [
              styles.whatCanIDoBtn,
              { backgroundColor: pressed ? colors.accent + "cc" : colors.accent, borderColor: colors.primary + "40" },
            ]}
          >
            <Feather name="help-circle" size={15} color={colors.primary} />
            <Text style={[styles.whatCanIDoBtnText, { color: colors.primary }]}>
              What can I do with this model?
            </Text>
            <Feather name="chevron-right" size={14} color={colors.primary} />
          </Pressable>
        )}
      </View>

      {/* Suggestions sheet */}
      <ModelSuggestionsSheet
        model={model}
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSelectPrompt={(prompt) => {
          setSheetOpen(false);
          onTryPrompt?.(prompt);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 16, gap: 12 },
  headerRow: { flexDirection: "row" },
  headerLeft: { flex: 1, gap: 6 },
  pillRecommended: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginBottom: 2 },
  pillQueued: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, marginBottom: 2 },
  pillText: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.3 },
  title: { fontSize: 17, fontFamily: "Inter_700Bold" },
  description: { fontSize: 13, lineHeight: 18, fontFamily: "Inter_400Regular" },
  capRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  capIcon: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  capLabel: { fontSize: 11.5, fontFamily: "Inter_600SemiBold" },
  ramWarn: { flexDirection: "row", alignItems: "center", gap: 6, padding: 10, borderRadius: 10, borderWidth: 1 },
  ramWarnText: { fontSize: 12, fontFamily: "Inter_500Medium", flex: 1 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgeText: { fontSize: 11.5, fontFamily: "Inter_500Medium" },
  downloadProgress: { gap: 6 },
  progressLabelRow: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { fontSize: 12.5, fontFamily: "Inter_500Medium" },
  cancelText: { fontSize: 12.5, fontFamily: "Inter_600SemiBold" },
  actionsCol: { gap: 8 },
  actionsRow: { flexDirection: "row", gap: 8 },
  primaryBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 12, gap: 8 },
  primaryBtnText: { fontSize: 14.5, fontFamily: "Inter_600SemiBold" },
  iconOnlyBtn: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  queueToggleBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  queueToggleBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  whatCanIDoBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },
  whatCanIDoBtnText: { flex: 1, fontSize: 13.5, fontFamily: "Inter_600SemiBold" },
});
