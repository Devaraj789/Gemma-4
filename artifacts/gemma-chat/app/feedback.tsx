import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Linking from "expo-linking";
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

import { useColors } from "@/hooks/useColors";

const FEEDBACK_EMAIL = "feedback@example.com";

export default function FeedbackScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) {
      Alert.alert("Please enter your feedback before submitting.");
      return;
    }
    const subject = encodeURIComponent("Gemma Offline Chat - Feedback");
    const body = encodeURIComponent(text.trim());
    const url = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        setSubmitted(true);
      }
    } catch {
      setSubmitted(true);
    }
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
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Feedback</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Platform.OS === "web" ? Math.max(insets.bottom, 24) + 16 : insets.bottom + 24,
          gap: 16,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {submitted ? (
          <View style={styles.successWrap}>
            <View style={[styles.successIcon, { backgroundColor: colors.success + "20" }]}>
              <Feather name="check" size={32} color={colors.success} />
            </View>
            <Text style={[styles.successTitle, { color: colors.foreground }]}>Thank you!</Text>
            <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
              Your feedback has been noted. We appreciate you helping improve Gemma Offline Chat.
            </Text>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.doneBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.descText, { color: colors.foreground }]}>
                Need help or have feedback? Describe your issue below or email us directly.
              </Text>
              <Pressable onPress={() => void Linking.openURL(`mailto:${FEEDBACK_EMAIL}`)}>
                <Text style={[styles.emailLink, { color: colors.primary }]}>{FEEDBACK_EMAIL}</Text>
              </Pressable>
            </View>

            <TextInput
              value={text}
              onChangeText={setText}
              multiline
              placeholder="Describe your issue or share feedback…"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.textArea,
                {
                  color: colors.foreground,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              textAlignVertical="top"
            />

            <View style={styles.btnRow}>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [
                  styles.cancelBtn,
                  { backgroundColor: colors.secondary, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text style={[styles.cancelText, { color: colors.foreground }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => void handleSubmit()}
                style={({ pressed }) => [
                  styles.submitBtn,
                  {
                    backgroundColor: text.trim() ? colors.primary : colors.muted,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.submitText,
                    { color: text.trim() ? colors.primaryForeground : colors.mutedForeground },
                  ]}
                >
                  Submit
                </Text>
              </Pressable>
            </View>
          </>
        )}
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
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  descText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  emailLink: { fontSize: 14, fontFamily: "Inter_500Medium" },
  textArea: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    fontSize: 14.5,
    fontFamily: "Inter_400Regular",
    minHeight: 160,
    lineHeight: 22,
  },
  btnRow: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
  },
  cancelText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  submitBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
  },
  submitText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  successWrap: { alignItems: "center", paddingVertical: 40, gap: 16 },
  successIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  successSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  doneBtn: { paddingHorizontal: 40, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  doneBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
