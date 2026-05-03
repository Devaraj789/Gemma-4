import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
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
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Speech from "expo-speech";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Reanimated, { useAnimatedStyle, interpolate, type SharedValue } from "react-native-reanimated";
import type { Message, ReplyTo } from "@/context/ChatContext";
import { useColors } from "@/hooks/useColors";
import { isMessageSaved, saveMessage, unsaveMessage } from "@/lib/savedMessages";
import { CodeBlock } from "./CodeBlock";
import { EmojiReactionPicker } from "./EmojiReactionPicker";
import { ReactionsBar } from "./ReactionsBar";

type FontSize = "small" | "medium" | "large";
const FONT_SIZES: Record<FontSize, number> = { small: 13.5, medium: 15.5, large: 18 };
const LINE_HEIGHTS: Record<FontSize, number> = { small: 19, medium: 22, large: 26 };

type Props = {
  message: Message;
  showCursor?: boolean;
  fontSize?: FontSize;
  onEdit?: (message: Message) => void;
  onRetry?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  onReply?: (message: Message) => void;
  onReact?: (msgId: string, emoji: string) => void;
  onPin?: (msgId: string) => void;
  onUnpin?: (msgId: string) => void;
  convId?: string;
  convTitle?: string;
  searchHighlight?: string;
};

// ─── Timestamp ────────────────────────────────────────────────────────────────
function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 0) return time;
  if (diffDays === 1) return `Yesterday ${time}`;
  if (diffDays < 7) return `${d.toLocaleDateString([], { weekday: "short" })} ${time}`;
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${time}`;
}

function formatLoadTime(ms: number): string {
  return ms < 1000 ? `${ms}ms load` : `${(ms / 1000).toFixed(1)}s load`;
}

function calcReadingTime(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words < 60) return "";
  return `~${Math.max(1, Math.round(words / 200))} min read`;
}

// ─── Inline markdown ──────────────────────────────────────────────────────────
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
    if (/^```/.test(line)) {
      const lang = line.replace(/^```/, "").trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) { codeLines.push(lines[i]); i++; }
      i++;
      segments.push({ type: "code_fence", lang, code: codeLines.join("\n") });
      continue;
    }
    if (/^---+$|^\*\*\*+$/.test(line.trim())) { segments.push({ type: "hr" }); i++; continue; }
    const hm = line.match(/^(#{1,3})\s+(.+)/);
    if (hm) { segments.push({ type: "heading", level: hm[1].length as 1|2|3, text: hm[2] }); i++; continue; }
    if (/^>\s?/.test(line)) { segments.push({ type: "blockquote", text: line.replace(/^>\s?/, "") }); i++; continue; }
    const bm = line.match(/^(\s*)[-*+]\s+(.+)/);
    if (bm) { segments.push({ type: "bullet", text: bm[2], indent: bm[1].length }); i++; continue; }
    const nm = line.match(/^\s*(\d+)\.\s+(.+)/);
    if (nm) { segments.push({ type: "numbered", text: nm[2], num: parseInt(nm[1]) }); i++; continue; }
    const paraLines: string[] = [];
    while (i < lines.length && !/^```/.test(lines[i]) && !/^#{1,3}\s/.test(lines[i]) &&
      !/^[-*+]\s/.test(lines[i]) && !/^\d+\.\s/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) && !/^---+$/.test(lines[i].trim())) {
      paraLines.push(lines[i]); i++;
    }
    const pt = paraLines.join("\n").trim();
    if (pt) segments.push({ type: "paragraph", text: pt });
  }
  return segments;
}

function highlightSegment(text: string, query: string, baseStyle: object): React.ReactNode {
  if (!query) return <Text style={baseStyle}>{text}</Text>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  if (parts.length === 1) return <Text style={baseStyle}>{text}</Text>;
  return (
    <Text style={baseStyle}>
      {parts.map((p, i) =>
        p.toLowerCase() === query.toLowerCase()
          ? <Text key={i} style={{ backgroundColor: "#fbbf24", color: "#1a1a1a", borderRadius: 2 }}>{p}</Text>
          : p
      )}
    </Text>
  );
}

