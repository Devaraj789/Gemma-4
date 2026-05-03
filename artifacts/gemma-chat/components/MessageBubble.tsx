import React, { useEffect, useState } from "react";
import {
  Alert,
  Clipboard,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Feather as F } from "@expo/vector-icons";
import type { Message } from "@/context/ChatContext";
import { useColors } from "@/hooks/useColors";
import { isMessageSaved, saveMessage, unsaveMessage } from "@/lib/savedMessages";
import { CodeBlock } from "./CodeBlock";
import * as Speech from "expo-speech";

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

// ── Inline markdown renderer ──────────────────────────────────────────────────
type Segment =
  | { type: "code_fence"; lang: string; code: string }
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "bullet"; text: string; indent: number }
  | { type: "numbered"; text: string; num: number }
  | { type: "blockquote"; text: string }
  | { type: "hr" }
  | { type: "paragraph"; text: string };

function parseMarkdown(md: string): Segment[] {
  const segments: Segment[] = [];
  const lines = md.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code fence
    if (/^```/.test(line)) {
      const lang = line.replace(/^```/, "").trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      segments.push({ type: "code_fence", lang, code: codeLines.join("\n") });
      continue;
    }

    // HR
    if (/^---+$|^\*\*\*+$/.test(line.trim())) {
      segments.push({ type: "hr" });
      i++;
      continue;
    }

    // Heading
    const hm = line.match(/^(#{1,3})\s+(.+)/);
    if (hm) {
      segments.push({ type: "heading", level: hm[1].length as 1 | 2 | 3, text: hm[2] });
      i++;
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      segments.push({ type: "blockquote", text: line.replace(/^>\s?/, "") });
      i++;
      continue;
    }

    // Bullet
    const bm = line.match(/^(\s*)[-*+]\s+(.+)/);
    if (bm) {
      segments.push({ type: "bullet", text: bm[2], indent: bm[1].length });
      i++;
      continue;
    }

    // Numbered list
    const nm = line.match(/^\s*(\d+)\.\s+(.+)/);
    if (nm) {
      segments.push({ type: "numbered", text: nm[2], num: parseInt(nm[1]) });
      i++;
      continue;
    }

    // Paragraph (collect consecutive non-special lines)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      !/^```/.test(lines[i]) &&
      !/^#{1,3}\s/.test(lines[i]) &&
      !/^[-*+]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^---+$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    const paraText = paraLines.join("\n").trim();
    if (paraText) segments.push({ type: "paragraph", text: paraText });
  }

  return segments;
}

