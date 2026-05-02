import { Feather } from "@expo/vector-icons";
import React, { useRef, useEffect } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Modal,
  Dimensions,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import type { ModelVariant } from "@/lib/models";
import { getSuggestionsForModel, type PromptSuggestion } from "@/lib/promptSuggestions";

type Props = {
  model: ModelVariant;
  visible: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string) => void;
};

const SCREEN_HEIGHT = Dimensions.get("window").height;

export function ModelSuggestionsSheet({ model, visible, onClose, onSelectPrompt }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const groups = getSuggestionsForModel(model.capabilities ?? ["chat"]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 180,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, opacity]);

  const handleSelect = (suggestion: PromptSuggestion) => {
    onSelectPrompt(suggestion.prompt);
    onClose();
  };

  if (!visible && Platform.OS === "web") return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable style={styles.backdropTap} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.background,
            paddingBottom: insets.bottom + 16,
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <View style={styles.sheetHeaderLeft}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
              What can I do with
            </Text>
            <Text style={[styles.sheetModelName, { color: colors.primary }]}>
              {model.name}?
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => [
              styles.closeBtn,
              { backgroundColor: pressed ? colors.muted : colors.secondary },
            ]}
          >
            <Feather name="x" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <Text style={[styles.sheetSubtitle, { color: colors.mutedForeground }]}>
          Tap a prompt to load it into chat. Edit as needed and send!
        </Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {groups.map((group) => (
            <View key={group.capability} style={styles.group}>
              {/* Group heading */}
              <View style={styles.groupHeader}>
                <View
                  style={[
                    styles.groupIconBox,
                    { backgroundColor: group.color + "20", borderColor: group.color + "40" },
                  ]}
                >
                  <Feather name={group.featherIcon as React.ComponentProps<typeof Feather>["name"]} size={14} color={group.color} />
                </View>
                <Text style={[styles.groupTitle, { color: group.color }]}>{group.title}</Text>
              </View>

              {/* Suggestion cards */}
              <View style={styles.suggestionGrid}>
                {group.suggestions.map((s) => (
                  <Pressable
                    key={s.label}
                    onPress={() => handleSelect(s)}
                    style={({ pressed }) => [
                      styles.suggestionCard,
                      {
                        backgroundColor: pressed ? group.color + "15" : colors.card,
                        borderColor: pressed ? group.color + "60" : colors.border,
                      },
                    ]}
                  >
                    <Text style={styles.suggestionEmoji}>{s.icon}</Text>
                    <Text style={[styles.suggestionLabel, { color: colors.foreground }]}>
                      {s.label}
                    </Text>
                    <Feather name="chevron-right" size={13} color={colors.mutedForeground} />
                  </Pressable>
                ))}
              </View>
            </View>
          ))}

          {/* Footer tip */}
          <View style={[styles.tip, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="zap" size={14} color={colors.primary} />
            <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
              Each prompt opens in the chat input so you can edit before sending. All fully offline!
            </Text>
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  backdropTap: { flex: 1 },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.88,
    paddingTop: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sheetHeaderLeft: { flex: 1, gap: 1 },
  sheetTitle: { fontSize: 14, fontFamily: "Inter_400Regular" },
  sheetModelName: { fontSize: 20, fontFamily: "Inter_700Bold" },
  sheetSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 16 },
  closeBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  scroll: { gap: 20, paddingBottom: 8 },
  group: { gap: 10 },
  groupHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  groupIconBox: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  groupTitle: { fontSize: 13.5, fontFamily: "Inter_700Bold", letterSpacing: 0.2 },
  suggestionGrid: { gap: 6 },
  suggestionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  suggestionEmoji: { fontSize: 18, width: 26, textAlign: "center" },
  suggestionLabel: { flex: 1, fontSize: 13.5, fontFamily: "Inter_500Medium" },
  tip: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "flex-start",
    marginTop: 4,
  },
  tipText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
});
