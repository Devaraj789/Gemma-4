import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { Message } from "@/context/ChatContext";
import { useColors } from "@/hooks/useColors";

type Props = {
  message: Message;
  showCursor?: boolean;
};

export function MessageBubble({ message, showCursor }: Props) {
  const colors = useColors();
  const isUser = message.role === "user";

  const bubbleColor = isUser ? colors.bubbleUser : colors.bubbleAssistant;
  const textColor = isUser ? colors.bubbleUserText : colors.bubbleAssistantText;

  return (
    <View
      style={[
        styles.row,
        { justifyContent: isUser ? "flex-end" : "flex-start" },
      ]}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: bubbleColor,
            borderTopRightRadius: isUser ? 4 : 20,
            borderTopLeftRadius: isUser ? 20 : 4,
          },
        ]}
      >
        <Text style={[styles.text, { color: textColor }]}>
          {message.content}
          {showCursor ? (
            <Text style={{ color: textColor, opacity: 0.6 }}>▌</Text>
          ) : null}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  bubble: {
    maxWidth: "85%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  text: {
    fontSize: 15.5,
    lineHeight: 22,
    fontFamily: "Inter_400Regular",
  },
});