function applyInline(
  text: string,
  baseColor: string,
  baseFontSize: number,
  baseLineHeight: number,
  primaryColor: string,
): React.ReactNode {
  // Bold (**...**), italic (*...*), inline code (`...`), strikethrough (~~...~~)
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|~~[^~]+~~|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, idx) => {
    if (/^\*\*(.+)\*\*$/.test(part)) {
      return (
        <Text key={idx} style={{ fontFamily: "Inter_700Bold", color: baseColor, fontSize: baseFontSize, lineHeight: baseLineHeight }}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    if (/^\*(.+)\*$/.test(part) && !/^\*\*/.test(part)) {
      return (
        <Text key={idx} style={{ fontStyle: "italic", color: baseColor, fontSize: baseFontSize, lineHeight: baseLineHeight }}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    if (/^`(.+)`$/.test(part)) {
      return (
        <Text
          key={idx}
          style={{
            fontFamily: "monospace",
            fontSize: baseFontSize - 1.5,
            backgroundColor: "rgba(110,118,129,0.2)",
            color: "#e6edf3",
            paddingHorizontal: 4,
            borderRadius: 4,
            lineHeight: baseLineHeight,
          }}
        >
          {part.slice(1, -1)}
        </Text>
      );
    }
    if (/^~~(.+)~~$/.test(part)) {
      return (
        <Text key={idx} style={{ textDecorationLine: "line-through", color: baseColor, fontSize: baseFontSize, lineHeight: baseLineHeight }}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    // Link
    const lm = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (lm) {
      return (
        <Text key={idx} style={{ color: primaryColor, textDecorationLine: "underline", fontSize: baseFontSize, lineHeight: baseLineHeight }}>
          {lm[1]}
        </Text>
      );
    }
    return (
      <Text key={idx} style={{ color: baseColor, fontSize: baseFontSize, lineHeight: baseLineHeight }}>
        {part}
      </Text>
    );
  });
}

function MarkdownRenderer({
  content,
  textColor,
  primaryColor,
  borderColor,
  mutedColor,
  fontSize,
  lineHeight,
}: {
  content: string;
  textColor: string;
  primaryColor: string;
  borderColor: string;
  mutedColor: string;
  fontSize: number;
  lineHeight: number;
}) {
  const segments = parseMarkdown(content);

  return (
    <View style={{ gap: 4 }}>
      {segments.map((seg, idx) => {
        switch (seg.type) {
          case "code_fence":
            return <CodeBlock key={idx} code={seg.code} language={seg.lang} />;

          case "heading": {
            const hSize = seg.level === 1 ? fontSize + 5 : seg.level === 2 ? fontSize + 3 : fontSize + 1;
            const hFamily = seg.level === 3 ? "Inter_600SemiBold" : "Inter_700Bold";
            return (
              <Text key={idx} style={{ color: textColor, fontSize: hSize, fontFamily: hFamily, marginTop: 6, marginBottom: 2 }}>
                {applyInline(seg.text, textColor, hSize, hSize * 1.4, primaryColor)}
              </Text>
            );
          }

          case "bullet":
            return (
              <View key={idx} style={{ flexDirection: "row", paddingLeft: 8 + seg.indent * 12, gap: 6, alignItems: "flex-start" }}>
                <Text style={{ color: mutedColor, fontSize: fontSize, lineHeight }}>•</Text>
                <Text style={{ flex: 1, color: textColor, fontSize, lineHeight }}>
                  {applyInline(seg.text, textColor, fontSize, lineHeight, primaryColor)}
                </Text>
              </View>
            );

          case "numbered":
            return (
              <View key={idx} style={{ flexDirection: "row", paddingLeft: 8, gap: 6, alignItems: "flex-start" }}>
                <Text style={{ color: mutedColor, fontSize, lineHeight, minWidth: 22 }}>{seg.num}.</Text>
                <Text style={{ flex: 1, color: textColor, fontSize, lineHeight }}>
                  {applyInline(seg.text, textColor, fontSize, lineHeight, primaryColor)}
                </Text>
              </View>
            );

          case "blockquote":
            return (
              <View key={idx} style={{ borderLeftWidth: 3, borderLeftColor: borderColor, paddingLeft: 12, marginVertical: 2 }}>
                <Text style={{ color: mutedColor, fontSize, lineHeight, fontStyle: "italic" }}>{seg.text}</Text>
              </View>
            );

          case "hr":
            return <View key={idx} style={{ height: StyleSheet.hairlineWidth, backgroundColor: borderColor, marginVertical: 6 }} />;

          case "paragraph":
          default:
            return (
              <Text key={idx} style={{ color: textColor, fontSize, lineHeight, fontFamily: "Inter_400Regular" }}>
                {applyInline(seg.text, textColor, fontSize, lineHeight, primaryColor)}
              </Text>
            );
        }
      })}
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
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
  const [downloading, setDownloading] = useState(false);
  const [imageZoom, setImageZoom] = useState<string | null>(null);

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

  const handleDownloadResponse = async () => {
    const filename = `gemma_response_${Date.now()}.md`;
    if (Platform.OS === "web") {
      const blob = new Blob([message.content], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      return;
    }
    setDownloading(true);
    const uri = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(uri, message.content);
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) await Sharing.shareAsync(uri, { mimeType: "text/markdown", dialogTitle: "Save response" });
    if (Platform.OS === "android") ToastAndroid.show("Response saved!", ToastAndroid.SHORT);
    setDownloading(false);
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
  const attachments = message.attachments ?? [];

  return (
    <>
      {/* Image zoom modal */}
      {imageZoom && (
        <Modal transparent visible animationType="fade" onRequestClose={() => setImageZoom(null)}>
          <Pressable style={styles.zoomOverlay} onPress={() => setImageZoom(null)}>
            <Image source={{ uri: imageZoom }} style={styles.zoomImage} resizeMode="contain" />
            <View style={styles.zoomClose}>
              <Feather name="x" size={20} color="#fff" />
            </View>
          </Pressable>
        </Modal>
      )}

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
          {/* Attached images in user bubble */}
          {attachments.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.attachRow}>
              {attachments.map((att, idx) => {
                if (att.type === "image") {
                  return (
                    <Pressable key={idx} onPress={() => setImageZoom(att.uri)} style={styles.attachImageWrap}>
                      <Image source={{ uri: att.uri }} style={styles.attachImage} resizeMode="cover" />
                    </Pressable>
                  );
                }
                return (
                  <View key={idx} style={[styles.docChip, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                    <Feather name="file-text" size={14} color="#fff" />
                    <Text style={styles.docChipText} numberOfLines={1}>{att.name ?? "Document"}</Text>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* Message content */}
          {!isUser && message.content.length > 0 ? (
            showRaw ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text style={[styles.text, { color: textColor, fontSize: fs, lineHeight: lh, fontFamily: "monospace" }]}>
                  {message.content + (showCursor ? "▌" : "")}
                </Text>
              </ScrollView>
            ) : (
              <MarkdownRenderer
                content={message.content + (showCursor ? "▌" : "")}
                textColor={textColor}
                primaryColor={colors.primary}
                borderColor={colors.border}
                mutedColor={colors.mutedForeground}
                fontSize={fs}
                lineHeight={lh}
              />
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
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: copied ? colors.accent : colors.secondary }]} onPress={handleCopy} activeOpacity={0.7}>
            <Feather name={copied ? "check" : "copy"} size={14} color={copied ? colors.accentForeground : colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: isSpeaking ? colors.primary : colors.secondary }]} onPress={handleSpeak} activeOpacity={0.7}>
            <Feather name={isSpeaking ? "volume-x" : "volume-2"} size={14} color={isSpeaking ? colors.primaryForeground : colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: showRaw ? colors.primary : colors.secondary }]} onPress={() => setShowRaw((p) => !p)} activeOpacity={0.7}>
            <Feather name={showRaw ? "type" : "code"} size={14} color={showRaw ? colors.primaryForeground : colors.mutedForeground} />
          </TouchableOpacity>
          {/* Download response */}
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: downloading ? colors.accent : colors.secondary }]} onPress={() => void handleDownloadResponse()} activeOpacity={0.7}>
            <Feather name={downloading ? "check" : "download"} size={14} color={downloading ? colors.accentForeground : colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.secondary }]} onPress={() => void handleShare()} activeOpacity={0.7}>
            <Feather name="share-2" size={14} color={colors.mutedForeground} />
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
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: bookmarked ? colors.primary + "22" : colors.secondary }]} onPress={() => void handleBookmark()} activeOpacity={0.7}>
            <Feather name="bookmark" size={14} color={bookmarked ? colors.primary : colors.mutedForeground} />
          </TouchableOpacity>
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
  bubble: { maxWidth: "88%", paddingHorizontal: 14, paddingVertical: 12, borderRadius: 20, gap: 8 },
  text: { fontFamily: "Inter_400Regular" },
  attachRow: { maxHeight: 120, marginBottom: 4 },
  attachImageWrap: { borderRadius: 10, overflow: "hidden", marginRight: 8 },
  attachImage: { width: 110, height: 110, borderRadius: 10 },
  docChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, marginRight: 8,
    maxWidth: 140,
  },
  docChipText: { color: "#fff", fontSize: 12, fontFamily: "Inter_500Medium", flex: 1 },
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
  zoomOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center" },
  zoomImage: { width: "95%", height: "80%" },
  zoomClose: { position: "absolute", top: 50, right: 20, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, padding: 8 },
});
