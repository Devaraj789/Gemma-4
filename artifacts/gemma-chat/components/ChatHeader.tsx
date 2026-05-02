import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

type Props = {
  modelName: string | null;
  onOpenHistory: () => void;
  onOpenModels: () => void;
  onOpenSettings: () => void;
  onNewChat: () => void;
  onOpenTools?: () => void;
  onToggleTheme?: () => void;
  isDark?: boolean;
  onSearch?: () => void;
  onExportChat?: () => void;
  hasMessages?: boolean;
  searchActive?: boolean;
};

export function ChatHeader({
  modelName,
  onOpenHistory,
  onOpenModels,
  onOpenSettings,
  onNewChat,
  onOpenTools,
  onToggleTheme,
  isDark,
  onSearch,
  onExportChat,
  hasMessages = false,
  searchActive = false,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 16) : insets.top;

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: topPad + 6,
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <Pressable
        onPress={onOpenHistory}
        hitSlop={8}
        style={({ pressed }) => [
          styles.iconBtn,
          { backgroundColor: pressed ? colors.muted : "transparent" },
        ]}
      >
        <Feather name="menu" size={22} color={colors.foreground} />
      </Pressable>

      <Pressable
        onPress={onOpenModels}
        style={({ pressed }) => [
          styles.modelPill,
          { backgroundColor: colors.secondary, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <View style={[styles.statusDot, { backgroundColor: modelName ? colors.success : colors.mutedForeground }]} />
        <Text style={[styles.modelName, { color: colors.foreground }]} numberOfLines={1}>
          {modelName ?? "No model"}
        </Text>
        <Feather name="chevron-down" size={14} color={colors.mutedForeground} />
      </Pressable>

      <View style={styles.rightGroup}>
        {/* Tools / Persona Library */}
        {onOpenTools && (
          <Pressable
            onPress={onOpenTools}
            hitSlop={8}
            style={({ pressed }) => [
              styles.toolsBtn,
              { backgroundColor: pressed ? colors.primary + "cc" : colors.primary },
            ]}
          >
            <Feather name="layers" size={14} color="#fff" />
            <Text style={styles.toolsBtnText}>Tools</Text>
          </Pressable>
        )}

        {/* Feature 6: Search toggle */}
        {hasMessages && onSearch && (
          <Pressable
            onPress={onSearch}
            hitSlop={8}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: searchActive ? colors.primary + "22" : pressed ? colors.muted : "transparent" },
            ]}
          >
            <Feather name="search" size={20} color={searchActive ? colors.primary : colors.foreground} />
          </Pressable>
        )}

        {/* Feature 9: Per-chat export */}
        {hasMessages && onExportChat && (
          <Pressable
            onPress={onExportChat}
            hitSlop={8}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: pressed ? colors.muted : "transparent" },
            ]}
          >
            <Feather name="upload" size={19} color={colors.foreground} />
          </Pressable>
        )}

        {onToggleTheme && (
          <Pressable
            onPress={onToggleTheme}
            hitSlop={8}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: pressed ? colors.muted : "transparent" },
            ]}
          >
            <Feather name={isDark ? "sun" : "moon"} size={20} color={colors.foreground} />
          </Pressable>
        )}
        <Pressable
          onPress={onNewChat}
          hitSlop={8}
          style={({ pressed }) => [
            styles.iconBtn,
            { backgroundColor: pressed ? colors.muted : "transparent" },
          ]}
        >
          <Feather name="edit" size={20} color={colors.foreground} />
        </Pressable>
        <Pressable
          onPress={onOpenSettings}
          hitSlop={8}
          style={({ pressed }) => [
            styles.iconBtn,
            { backgroundColor: pressed ? colors.muted : "transparent" },
          ]}
        >
          <Feather name="sliders" size={20} color={colors.foreground} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modelPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginHorizontal: 4,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  modelName: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  rightGroup: { flexDirection: "row", gap: 2, alignItems: "center" },
  toolsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 2,
  },
  toolsBtnText: { fontSize: 12.5, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
