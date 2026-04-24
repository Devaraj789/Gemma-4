import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useChat } from "@/context/ChatContext";
import { useSettings } from "@/context/SettingsContext";
import { useColors } from "@/hooks/useColors";
import { INFERENCE_ENGINE_INFO } from "@/lib/inference";

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const colors = useColors();
  const dec = () => onChange(Math.max(min, Number((value - step).toFixed(2))));
  const inc = () => onChange(Math.min(max, Number((value + step).toFixed(2))));
  const display = format ? format(value) : value.toString();

  return (
    <View style={sliderStyles.wrap}>
      <View style={sliderStyles.row}>
        <Text style={[sliderStyles.label, { color: colors.foreground }]}>
          {label}
        </Text>
        <Text style={[sliderStyles.value, { color: colors.mutedForeground }]}>
          {display}
        </Text>
      </View>
      <View style={sliderStyles.controls}>
        <Pressable
          onPress={dec}
          style={({ pressed }) => [
            sliderStyles.btn,
            {
              backgroundColor: colors.secondary,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather name="minus" size={16} color={colors.foreground} />
        </Pressable>
        <View style={[sliderStyles.track, { backgroundColor: colors.muted }]}>
          <View
            style={[
              sliderStyles.fill,
              {
                backgroundColor: colors.primary,
                width: `${((value - min) / (max - min)) * 100}%`,
              },
            ]}
          />
        </View>
        <Pressable
          onPress={inc}
          style={({ pressed }) => [
            sliderStyles.btn,
            {
              backgroundColor: colors.secondary,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather name="plus" size={16} color={colors.foreground} />
        </Pressable>
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  wrap: {
    gap: 10,
    paddingVertical: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 14.5,
    fontFamily: "Inter_500Medium",
  },
  value: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
});

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, resetSettings } = useSettings();
  const { clearAll } = useChat();

  const handleClearChats = () => {
    if (Platform.OS === "web") {
      const ok = window.confirm("Delete all conversations? This cannot be undone.");
      if (ok) clearAll();
      return;
    }
    Alert.alert(
      "Delete all conversations?",
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => clearAll() },
      ],
    );
  };

  const handleReset = () => {
    if (Platform.OS === "web") {
      const ok = window.confirm("Reset all settings to defaults?");
      if (ok) resetSettings();
      return;
    }
    Alert.alert("Reset settings?", "Restore default values for all controls.", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: () => resetSettings() },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop:
              Platform.OS === "web" ? Math.max(insets.top, 16) + 6 : insets.top + 6,
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
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom:
            Platform.OS === "web" ? Math.max(insets.bottom, 24) + 16 : insets.bottom + 24,
        }}
      >
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          GENERATION
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Slider
            label="Temperature"
            value={settings.temperature}
            min={0}
            max={2}
            step={0.1}
            format={(v) => v.toFixed(1)}
            onChange={(v) => updateSettings({ temperature: v })}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Slider
            label="Top K"
            value={settings.topK}
            min={1}
            max={100}
            step={1}
            format={(v) => v.toString()}
            onChange={(v) => updateSettings({ topK: v })}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Slider
            label="Top P"
            value={settings.topP}
            min={0}
            max={1}
            step={0.05}
            format={(v) => v.toFixed(2)}
            onChange={(v) => updateSettings({ topP: v })}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Slider
            label="Max tokens"
            value={settings.maxTokens}
            min={64}
            max={2048}
            step={64}
            format={(v) => v.toString()}
            onChange={(v) => updateSettings({ maxTokens: v })}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 24 }]}>
          SYSTEM PROMPT
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 14 }]}>
          <TextInput
            value={settings.systemPrompt}
            onChangeText={(t) => updateSettings({ systemPrompt: t })}
            multiline
            placeholder="Tell the model how to behave…"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.systemInput,
              {
                color: colors.foreground,
                backgroundColor: colors.secondary,
                minHeight: 120,
              },
            ]}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 24 }]}>
          PREFERENCES
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.toggleTitle, { color: colors.foreground }]}>
                Haptic feedback
              </Text>
              <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>
                Light buzz when sending messages.
              </Text>
            </View>
            <Switch
              value={settings.haptics}
              onValueChange={(v) => updateSettings({ haptics: v })}
              trackColor={{ false: colors.muted, true: colors.primary }}
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 24 }]}>
          DATA
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable
            onPress={handleClearChats}
            style={({ pressed }) => [
              styles.actionRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="trash-2" size={18} color={colors.destructive} />
            <Text style={[styles.actionText, { color: colors.destructive }]}>
              Delete all conversations
            </Text>
          </Pressable>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Pressable
            onPress={handleReset}
            style={({ pressed }) => [
              styles.actionRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="refresh-ccw" size={18} color={colors.foreground} />
            <Text style={[styles.actionText, { color: colors.foreground }]}>
              Reset settings to defaults
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 24 }]}>
          ABOUT
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border, padding: 14, gap: 10 },
          ]}
        >
          <Text style={[styles.aboutText, { color: colors.foreground }]}>
            Gemma Offline Chat
          </Text>
          <Text style={[styles.aboutSub, { color: colors.mutedForeground }]}>
            {INFERENCE_ENGINE_INFO}
          </Text>
          <Text style={[styles.aboutSub, { color: colors.mutedForeground }]}>
            Conversations and downloaded models stay on this device.
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
  title: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 11.5,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 0,
  },
  systemInput: {
    fontSize: 14.5,
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
    padding: 12,
    borderRadius: 12,
    textAlignVertical: "top",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  toggleTitle: {
    fontSize: 14.5,
    fontFamily: "Inter_500Medium",
  },
  toggleSub: {
    fontSize: 12.5,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  actionText: {
    fontSize: 14.5,
    fontFamily: "Inter_500Medium",
  },
  aboutText: {
    fontSize: 14.5,
    fontFamily: "Inter_600SemiBold",
  },
  aboutSub: {
    fontSize: 12.5,
    lineHeight: 18,
    fontFamily: "Inter_400Regular",
  },
});