function applyInline(text: string, baseColor: string, fs: number, lh: number, primary: string, highlight?: string): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|~~[^~]+~~|\[[^\]]+\]\([^)]+\))/g).map((part, i) => {
    if (/^\*\*(.+)\*\*$/.test(part)) return <Text key={i} style={{ fontFamily:"Inter_700Bold", color:baseColor, fontSize:fs, lineHeight:lh }}>{part.slice(2,-2)}</Text>;
    if (/^\*([^*]+)\*$/.test(part)) return <Text key={i} style={{ fontStyle:"italic", color:baseColor, fontSize:fs, lineHeight:lh }}>{part.slice(1,-1)}</Text>;
    if (/^`(.+)`$/.test(part)) return <Text key={i} style={{ fontFamily:"monospace", fontSize:fs-1.5, backgroundColor:"rgba(110,118,129,0.2)", color:"#e6edf3", paddingHorizontal:4, borderRadius:4, lineHeight:lh }}>{part.slice(1,-1)}</Text>;
    if (/^~~(.+)~~$/.test(part)) return <Text key={i} style={{ textDecorationLine:"line-through", color:baseColor, fontSize:fs, lineHeight:lh }}>{part.slice(2,-2)}</Text>;
    const lm = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (lm) return <Text key={i} style={{ color:primary, textDecorationLine:"underline", fontSize:fs, lineHeight:lh }}>{lm[1]}</Text>;
    if (highlight && part.toLowerCase().includes(highlight.toLowerCase())) {
      return highlightSegment(part, highlight, { color:baseColor, fontSize:fs, lineHeight:lh });
    }
    return <Text key={i} style={{ color:baseColor, fontSize:fs, lineHeight:lh }}>{part}</Text>;
  });
}

function MarkdownRenderer({ content, textColor, primaryColor, borderColor, mutedColor, fontSize, lineHeight, searchHighlight }: {
  content: string; textColor: string; primaryColor: string; borderColor: string; mutedColor: string; fontSize: number; lineHeight: number; searchHighlight?: string;
}) {
  const hl = searchHighlight?.trim().toLowerCase() || undefined;
  return (
    <View style={{ gap: 4 }}>
      {parseMarkdown(content).map((seg, idx) => {
        switch (seg.type) {
          case "code_fence": return <CodeBlock key={idx} code={seg.code} language={seg.lang} />;
          case "heading": {
            const hSize = seg.level===1 ? fontSize+5 : seg.level===2 ? fontSize+3 : fontSize+1;
            return <Text key={idx} style={{ color:textColor, fontSize:hSize, fontFamily:seg.level===3?"Inter_600SemiBold":"Inter_700Bold", marginTop:6, marginBottom:2 }}>{applyInline(seg.text,textColor,hSize,hSize*1.4,primaryColor,hl)}</Text>;
          }
          case "bullet": return <View key={idx} style={{ flexDirection:"row", paddingLeft:8+seg.indent*12, gap:6, alignItems:"flex-start" }}><Text style={{ color:mutedColor, fontSize, lineHeight }}>•</Text><Text style={{ flex:1, color:textColor, fontSize, lineHeight }}>{applyInline(seg.text,textColor,fontSize,lineHeight,primaryColor,hl)}</Text></View>;
          case "numbered": return <View key={idx} style={{ flexDirection:"row", paddingLeft:8, gap:6, alignItems:"flex-start" }}><Text style={{ color:mutedColor, fontSize, lineHeight, minWidth:22 }}>{seg.num}.</Text><Text style={{ flex:1, color:textColor, fontSize, lineHeight }}>{applyInline(seg.text,textColor,fontSize,lineHeight,primaryColor,hl)}</Text></View>;
          case "blockquote": return <View key={idx} style={{ borderLeftWidth:3, borderLeftColor:borderColor, paddingLeft:12, marginVertical:2 }}><Text style={{ color:mutedColor, fontSize, lineHeight, fontStyle:"italic" }}>{seg.text}</Text></View>;
          case "hr": return <View key={idx} style={{ height:StyleSheet.hairlineWidth, backgroundColor:borderColor, marginVertical:6 }} />;
          default: return <Text key={idx} style={{ color:textColor, fontSize, lineHeight, fontFamily:"Inter_400Regular" }}>{applyInline(seg.text,textColor,fontSize,lineHeight,primaryColor,hl)}</Text>;
        }
      })}
    </View>
  );
}

