import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useChat } from "@/context/ChatContext";
import { useModels } from "@/context/ModelContext";
import { useColors } from "@/hooks/useColors";

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      {sub ? <Text style={[styles.statSub, { color: color }]}>{sub}</Text> : null}
    </View>
  );
}

export default function StatsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { conversations } = useChat();
  const { models, downloadedIds } = useModels();

  const stats = useMemo(() => {
    const totalConvs = conversations.length;
    let totalMessages = 0;
    let userMessages = 0;
    let aiMessages = 0;
    let totalTokens = 0;
    let totalTokSec = 0;
    let tokSecCount = 0;
    const modelUsage: Record<string, number> = {};
    let longestConv = 0;
    let totalChars = 0;

    for (const conv of conversations) {
      const msgCount = conv.messages.length;
      totalMessages += msgCount;
      if (msgCount > longestConv) longestConv = msgCount;

      if (conv.modelId) {
        modelUsage[conv.modelId] = (modelUsage[conv.modelId] ?? 0) + 1;
      }

      for (const msg of conv.messages) {
        totalChars += msg.content.length;
        if (msg.role === "user") userMessages++;
        else if (msg.role === "assistant") {
          aiMessages++;
          if (msg.stats) {
            totalTokens += msg.stats.totalTokens ?? 0;
            if (msg.stats.tokensPerSec > 0) {
              totalTokSec += msg.stats.tokensPerSec;
              tokSecCount++;
            }
          }
        }
      }
    }

    const avgTokSec = tokSecCount > 0 ? (totalTokSec / tokSecCount).toFixed(1) : "—";
    const mostUsedModelId = Object.entries(modelUsage).sort((a, b) => b[1] - a[1])[0]?.[0];
    const mostUsedModel = mostUsedModelId
      ? (models.find((m) => m.id === mostUsedModelId)?.shortName ?? mostUsedModelId)
      : "—";

    const totalWords = Math.round(totalChars / 5);

    return {
      totalConvs,
      totalMessages,
      userMessages,
      aiMessages,
      totalTokens,
      avgTokSec,
      mostUsedModel,
      longestConv,
      totalWords,
      downloadedModels: downloadedIds.length,
    };
  }, [conversations, models, downloadedIds]);

  const statCards = [
    { icon: "message-square" as const, label: "Conversations", value: String(stats.totalConvs), color: "#3b82f6" },
    { icon: "message-circle" as const, label: "Total Messages", value: String(stats.totalMessages), color: "#22c55e" },
    { icon: "user" as const, label: "Your Messages", value: String(stats.userMessages), color: "#6366f1" },
    { icon: "cpu" as const, label: "AI Responses", value: String(stats.aiMessages), color: "#a855f7" },
    { icon: "zap" as const, label: "Tokens Generated", value: stats.totalTokens > 1000 ? `${(stats.totalTokens / 1000).toFixed(1)}K` : String(stats.totalTokens), color: "#f59e0b" },
    { icon: "activity" as const, label: "Avg Speed", value: stats.avgTokSec === "—" ? "—" : `${stats.avgTokSec} tok/s`, color: "#06b6d4" },
    { icon: "align-left" as const, label: "Words Written", value: stats.totalWords > 1000 ? `${(stats.totalWords / 1000).toFixed(1)}K` : String(stats.totalWords), color: "#f97316" },
    { icon: "award" as const, label: "Longest Chat", value: `${stats.longestConv} msgs`, color: "#ec4899" },
    { icon: "hard-drive" as const, label: "Models Downloaded", value: String(stats.downloadedModels), color: "#14b8a6" },
    { icon: "star" as const, label: "Most Used Model", value: stats.mostUsedModel, color: "#84cc16", sub: stats.mostUsedModel !== "—" ? "most chats" : undefined },
  ];

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
        <Text style={[styles.title, { color: colors.foreground }]}>Statistics</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Platform.OS === "web" ? Math.max(insets.bottom, 24) + 16 : insets.bottom + 32,
          gap: 16,
        }}
      >
        {/* Summary hero card */}
        <View style={[styles.heroCard, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "40" }]}>
          <Feather name="bar-chart-2" size={24} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>Your Usage</Text>
            <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
              {stats.totalConvs === 0
                ? "Start chatting to see your stats here."
                : `${stats.totalConvs} conversation${stats.totalConvs === 1 ? "" : "s"} · ${stats.totalMessages} messages · ${stats.totalTokens.toLocaleString()} tokens`}
            </Text>
          </View>
        </View>

        {/* Grid */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>BREAKDOWN</Text>
        <View style={styles.grid}>
          {statCards.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </View>

        {/* Empty state */}
        {stats.totalConvs === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="message-square" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No conversations yet. Send your first message to start tracking!
            </Text>
          </View>
        )}

        <View style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="info" size={14} color={colors.mutedForeground} />
          <Text style={[styles.noteText, { color: colors.mutedForeground }]}>
            Stats are calculated from conversations stored on this device. Speed stats are only tracked for sessions where a model was loaded.
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
  heroCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 16, borderWidth: 1 },
  heroTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  heroSub: { fontSize: 12.5, fontFamily: "Inter_400Regular", lineHeight: 17, marginTop: 2 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.7 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    width: "47.5%", borderRadius: 16, borderWidth: 1, padding: 14, gap: 6, alignItems: "flex-start",
  },
  statIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 26 },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statSub: { fontSize: 11, fontFamily: "Inter_500Medium" },
  emptyCard: { padding: 28, borderRadius: 16, borderWidth: 1, alignItems: "center", gap: 8 },
  emptyText: { fontSize: 13.5, fontFamily: "Inter_400Regular", textAlign: "center" },
  noteCard: { flexDirection: "row", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: "flex-start" },
  noteText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 16 },
});
