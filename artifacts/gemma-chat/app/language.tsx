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

import { useSettings } from "@/context/SettingsContext";
import { useColors } from "@/hooks/useColors";

const LANGUAGES = [
  { label: "English (English)", value: "English" },
  { label: "Arabic (العربية)", value: "Arabic" },
  { label: "German (Deutsch)", value: "German" },
  { label: "Spanish (Español)", value: "Spanish" },
  { label: "French (Français)", value: "French" },
  { label: "Japanese (日本語)", value: "Japanese" },
  { label: "Korean (한국어)", value: "Korean" },
  { label: "Portuguese (Português)", value: "Portuguese" },
  { label: "Simplified Chinese (简体中文)", value: "Simplified Chinese" },
  { label: "Traditional Chinese (繁體中文)", value: "Traditional Chinese" },
  { label: "Tamil (தமிழ்)", value: "Tamil" },
  { label: "Hindi (हिन्दी)", value: "Hindi" },
];

export default function LanguageScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();

  const handleSelect = (value: string) => {
    updateSettings({ language: value });
    router.back();
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
          style={({ pressed }) => [
            styles.iconBtn,
            { backgroundColor: pressed ? colors.muted : "transparent" },
          ]}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Select Language</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: Platform.OS === "web" ? Math.max(insets.bottom, 24) + 16 : insets.bottom + 24,
        }}
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {LANGUAGES.map((lang, index) => {
            const isSelected = settings.language === lang.value;
            return (
              <React.Fragment key={lang.value}>
                {index > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                <Pressable
                  onPress={() => handleSelect(lang.value)}
                  style={({ pressed }) => [
                    styles.row,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text
                    style={[
                      styles.langText,
                      { color: isSelected ? colors.primary : colors.foreground },
                      isSelected && styles.langTextSelected,
                    ]}
                  >
                    {lang.label}
                  </Text>
                  {isSelected && (
                    <Feather name="check" size={18} color={colors.primary} />
                  )}
                </Pressable>
              </React.Fragment>
            );
          })}
        </View>

        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.cancelBtn,
            {
              backgroundColor: pressed ? colors.muted : colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
        </Pressable>
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
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 20 },
  langText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  langTextSelected: { fontFamily: "Inter_600SemiBold" },
  cancelBtn: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    paddingVertical: 16,
  },
  cancelText: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
