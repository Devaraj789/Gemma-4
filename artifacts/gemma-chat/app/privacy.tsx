import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSettings } from "@/context/SettingsContext";
import { useColors } from "@/hooks/useColors";

export default function PrivacyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();

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
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Privacy & Data</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Platform.OS === "web" ? Math.max(insets.bottom, 24) + 16 : insets.bottom + 24,
          gap: 16,
        }}
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.toggleTitle, { color: colors.foreground }]}>Local Data Only</Text>
              <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>
                All conversations and model data stay entirely on your device. Nothing is sent to external servers.
              </Text>
            </View>
            <Switch
              value={settings.localDataOnly}
              onValueChange={(v) => updateSettings({ localDataOnly: v })}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={settings.localDataOnly ? "#fff" : "#fff"}
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.toggleTitle, { color: colors.foreground }]}>Haptic Feedback</Text>
              <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>
                Light vibration when sending messages and other interactions.
              </Text>
            </View>
            <Switch
              value={settings.haptics}
              onValueChange={(v) => updateSettings({ haptics: v })}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={settings.haptics ? "#fff" : "#fff"}
            />
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.accent, borderColor: colors.border }]}>
          <View style={styles.infoRow}>
            <Feather name="shield" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoTitle, { color: colors.foreground }]}>100% Private by Design</Text>
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                Gemma Offline Chat is built to run entirely on your device. The AI model runs locally — no cloud API calls, no data collection, no tracking.
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.infoItem, { borderBottomColor: colors.border }]}>
            <Feather name="hard-drive" size={16} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemTitle, { color: colors.foreground }]}>Model Storage</Text>
              <Text style={[styles.itemSub, { color: colors.mutedForeground }]}>Models downloaded once, stored locally on device</Text>
            </View>
          </View>
          <View style={[styles.infoItem, { borderBottomColor: colors.border }]}>
            <Feather name="message-circle" size={16} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemTitle, { color: colors.foreground }]}>Chat History</Text>
              <Text style={[styles.itemSub, { color: colors.mutedForeground }]}>Stored in local app storage, never synced</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Feather name="wifi-off" size={16} color={colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemTitle, { color: colors.foreground }]}>Offline First</Text>
              <Text style={[styles.itemSub, { color: colors.mutedForeground }]}>Works with no internet connection after model download</Text>
            </View>
          </View>
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
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  card: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 16 },
  toggleRow: { flexDirection: "row", alignItems: "center", paddingVertical: 16 },
  toggleTitle: { fontSize: 14.5, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  toggleSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  infoCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  infoRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  infoTitle: { fontSize: 14.5, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  infoText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemTitle: { fontSize: 13.5, fontFamily: "Inter_500Medium", marginBottom: 2 },
  itemSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 16 },
});
