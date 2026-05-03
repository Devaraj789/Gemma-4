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
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Markdown from "react-native-markdown-display";
import type { Message } from "@/context/ChatContext";
import { useColors } from "@/hooks/useColors";

type FontSize = "small" | "medium" | "large";

type Props = {
  message: Message;
  showCursor?: boolean;
  fontSize?: FontSize;
  onEdit?: (message: Message) => void;
  onRetry?: (message: Message) => void;
};

const FONT_SIZES: Record<FontSize, number> = { small: 13.5, medium: 15.5, large: 18 };
const LINE_HEIGHTS: Record<FontSize, number> = { small: 19, medium: 22, large: 26 };

function formatLoadTime(ms: number): string {
  return ms < 1000 ? `${ms}ms load` : `${(ms / 1000).toFixed(1)}s load`;
}

export function MessageBubble({ message, showCursor, fontSize = "medium", onEdit, onRetry }: Props) {
  const colors = useColors();
  const isUser = message.role === "user";
  const bubbleColor = isUser ? colors.bubbleUser : colors.bubbleAssistant;
  const textColor = isUser ? colors.bubbleUserText : colors.bubbleAssistantText;
  const fs = FONT_SIZES[fontSize];
  const lh = LINE_HEIGHTS[fontSize];

  const [menuVisible, setMenuVisible] = useState(false);
  const [liked, setLiked] = useState<null | "up" | "down">(null);

  const handleCopy = () => {
    Clipboard.setString(message.content);
    if (Platform.OS === "android") ToastAndroid.show("Copied!", ToastAndroid.SHORT);
    setMenuVisible(false);
  };
  const handleEdit = () => { setMenuVisible(false); onEdit?.(message); };
  const handleRetry = () => { setMenuVisible(false); onRetry?.(message); };

  const stats = message.stats;
  const showStats = !isUser && !showCursor && message.content.length > 0 && stats && (stats.tokensPerSec > 0 || (stats.loadTimeMs ?? 0) > 0);

  // Markdown styles for assistant messages
  const mdStyles = {
    body: { color: textColor, fontSize: fs, lineHeight: lh, fontFamily: "Inter_400Regular" },
    strong: { fontFamily: "Inter_700Bold", color: textColor },
    em: { fontStyle: "italic" as const, color: textColor },
    code_inline: { backgroundColor: isUser ? "rgba(255,255,255,0.2)" : colors.muted, color: isUser ? "#fff" : colors.foreground, fontFamily: "monospace", fontSize: fs - 1, paddingHorizontal: 4, borderRadius: 4 },
    fence: { backgroundColor: isUser ? "rgba(0,0,0,0.2)" : colors.muted, borderRadius: 8, padding: 10, marginVertical: 6 },
    code_block: { backgroundColor: isUser ? "rgba(0,0,0,0.2)" : colors.muted, borderRadius: 8, padding: 10, marginVertical: 6, fontFamily: "monospace", fontSize: fs - 2, color: isUser ? "#fff" : colors.foreground },
    bullet_list: { marginVertical: 4 },
    ordered_list: { marginVertical: 4 },
    list_item: { color: textColor, fontSize: fs },
    heading1: { color: textColor, fontSize: fs + 4, fontFamily: "Inter_700Bold", marginBottom: 4, marginTop: 6 },
    heading2: { color: textColor, fontSize: fs + 2, fontFamily: "Inter_700Bold", marginBottom: 3, marginTop: 5 },
    heading3: { color: textColor, fontSize: fs + 1, fontFamily: "Inter_600SemiBold", marginBottom: 2, marginTop: 4 },
    blockquote: { borderLeftWidth: 3, borderLeftColor: isUser ? "rgba(255,255,255,0.5)" : colors.border, paddingLeft: 10, marginVertical: 4 },
    hr: { backgroundColor: colors.border, height: 1, marginVertical: 8 },
    link: { color: isUser ? "#cce5ff" : colors.primary },
    paragraph: { marginBottom: 0 },
  };

  return (
    <>
      {/* Long-press Modal — user message only */}
      {isUser && (
        <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
            <Pressable style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity style={[styles.menuItem, styles.menuItemBorder, { borderBottomColor: colors.border }]} onPress={handleCopy} activeOpacity={0.7}>
                <View style={[styles.menuIcon, { backgroundColor: colors.accent }]}>
                  <Feather name="copy" size={15} color={colors.accentForeground} />
                </View>
                <Text style={[styles.menuText, { color: colors.foreground }]}>Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={handleEdit} activeOpacity={0.7}>
                <View style={[styles.menuIcon, { backgroundColor: colors.accent }]}>
                  <Feather name="edit-2" size={15} color={colors.accentForeground} />
                </View>
                <Text style={[styles.menuText, { color: colors.foreground }]}>Edit & Resend</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Message Bubble */}
      <Pressable
        onPress={isUser ? () => setMenuVisible(true) : undefined}
        onLongPress={() => { if (isUser) setMenuVisible(true); }}
        delayLongPress={300}
        style={[styles.row, { justifyContent: isUser ? "flex-end" : "flex-start" }]}
      >
        <View style={[styles.bubble, { backgroundColor: bubbleColor, borderTopRightRadius: isUser ? 4 : 20, borderTopLeftRadius: isUser ? 20 : 4 }]}>
          {!isUser && message.content.length > 0 ? (
            <Markdown style={mdStyles as any}>
              {message.content + (showCursor ? "▌" : "")}
            </Markdown>
          ) : (
            <Text style={[styles.text, { color: textColor, fontSize: fs, lineHeight: lh }]}>
              {message.content}
              {showCursor ? <Text style={{ color: textColor, opacity: 0.6 }}>▌</Text> : null}
            </Text>
          )}
        </View>
      </Pressable>

      {/* Stats pills */}
      {showStats ? (
        <View style={styles.statsRow}>
          {(stats.loadTimeMs ?? 0) > 0 ? (
            <View style={[styles.statPill, { backgroundColor: colors.secondary }]}>
              <Feather name="clock" size={10} color={colors.mutedForeground} />
              <Text style={[styles.statText, { color: colors.mutedForeground }]}>{formatLoadTime(stats.loadTimeMs!)}</Text>
            </View>
          ) : null}
          {stats.tokensPerSec > 0 ? (
            <View style={[styles.statPill, { backgroundColor: colors.secondary }]}>
              <Feather name="zap" size={10} color={colors.mutedForeground} />
              <Text style={[styles.statText, { color: colors.mutedForeground }]}>{stats.tokensPerSec.toFixed(1)} tok/s</Text>
            </View>
          ) : null}
          {stats.totalTokens > 0 ? (
            <View style={[styles.statPill, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.statText, { color: colors.mutedForeground }]}>{stats.totalTokens} tokens</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* AI action bar */}
      {!isUser && !showCursor && message.content.length > 0 && (
        <View style={[styles.actionBar, { justifyContent: "flex-start" }]}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.secondary }]} onPress={handleCopy} activeOpacity={0.7}>
            <Feather name="copy" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: liked === "up" ? colors.accent : colors.secondary }]} onPress={() => setLiked(liked === "up" ? null : "up")} activeOpacity={0.7}>
            <Feather name="thumbs-up" size={14} color={liked === "up" ? colors.accentForeground : colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: liked === "down" ? colors.accent : colors.secondary }]} onPress={() => setLiked(liked === "down" ? null : "down")} activeOpacity={0.7}>
            <Feather name="thumbs-down" size={14} color={liked === "down" ? colors.accentForeground : colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.secondary }]} onPress={handleRetry} activeOpacity={0.7}>
            <Feather name="rotate-ccw" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      )}

      {/* User action bar */}
      {isUser && !showCursor && message.content.length > 0 && (
        <View style={[styles.actionBar, { justifyContent: "flex-end" }]}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.secondary }]} onPress={handleCopy} activeOpacity={0.7}>
            <Feather name="copy" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.secondary }]} onPress={handleEdit} activeOpacity={0.7}>
            <Feather name="edit-2" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.secondary }]} onPress={handleRetry} activeOpacity={0.7}>
            <Feather name="rotate-ccw" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 4 },
  bubble: { maxWidth: "85%", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  text: { fontFamily: "Inter_400Regular" },
  statsRow: { flexDirection: "row", paddingHorizontal: 20, paddingTop: 2, paddingBottom: 2, gap: 6 },
  statPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statText: { fontSize: 10.5, fontFamily: "Inter_500Medium" },
  actionBar: { flexDirection: "row", paddingHorizontal: 20, paddingBottom: 6, gap: 6 },
  actionBtn: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" },
  menu: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, minWidth: 200, overflow: "hidden", elevation: 12, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  menuItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  menuItemBorder: { borderBottomWidth: StyleSheet.hairlineWidth },
  menuIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  menuText: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