// ─── Swipe action ─────────────────────────────────────────────────────────────
function RightAction({ progress, isUser, onReply }: { progress: SharedValue<number>; isUser: boolean; onReply: () => void }) {
  const colors = useColors();
  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0.6, 1]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.6, 1]) }],
  }));
  return (
    <Pressable onPress={onReply} style={[styles.swipeAction, { justifyContent: isUser ? "flex-end" : "flex-start" }]}>
      <Reanimated.View style={[styles.swipeIconWrap, animStyle, { backgroundColor: colors.primary + "20" }]}>
        <Feather name="corner-up-left" size={18} color={colors.primary} />
      </Reanimated.View>
    </Pressable>
  );
}

// ─── Reply quote block ────────────────────────────────────────────────────────
function ReplyQuote({ replyTo, isUser, primaryColor, mutedColor }: { replyTo: ReplyTo; isUser: boolean; primaryColor: string; mutedColor: string }) {
  const preview = replyTo.content.replace(/```[\s\S]*?```/g, "[code]").trim().slice(0, 100);
  return (
    <View style={[styles.replyQuote, { borderLeftColor: primaryColor, backgroundColor: isUser ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)" }]}>
      <Text style={[styles.replyQuoteLabel, { color: isUser ? "rgba(255,255,255,0.7)" : primaryColor }]}>
        {replyTo.role === "user" ? "You" : "Gemma"}
      </Text>
      <Text style={[styles.replyQuoteText, { color: isUser ? "rgba(255,255,255,0.85)" : mutedColor }]} numberOfLines={2}>
        {preview}
      </Text>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function MessageBubble({
  message, showCursor, fontSize = "medium",
  onEdit, onRetry, onDelete, onReply, onReact, onPin, onUnpin,
  convId = "", convTitle = "", searchHighlight,
}: Props) {
  const colors = useColors();
  const isUser = message.role === "user";
  const bubbleColor = isUser ? colors.bubbleUser : colors.bubbleAssistant;
  const textColor = isUser ? colors.bubbleUserText : colors.bubbleAssistantText;
  const fs = FONT_SIZES[fontSize];
  const lh = LINE_HEIGHTS[fontSize];
  const swipeRef = useRef<any>(null);

  const [menuVisible, setMenuVisible] = useState(false);
  const [liked, setLiked] = useState<null | "up" | "down">(null);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [imageZoom, setImageZoom] = useState<string | null>(null);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);

  useEffect(() => {
    if (!isUser && message.content.length > 0) void isMessageSaved(message.id).then(setBookmarked);
  }, [isUser, message.id, message.content.length]);

  useEffect(() => { return () => { void Speech.stop(); }; }, []);

  const handleSpeak = () => {
    if (isSpeaking) { void Speech.stop(); setIsSpeaking(false); }
    else { setIsSpeaking(true); void Speech.speak(message.content, { onDone: () => setIsSpeaking(false), onStopped: () => setIsSpeaking(false), onError: () => setIsSpeaking(false) }); }
  };

  const handleCopy = () => {
    Clipboard.setString(message.content);
    if (Platform.OS === "android") ToastAndroid.show("Copied!", ToastAndroid.SHORT);
    setCopied(true); setTimeout(() => setCopied(false), 2000); setMenuVisible(false);
  };

  const handleShare = async () => {
    setMenuVisible(false);
    try { await Share.share({ message: message.content }); } catch {}
  };

  const handleDownloadResponse = async () => {
    const filename = `gemma_response_${Date.now()}.md`;
    if (Platform.OS === "web") {
      const blob = new Blob([message.content], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url); return;
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
    if (Platform.OS === "web") { if (window.confirm("Delete this message?")) onDelete?.(message); return; }
    Alert.alert("Delete message?", "This message will be removed.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => onDelete?.(message) },
    ]);
  };

  const handleBookmark = async () => {
    if (bookmarked) { await unsaveMessage(message.id); setBookmarked(false); if (Platform.OS === "android") ToastAndroid.show("Removed from saved", ToastAndroid.SHORT); }
    else { await saveMessage({ id: message.id, convId, convTitle, role: message.role as "user" | "assistant", content: message.content, savedAt: Date.now() }); setBookmarked(true); if (Platform.OS === "android") ToastAndroid.show("Saved!", ToastAndroid.SHORT); }
  };

  const handleSwipeReply = () => { swipeRef.current?.close(); onReply?.(message); };

  const handlePinToggle = () => {
    if (message.pinned) { onUnpin?.(message.id); if (Platform.OS === "android") ToastAndroid.show("Unpinned", ToastAndroid.SHORT); }
    else { onPin?.(message.id); if (Platform.OS === "android") ToastAndroid.show("📌 Pinned", ToastAndroid.SHORT); }
  };

  const handleReact = (emoji: string) => { onReact?.(message.id, emoji); };

  const stats = message.stats;
  const showStats = !isUser && !showCursor && message.content.length > 0 && stats && (stats.tokensPerSec > 0 || (stats.loadTimeMs ?? 0) > 0);
  const readingTime = !isUser && !showCursor && message.content.length > 0 ? calcReadingTime(message.content) : "";
  const attachments = message.attachments ?? [];
  const reactions = message.reactions ?? [];

  const bubbleContent = (
    <>
      {/* Image zoom modal */}
      {imageZoom && (
        <Modal transparent visible animationType="fade" onRequestClose={() => setImageZoom(null)}>
          <Pressable style={styles.zoomOverlay} onPress={() => setImageZoom(null)}>
            <Image source={{ uri: imageZoom }} style={styles.zoomImage} resizeMode="contain" />
            <View style={styles.zoomClose}><Feather name="x" size={20} color="#fff" /></View>
          </Pressable>
        </Modal>
      )}

      {/* Emoji reaction picker */}
      <EmojiReactionPicker
        visible={reactionPickerOpen}
        onClose={() => setReactionPickerOpen(false)}
        onSelect={handleReact}
        currentReactions={reactions}
      />

      {/* User context menu */}
      {isUser && (
        <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
            <Pressable style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {[
                { icon: "corner-up-left" as const, label: "Reply", action: () => { setMenuVisible(false); onReply?.(message); } },
                { icon: "smile" as const, label: "React", action: () => { setMenuVisible(false); setReactionPickerOpen(true); } },
                { icon: message.pinned ? "bookmark" as const : "bookmark" as const, label: message.pinned ? "Unpin" : "Pin", action: () => { setMenuVisible(false); handlePinToggle(); } },
                { icon: "copy" as const, label: "Copy", action: handleCopy },
                { icon: "share-2" as const, label: "Share", action: () => void handleShare() },
                { icon: "edit-2" as const, label: "Edit & Resend", action: handleEdit },
              ].map((item, i, arr) => (
                <TouchableOpacity key={item.label} style={[styles.menuItem, i < arr.length-1 && styles.menuItemBorder, i < arr.length-1 && { borderBottomColor: colors.border }]} onPress={item.action} activeOpacity={0.7}>
                  <View style={[styles.menuIcon, { backgroundColor: colors.accent }]}><Feather name={item.icon} size={15} color={colors.accentForeground} /></View>
                  <Text style={[styles.menuText, { color: colors.foreground }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.menuItem} onPress={handleDelete} activeOpacity={0.7}>
                <View style={[styles.menuIcon, { backgroundColor: colors.destructive + "20" }]}><Feather name="trash-2" size={15} color={colors.destructive} /></View>
                <Text style={[styles.menuText, { color: colors.destructive }]}>Delete</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Bubble */}
      <Pressable
        onPress={isUser ? () => setMenuVisible(true) : undefined}
        onLongPress={() => { if (isUser) setMenuVisible(true); else setReactionPickerOpen(true); }}
        delayLongPress={300}
        style={[styles.row, { justifyContent: isUser ? "flex-end" : "flex-start" }]}
      >
        <View style={[styles.bubble, { backgroundColor: bubbleColor, borderTopRightRadius: isUser ? 4 : 20, borderTopLeftRadius: isUser ? 20 : 4 }]}>
          {/* Pin indicator */}
          {message.pinned && (
            <View style={styles.pinIndicator}>
              <Feather name="bookmark" size={11} color={isUser ? "rgba(255,255,255,0.6)" : colors.primary} />
            </View>
          )}

          {/* Reply quote block */}
          {message.replyTo && (
            <ReplyQuote replyTo={message.replyTo} isUser={isUser} primaryColor={colors.primary} mutedColor={colors.mutedForeground} />
          )}

          {/* Attached images */}
          {attachments.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.attachRow}>
              {attachments.map((att, idx) =>
                att.type === "image" ? (
                  <Pressable key={idx} onPress={() => setImageZoom(att.uri)} style={styles.attachImageWrap}>
                    <Image source={{ uri: att.uri }} style={styles.attachImage} resizeMode="cover" />
                  </Pressable>
                ) : (
                  <View key={idx} style={[styles.docChip, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                    <Feather name="file-text" size={14} color="#fff" />
                    <Text style={styles.docChipText} numberOfLines={1}>{att.name ?? "Document"}</Text>
                  </View>
                )
              )}
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
              <MarkdownRenderer content={message.content + (showCursor ? "▌" : "")} textColor={textColor} primaryColor={colors.primary} borderColor={colors.border} mutedColor={colors.mutedForeground} fontSize={fs} lineHeight={lh} searchHighlight={searchHighlight} />
            )
          ) : (
            <Text style={[styles.text, { color: textColor, fontSize: fs, lineHeight: lh }]}>
              {message.content}{showCursor ? <Text style={{ opacity: 0.6 }}>▌</Text> : null}
            </Text>
          )}
        </View>
      </Pressable>

      {/* Reactions bar */}
      <ReactionsBar reactions={reactions} isUser={isUser} onToggle={handleReact} />

      {/* Timestamp + stats row */}
      <View style={[styles.metaRow, { justifyContent: isUser ? "flex-end" : "flex-start" }]}>
        <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>{formatTime(message.createdAt)}</Text>
        {readingTime ? <View style={[styles.statPill, { backgroundColor: colors.secondary }]}><Feather name="book-open" size={10} color={colors.mutedForeground} /><Text style={[styles.statText, { color: colors.mutedForeground }]}>{readingTime}</Text></View> : null}
        {showStats && (stats!.loadTimeMs ?? 0) > 0 ? <View style={[styles.statPill, { backgroundColor: colors.secondary }]}><Feather name="clock" size={10} color={colors.mutedForeground} /><Text style={[styles.statText, { color: colors.mutedForeground }]}>{formatLoadTime(stats!.loadTimeMs!)}</Text></View> : null}
        {showStats && stats!.tokensPerSec > 0 ? <View style={[styles.statPill, { backgroundColor: colors.secondary }]}><Feather name="zap" size={10} color={colors.mutedForeground} /><Text style={[styles.statText, { color: colors.mutedForeground }]}>{stats!.tokensPerSec.toFixed(1)} tok/s</Text></View> : null}
        {showStats && stats!.totalTokens > 0 ? <View style={[styles.statPill, { backgroundColor: colors.secondary }]}><Text style={[styles.statText, { color: colors.mutedForeground }]}>{stats!.totalTokens} tokens</Text></View> : null}
      </View>

      {/* AI action bar */}
      {!isUser && !showCursor && message.content.length > 0 && (
        <View style={[styles.actionBar, { justifyContent: "flex-start" }]}>
          {[
            { name: "corner-up-left" as const, action: () => onReply?.(message), active: false },
            { name: "smile" as const, action: () => setReactionPickerOpen(true), active: reactions.length > 0, activeColor: colors.primary },
            { name: message.pinned ? "bookmark" as const : "bookmark" as const, action: handlePinToggle, active: !!message.pinned, activeColor: colors.primary },
            { name: copied ? "check" as const : "copy" as const, action: handleCopy, active: copied },
            { name: isSpeaking ? "volume-x" as const : "volume-2" as const, action: handleSpeak, active: isSpeaking, activeColor: colors.primary },
            { name: showRaw ? "type" as const : "code" as const, action: () => setShowRaw(p => !p), active: showRaw, activeColor: colors.primary },
            { name: downloading ? "check" as const : "download" as const, action: () => void handleDownloadResponse(), active: downloading },
            { name: "share-2" as const, action: () => void handleShare(), active: false },
            { name: "thumbs-up" as const, action: () => setLiked(liked === "up" ? null : "up"), active: liked === "up" },
            { name: "thumbs-down" as const, action: () => setLiked(liked === "down" ? null : "down"), active: liked === "down" },
            { name: "rotate-ccw" as const, action: handleRetry, active: false },
            { name: "bookmark" as const, action: () => void handleBookmark(), active: bookmarked, activeColor: colors.primary },
            { name: "trash-2" as const, action: handleDelete, active: false, danger: true },
          ].map((btn, i) => (
            <TouchableOpacity key={i} style={[styles.actionBtn, { backgroundColor: btn.active ? (btn.activeColor ? btn.activeColor + "22" : colors.accent) : colors.secondary }]} onPress={btn.action} activeOpacity={0.7}>
              <Feather name={btn.name} size={14} color={btn.danger ? colors.destructive : btn.active ? (btn.activeColor ?? colors.accentForeground) : colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* User action bar */}
      {isUser && !showCursor && message.content.length > 0 && (
        <View style={[styles.actionBar, { justifyContent: "flex-end" }]}>
          {[
            { name: "corner-up-left" as const, action: () => onReply?.(message), active: false },
            { name: "smile" as const, action: () => setReactionPickerOpen(true), active: reactions.length > 0, activeColor: colors.primary },
            { name: "bookmark" as const, action: handlePinToggle, active: !!message.pinned, activeColor: colors.primary },
            { name: copied ? "check" as const : "copy" as const, action: handleCopy, active: copied },
            { name: "share-2" as const, action: () => void handleShare(), active: false },
            { name: "edit-2" as const, action: handleEdit, active: false },
            { name: "rotate-ccw" as const, action: handleRetry, active: false },
            { name: "trash-2" as const, action: handleDelete, active: false, danger: true },
          ].map((btn, i) => (
            <TouchableOpacity key={i} style={[styles.actionBtn, { backgroundColor: btn.active ? (btn.activeColor ? btn.activeColor + "22" : colors.accent) : colors.secondary }]} onPress={btn.action} activeOpacity={0.7}>
              <Feather name={btn.name} size={14} color={btn.danger ? colors.destructive : btn.active ? (btn.activeColor ?? colors.accentForeground) : colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </>
  );

  if (!onReply) return <>{bubbleContent}</>;

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      friction={2}
      overshootRight={false}
      rightThreshold={40}
      renderRightActions={(progress) => (
        <RightAction progress={progress} isUser={isUser} onReply={handleSwipeReply} />
      )}
    >
      {bubbleContent}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 3 },
  bubble: { maxWidth: "88%", paddingHorizontal: 14, paddingVertical: 11, borderRadius: 20, gap: 8 },
  text: { fontFamily: "Inter_400Regular" },
  pinIndicator: { position: "absolute", top: 6, right: 8 },
  attachRow: { maxHeight: 120, marginBottom: 2 },
  attachImageWrap: { borderRadius: 10, overflow: "hidden", marginRight: 8 },
  attachImage: { width: 110, height: 110, borderRadius: 10 },
  docChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, marginRight: 8, maxWidth: 140 },
  docChipText: { color: "#fff", fontSize: 12, fontFamily: "Inter_500Medium", flex: 1 },
  replyQuote: { borderLeftWidth: 3, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 4, gap: 2 },
  replyQuoteLabel: { fontSize: 11, fontFamily: "Inter_700Bold" },
  replyQuoteText: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 16 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, paddingTop: 2, paddingBottom: 1, gap: 5, alignItems: "center" },
  timestamp: { fontSize: 10.5, fontFamily: "Inter_400Regular" },
  statPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  statText: { fontSize: 10.5, fontFamily: "Inter_500Medium" },
  actionBar: { flexDirection: "row", paddingHorizontal: 20, paddingBottom: 6, gap: 6, flexWrap: "wrap" },
  actionBtn: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  swipeAction: { width: 70, alignItems: "center", justifyContent: "center", flexDirection: "row", paddingHorizontal: 12 },
  swipeIconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" },
  menu: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, minWidth: 200, overflow: "hidden", elevation: 12, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  menuItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  menuItemBorder: { borderBottomWidth: StyleSheet.hairlineWidth },
  menuIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  menuText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  zoomOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", justifyContent: "center", alignItems: "center" },
  zoomImage: { width: "95%", height: "80%" },
  zoomClose: { position: "absolute", top: 50, right: 20, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, padding: 8 },
});
