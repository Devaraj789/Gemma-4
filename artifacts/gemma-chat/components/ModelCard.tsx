import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ProgressBar } from "@/components/ProgressBar";
import type { DownloadState } from "@/context/ModelContext";
import { useColors } from "@/hooks/useColors";
import type { ModelVariant } from "@/lib/models";

type Props = {
  model: ModelVariant;
  downloadState: DownloadState | undefined;
  isDownloaded: boolean;
  isActive: boolean;
  onDownload: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onActivate: () => void;
};

export function ModelCard({
  model,
  downloadState,
  isDownloaded,
  isActive,
  onDownload,
  onCancel,
  onDelete,
  onActivate,
}: Props) {
  const colors = useColors();
  const status = downloadState?.status ?? "idle";
  const progress = downloadState?.progress ?? 0;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isActive ? colors.primary : colors.border,
          borderWidth: isActive ? 1.5 : 1,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          {model.recommended ? (
            <View
              style={[
                styles.pillRecommended,
                { backgroundColor: colors.accent },
              ]}
            >
              <Text style={[styles.pillText, { color: colors.accentForeground }]}>
                Recommended
              </Text>
            </View>
          ) : null}
          <Text style={[styles.title, { color: colors.foreground }]}>
            {model.name}
          </Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            {model.description}
          </Text>
        </View>
      </View>

      <View style={styles.badgeRow}>
        {model.badges.map((b) => (
          <View
            key={b}
            style={[
              styles.badge,
              { backgroundColor: colors.secondary },
            ]}
          >
            <Text style={[styles.badgeText, { color: colors.secondaryForeground }]}>
              {b}
            </Text>
          </View>
        ))}
        <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.badgeText, { color: colors.secondaryForeground }]}>
            {model.sizeLabel}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.badgeText, { color: colors.secondaryForeground }]}>
            {model.ramRequiredGb}+ GB RAM
          </Text>
        </View>
      </View>

      {status === "downloading" ? (
        <View style={styles.downloadProgress}>
          <View style={styles.progressLabelRow}>
            <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
              Downloading {Math.round(progress * 100)}%
            </Text>
            <Pressable onPress={onCancel} hitSlop={8}>
              <Text style={[styles.cancelText, { color: colors.destructive }]}>
                Cancel
              </Text>
            </Pressable>
          </View>
          <ProgressBar progress={progress} />
        </View>
      ) : null}

      <View style={styles.actionsRow}>
        {isDownloaded ? (
          <>
            <Pressable
              onPress={onActivate}
              disabled={isActive}
              style={({ pressed }) => [
                styles.primaryBtn,
                {
                  backgroundColor: isActive ? colors.muted : colors.primary,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Feather
                name={isActive ? "check" : "zap"}
                size={16}
                color={
                  isActive ? colors.mutedForeground : colors.primaryForeground
                }
              />
              <Text
                style={[
                  styles.primaryBtnText,
                  {
                    color: isActive
                      ? colors.mutedForeground
                      : colors.primaryForeground,
                  },
                ]}
              >
                {isActive ? "Active" : "Use this model"}
              </Text>
            </Pressable>
            <Pressable
              onPress={onDelete}
              style={({ pressed }) => [
                styles.iconOnlyBtn,
                {
                  backgroundColor: colors.secondary,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Feather name="trash-2" size={16} color={colors.destructive} />
            </Pressable>
          </>
        ) : status === "downloading" ? null : (
          <Pressable
            onPress={onDownload}
            style={({ pressed }) => [
              styles.primaryBtn,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Feather name="download" size={16} color={colors.primaryForeground} />
            <Text
              style={[styles.primaryBtnText, { color: colors.primaryForeground }]}
            >
              Download
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
  },
  headerLeft: {
    flex: 1,
    gap: 6,
  },
  pillRecommended: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 2,
  },
  pillText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  description: {
    fontSize: 13.5,
    lineHeight: 19,
    fontFamily: "Inter_400Regular",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11.5,
    fontFamily: "Inter_500Medium",
  },
  downloadProgress: {
    gap: 6,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 12.5,
    fontFamily: "Inter_500Medium",
  },
  cancelText: {
    fontSize: 12.5,
    fontFamily: "Inter_600SemiBold",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 14.5,
    fontFamily: "Inter_600SemiBold",
  },
  iconOnlyBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
