import React, { useEffect, useState } from "react";
import {
  Alert,
  Clipboard,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Markdown from "react-native-markdown-display";
import * as Speech from "expo-speech";
import type { Message } from "@/context/ChatContext";
import { useColors } from "@/hooks/useColors";
import { isMessageSaved, saveMessage, unsaveMessage } from "@/lib/savedMessages";

type FontSize = "small" | "medium" | "large";

type Props = {
  message: Message;
  showCursor?: boolean;
  fontSize?: FontSize;
  onEdit?: (message: Message) => void;
  onRetry?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  convId?: string;
  convTitle?: string;
};

const FONT_SIZES: Record<FontSize, number> = { small: 13.5, medium: 15.5, large: 18 };
const LINE_HEIGHTS: Record<FontSize, number> = { small: 19, medium: 22, large: 26 };

function formatLoadTime(ms: number): string {
  return ms < 1000 ? `${ms}ms load` : `${(ms / 1000).toFixed(1)}s load`;
}

function calcReadingTime(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words < 60) return "";
  const mins = Math.max(1, Math.round(words / 200));
  return `~${mins} min read`;
}

export function MessageBubble({
  message,
  showCursor,
  fontSize = "medium",
  onEdit,
  onRetry,
  onDelete,
  convId = "",
  convTitle = "",
}: Props) {
  const colors = useColors();
  const isUser = message.role === "user";
  const bubbleColor = isUser ? colors.bubbleUser : colors.bubbleAssistant;
  const textColor = isUser ? colors.bubbleUserText : colors.bubbleAssistantText;
  const fs = FONT_SIZES[fontSize];
  const lh = LINE_HEIGHTS[fontSize];

  const [menuVisible, setMenuVisible] = useState(false);
  const [liked, setLiked] = useState<null | "up" | "down">(null);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    if (!isUser && message.content.length > 0) {
      void isMessageSaved(message.id).then(setBookmarked);
    }
  }, [isUser, message.id, message.content.length]);

  useEffect(() => {
    return () => { void Speech.stop(); };
  }, []);

  const handleSpeak = () => {
    if (isSpeaking) {
      void Speech.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      void Speech.speak(message.content, {
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  const handleCopy = () => {
    Clipboard.setString(message.content);
    if (Platform.OS === "android") ToastAndroid.show("Copied!", ToastAndroid.SHORT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setMenuVisible(false);
  };

  const handleShare = async () => {
    setMenuVisible(false);
    try {
      await Share.share({ message: message.content, title: isUser ? "My message" : "Gemma's response" });
    } catch { /* user cancelled */ }
  };

  const handleEdit = () => { setMenuVisible(false); onEdit?.(message); };
  const handleRetry = () => { setMenuVisible(false); onRetry?.(message); };

  const handleDelete = () => {
    setMenuVisible(false);
    if (Platform.OS === "web") {
      if (window.confirm("Delete this message?")) onDelete?.(message);
      return;
    }
    Alert.alert("Delete message?", "This message will be removed from this conversation.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => onDelete?.(message) },
    ]);
  };

  const handleBookmark = async () => {
    if (bookmarked) {
      await unsaveMessage(message.id);
      setBookmarked(false);
      if (Platform.OS === "android") ToastAndroid.show("Removed from saved", ToastAndroid.SHORT);
    } else {
      await saveMessage({ id: message.id, convId, convTitle, role: message.role, content: message.content, savedAt: Date.now() });
      setBookmarked(true);
      if (Platform.OS === "android") ToastAndroid.show("Message saved!", ToastAndroid.SHORT);
    }
  };

  const stats = message.stats;
  const showStats = !isUser && !showCursor && message.content.length > 0 && stats && (stats.tokensPerSec > 0 || (stats.loadTimeMs ?? 0) > 0);
  const readingTime = !isUser && !showCursor && message.content.length > 0 ? calcReadingTime(message.content) : "";

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
      {/* Long-press Modal — user message */}
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
              <TouchableOpacity style={[styles.menuItem, styles.menuItemBorder, { borderBottomColor: colors.border }]} onPress={() => void handleShare()} activeOpacity={0.7}>
                <View style={[styles.menuIcon, { backgroundColor: colors.accent }]}>
                  <Feather name="share-2" size={15} color={colors.accentForeground} />
                </View>
                <Text style={[styles.menuText, { color: colors.foreground }]}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.menuItem, styles.menuItemBorder, { borderBottomColor: colors.border }]} onPress={handleEdit} activeOpacity={0.7}>
                <View style={[styles.menuIcon, { backgroundColor: colors.accent }]}>
                  <Feather name="edit-2" size={15} color={colors.accentForeground} />
                </View>
                <Text style={[styles.menuText, { color: colors.foreground }]}>Edit & Resend</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={handleDelete} activeOpacity={0.7}>
                <View style={[styles.menuIcon, { backgroundColor: colors.destructive + "20" }]}>
                  <Feather name="trash-2" size={15} color={colors.destructive} />
                </View>
                <Text style={[styles.menuText, { color: colors.destructive }]}>Delete</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Bubble */}
      <Pressable
        onPress={isUser ? () => setMenuVisible(true) : undefined}
        onLongPress={() => { if (isUser) setMenuVisible(true); }}
        delayLongPress={300}
        style={[styles.row, { justifyContent: isUser ? "flex-end" : "flex-start" }]}
      >
        <View style={[styles.bubble, { backgroundColor: bubbleColor, borderTopRightRadius: isUser ? 4 : 20, borderTopLeftRadius: isUser ? 20 : 4 }]}>
          {!isUser && message.content.length > 0 ? (
            showRaw ? (
              <Text style={[styles.text, { color: textColor, fontSize: fs, lineHeight: lh }]}>
                {message.content + (showCursor ? "▌" : "")}
              </Text>
            ) : (
              <Markdown style={mdStyles as any}>
                {message.content + (showCursor ? "▌" : "")}
              </Markdown>
            )
          ) : (
            <Text style={[styles.text, { color: textColor, fontSize: fs, lineHeight: lh }]}>
              {message.content}
              {showCursor ? <Text style={{ color: textColor, opacity: 0.6 }}>▌</Text> : null}
            </Text>
          )}
        </View>
      </Pressable>

      {/* Reading time + Stats row */}
      {(readingTime || showStats) ? (
        <View style={styles.statsRow}>
          {readingTime ? (
            <View style={[styles.statPill, { backgroundColor: colors.secondary }]}>
              <Feather name="book-open" size={10} color={colors.mutedForeground} />
              <Text style={[styles.statText, { color: colors.mutedForeground }]}>{readingTime}</Text>
            </View>
          ) : null}
          {showStats && (stats!.loadTimeMs ?? 0) > 0 ? (
            <View style={[styles.statPill, { backgroundColor: colors.secondary }]}>
              <Feather name="clock" size={10} color={colors.mutedForeground} />
              <Text style={[styles.statText, { color: colors.mutedForeground }]}>{formatLoadTime(stats!.loadTimeMs!)}</Text>
            </View>
          ) : null}
          {showStats && stats!.tokensPerSec > 0 ? (
            <View style={[styles.statPill, { backgroundColor: colors.secondary }]}>
              <Feather name="zap" size={10} color={colors.mutedForeground} />
              <Text style={[styles.statText, { color: colors.mutedForeground }]}>{stats!.tokensPerSec.toFixed(1)} tok/s</Text>
            </View>
          ) : null}
          {showStats && stats!.totalTokens > 0 ? (
            <View style={[styles.statPill, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.statText, { color: colors.mutedForeground }]}>{stats!.totalTokens} tokens</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* AI action bar */}
      {!isUser && !showCursor && message.content.length > 0 && (
        <View style={[styles.actionBar, { justifyContent: "flex-start" }]}>
          {/* Copy */}
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: copied ? colors.accent : colors.secondary }]} onPress={handleCopy} activeOpacity={0.7}>
            <Feather name={copied ? "check" : "copy"} size={14} color={copied ? colors.accentForeground : colors.mutedForeground} />
          </TouchableOpacity>

          {/* Feature 1: Text-to-Speech */}
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: isSpeaking ? colors.primary : colors.secondary }]} onPress={handleSpeak} activeOpacity={0.7}>
            <Feather name={isSpeaking ? "volume-x" : "volume-2"} size={14} color={isSpeaking ? colors.primaryForeground : colors.mutedForeground} />
          </TouchableOpacity>

          {/* Feature 2: Markdown raw/rendered toggle */}
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: showRaw ? colors.primary : colors.secondary }]} onPress={() => setShowRaw((p) => !p)} activeOpacity={0.7}>
            <Feather name={showRaw ? "type" : "code"} size={14} color={showRaw ? colors.primaryForeground : colors.mutedForeground} />
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.secondary }]} onPress={() => void handleShare()} activeOpacity={0.7}>
            <Feather name="share-2" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>

          {/* Thumbs */}
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: liked === "up" ? colors.accent : colors.secondary }]} onPress={() => setLiked(liked === "up" ? null : "up")} activeOpacity={0.7}>
            <Feather name="thumbs-up" size={14} color={liked === "up" ? colors.accentForeground : colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: liked === "down" ? colors.accent : colors.secondary }]} onPress={() => setLiked(liked === "down" ? null : "down")} activeOpacity={0.7}>
            <Feather name="thumbs-down" size={14} color={liked === "down" ? colors.accentForeground : colors.mutedForeground} />
          </TouchableOpacity>

          {/* Retry */}
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.secondary }]} onPress={handleRetry} activeOpacity={0.7}>
            <Feather name="rotate-ccw" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>

          {/* Feature 10: Bookmark */}
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: bookmarked ? colors.primary + "22" : colors.secondary }]} onPress={() => void handleBookmark()} activeOpacity={0.7}>
            <Feather name="bookmark" size={14} color={bookmarked ? colors.primary : colors.mutedForeground} />
          </TouchableOpacity>

          {/* Feature 7: Delete AI message */}
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.secondary }]} onPress={handleDelete} activeOpacity={0.7}>
            <Feather name="trash-2" size={14} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      )}

      {/* User action bar */}
      {isUser && !showCursor && message.content.length > 0 && (
        <View style={[styles.actionBar, { justifyContent: "flex-end" }]}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: copied ? colors.accent : colors.secondary }]} onPress={handleCopy} activeOpacity={0.7}>
            <Feather name={copied ? "check" : "copy"} size={14} color={copied ? colors.accentForeground : colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.secondary }]} onPress={() => void handleShare()} activeOpacity={0.7}>
            <Feather name="share-2" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.secondary }]} onPress={handleEdit} activeOpacity={0.7}>
            <Feather name="edit-2" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.secondary }]} onPress={handleRetry} activeOpacity={0.7}>
            <Feather name="rotate-ccw" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
          {/* Feature 7: Delete user message */}
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.secondary }]} onPress={handleDelete} activeOpacity={0.7}>
            <Feather name="trash-2" size={14} color={colors.destructive} />
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
  statsRow: { flexDirection: "row", paddingHorizontal: 20, paddingTop: 2, paddingBottom: 2, gap: 6, flexWrap: "wrap" },
  statPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statText: { fontSize: 10.5, fontFamily: "Inter_500Medium" },
  actionBar: { flexDirection: "row", paddingHorizontal: 20, paddingBottom: 6, gap: 6, flexWrap: "wrap" },
  actionBtn: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" },
  menu: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, minWidth: 200, overflow: "hidden", elevation: 12, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  menuItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  menuItemBorder: { borderBottomWidth: StyleSheet.hairlineWidth },
  menuIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  menuText: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
