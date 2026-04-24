import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = {
  onSend: (text: string) => void;
  onStop: () => void;
  isGenerating: boolean;
  disabled?: boolean;
  placeholder?: string;
  hapticsEnabled?: boolean;
};

export function ChatInput({
  onSend,
  onStop,
  isGenerating,
  disabled,
  placeholder,
  hapticsEnabled = true,
}: Props) {
  const colors = useColors();
  const [text, setText] = useState<string>("");

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    if (hapticsEnabled && Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSend(trimmed);
    setText("");
  };

  const handleStop = () => {
    if (hapticsEnabled && Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onStop();
  };

  const showStop = isGenerating;
  const canSend = text.trim().length > 0 && !disabled;

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.secondary,
            borderColor: colors.border,
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            { color: colors.foreground },
          ]}
          placeholder={placeholder ?? "Message Gemma…"}
          placeholderTextColor={colors.mutedForeground}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={4000}
          editable={!disabled}
          textAlignVertical="center"
        />
        {showStop ? (
          <Pressable
            onPress={handleStop}
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: colors.destructive,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Feather name="square" size={16} color={colors.destructiveForeground} />
          </Pressable>
        ) : (
          <Pressable
            onPress={handleSend}
            disabled={!canSend}
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: canSend ? colors.primary : colors.muted,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            {disabled && !canSend ? (
              <ActivityIndicator size="small" color={colors.mutedForeground} />
            ) : (
              <Feather
                name="arrow-up"
                size={18}
                color={
                  canSend ? colors.primaryForeground : colors.mutedForeground
                }
              />
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 24,
    borderWidth: 1,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 15.5,
    fontFamily: "Inter_400Regular",
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
    maxHeight: 140,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
