import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Pressable,
  Clipboard,
  ToastAndroid,
  Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import type { Message } from "@/context/ChatContext";
import { useColors } from "@/hooks/useColors";

type Props = {
  message: Message;
  showCursor?: boolean;
  onEdit?: (message: Message) => void;
  onRetry?: (message: Message) => void;
};

export function MessageBubble({ message, showCursor, onEdit, onRetry }: Props) {
  const colors = useColors();
  const isUser = message.role === "user";
  const bubbleColor = isUser ? colors.bubbleUser : colors.bubbleAssistant;
  const textColor = isUser ? colors.bubbleUserText : colors.bubbleAssistantText;

  const [menuVisible, setMenuVisible] = useState(false);
  const [liked, setLiked] = useState<null | "up" | "down">(null);

  const handleCopy = () => {
    Clipboard.setString(message.content);
    ToastAndroid.show("Copied!", ToastAndroid.SHORT);
    setMenuVisible(false);
  };

  const handleEdit = () => {
    setMenuVisible(false);
    if (onEdit) onEdit(message);
  };

  const handleRetry = () => {
    setMenuVisible(false);
    if (onRetry) onRetry(message);
  };

  return (
    <>
      {/* Long-press Modal — user message only */}
      {isUser && (
        <Modal
          transparent
          visible={menuVisible}
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setMenuVisible(false)}
          >
            <Pressable
              style={[
                styles.menu,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* Copy */}
              <TouchableOpacity
                style={[styles.menuItem, styles.menuItemBorder, { borderBottomColor: colors.border }]}
                onPress={handleCopy}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIcon, { backgroundColor: colors.accent }]}>
                  <Feather name="copy" size={15} color={colors.accentForeground} />
                </View>
                <Text style={[styles.menuText, { color: colors.foreground }]}>
                  Copy
                </Text>
              </TouchableOpacity>

              {/* Edit & Resend */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleEdit}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIcon, { backgroundColor: colors.accent }]}>
                  <Feather name="edit-2" size={15} color={colors.accentForeground} />
                </View>
                <Text style={[styles.menuText, { color: colors.foreground }]}>
                  Edit & Resend
                </Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Message Bubble */}
      <Pressable
        onPress={isUser ? () => setMenuVisible(true) : undefined}
        onLongPress={() => setMenuVisible(isUser ? true : false)}
        delayLongPress={300}
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
      </Pressable>

      {/* ── AI message action bar ── */}
      {!isUser && !showCursor && message.content.length > 0 && (
        <View style={[styles.actionBar, { justifyContent: "flex-start" }]}>
          {/* Copy */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
            onPress={handleCopy}
            activeOpacity={0.7}
          >
            <Feather name="copy" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>

          {/* Like */}
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor:
                  liked === "up" ? colors.accent : colors.secondary,
              },
            ]}
            onPress={() => setLiked(liked === "up" ? null : "up")}
            activeOpacity={0.7}
          >
            <Feather
              name="thumbs-up"
              size={14}
              color={liked === "up" ? colors.accentForeground : colors.mutedForeground}
            />
          </TouchableOpacity>

          {/* Dislike */}
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor:
                  liked === "down" ? colors.accent : colors.secondary,
              },
            ]}
            onPress={() => setLiked(liked === "down" ? null : "down")}
            activeOpacity={0.7}
          >
            <Feather
              name="thumbs-down"
              size={14}
              color={liked === "down" ? colors.accentForeground : colors.mutedForeground}
            />
          </TouchableOpacity>

          {/* Retry */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
            onPress={handleRetry}
            activeOpacity={0.7}
          >
            <Feather name="rotate-ccw" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── User message action bar ── */}
      {isUser && !showCursor && message.content.length > 0 && (
        <View style={[styles.actionBar, { justifyContent: "flex-end" }]}>
          {/* Copy */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
            onPress={handleCopy}
            activeOpacity={0.7}
          >
            <Feather name="copy" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>

          {/* Edit */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
            onPress={handleEdit}
            activeOpacity={0.7}
          >
            <Feather name="edit-2" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>

          {/* Retry */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
            onPress={handleRetry}
            activeOpacity={0.7}
          >
            <Feather name="rotate-ccw" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      )}
    </>
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

  // Action bar
  actionBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 6,
    gap: 6,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  // Long-press modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  menu: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 200,
    overflow: "hidden",
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
});