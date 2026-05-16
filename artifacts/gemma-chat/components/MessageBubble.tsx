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
  Share,
  ScrollView,
  Image, // ✅ NEW: vision image display
} from "react-native";
import { WebView } from "react-native-webview";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
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

type Token = { text: string; color: string };
const SC = {
  keyword:  "#c792ea",
  string:   "#c3e88d",
  comment:  "#546e7a",
  number:   "#f78c6c",
  function: "#82aaff",
  tag:      "#f07178",
  operator: "#89ddff",
  plain:    "#cdd3de",
};
function getMimeType(lang: string): string {
  const map: Record<string, string> = {
    html: "text/html", htm: "text/html",
    css: "text/css",
    js: "text/javascript", javascript: "text/javascript",
    ts: "text/typescript", typescript: "text/typescript",
    json: "application/json",
    py: "text/x-python", python: "text/x-python",
    md: "text/markdown", markdown: "text/markdown",
    xml: "text/xml",
    sh: "text/x-sh",
    csv: "text/csv",
  };
  return map[lang.toLowerCase()] ?? "text/plain";
}
function getLangExtension(lang: string): string {
  const map: Record<string, string> = {
    html: ".html", htm: ".html", css: ".css",
    js: ".js", javascript: ".js", ts: ".ts", typescript: ".ts",
    json: ".json", csv: ".csv", py: ".py", python: ".py",
    md: ".md", markdown: ".md", xml: ".xml", sh: ".sh",
    java: ".java", kotlin: ".kt", swift: ".swift", c: ".c",
    cpp: ".cpp", cs: ".cs", go: ".go", rust: ".rs", rb: ".rb",
  };
  return map[(lang ?? "").toLowerCase()] ?? ".txt";
}

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let rem = line;
  const P: [RegExp, string][] = [
    [/^(\/\/.*|#.*)/, SC.comment],
    [/^("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/, SC.string],
    [/^(const|let|var|function|return|if|else|for|while|class|import|export|from|default|new|this|typeof|async|await|try|catch|throw|null|undefined|true|false|void|type|interface|extends|implements|static|public|private|protected|readonly|enum|of|in|switch|case|break|continue)\b/, SC.keyword],
    [/^(<\/?[a-zA-Z][a-zA-Z0-9]*|\/?>)/, SC.tag],
    [/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/, SC.function],
    [/^[a-zA-Z_$][a-zA-Z0-9_$]*/, SC.plain],
    [/^(\d+\.?\d*)/, SC.number],
    [/^(===|!==|==|!=|<=|>=|=>|&&|\|\||[+\-*/%=<>!&|^~?:])/, SC.operator],
    [/^[^\s\w"'`#/]+/, SC.plain],
    [/^\s+/, SC.plain],
  ];
  while (rem.length > 0) {
    let matched = false;
    for (const [rx, color] of P) {
      const m = rem.match(rx);
      if (m) { tokens.push({ text: m[0], color }); rem = rem.slice(m[0].length); matched = true; break; }
    }
    if (!matched) { tokens.push({ text: rem[0], color: SC.plain }); rem = rem.slice(1); }
  }
  return tokens;
}

function CodeBlock({ code, language, colors }: { code: string; language?: string; colors: any }) {
  const [copied, setCopied] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const ext = getLangExtension(language ?? "");
      const filename = `code_${Date.now()}${ext}`;
      const path = (FileSystem as any).cacheDirectory + filename;
      await FileSystem.writeAsStringAsync(path, code, { encoding: "utf8" as any });
    const canShare = await Sharing.isAvailableAsync();
if (canShare) {
  await Sharing.shareAsync(path, {
    mimeType: getMimeType(language ?? ""),
    dialogTitle: `Save ${filename}`,
    UTI: "public.plain-text",
  });
} else if (Platform.OS === "android") {
  ToastAndroid.show("Sharing not available", ToastAndroid.SHORT);
}
    } catch (e) {
      if (Platform.OS === "android") ToastAndroid.show("Download failed", ToastAndroid.SHORT);
    } finally {
      setDownloading(false);
    }
  };

  const isPreviewable = ["html", "htm", "svg", ""].includes((language ?? "").toLowerCase()) && code.trim().startsWith("<");
  const lines = code.split("\n");

  const handleCopyCode = () => {
    Clipboard.setString(code);
    setCopied(true);
    if (Platform.OS === "android") ToastAndroid.show("Code copied!", ToastAndroid.SHORT);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={cs.wrapper}>
      <View style={[cs.header, { backgroundColor: "#1a1f2e" }]}>
        <Text style={cs.langLabel}>{language || "code"}</Text>
        <View style={cs.headerBtns}>
          {isPreviewable && (
            <TouchableOpacity style={[cs.headerBtn, { backgroundColor: "#2d3550" }]} onPress={() => setPreviewVisible(true)} activeOpacity={0.7}>
              <Feather name="eye" size={12} color="#82aaff" />
              <Text style={[cs.headerBtnText, { color: "#82aaff" }]}>Preview</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[cs.headerBtn, { backgroundColor: copied ? "#1e3a2f" : "#2d3550" }]} onPress={handleCopyCode} activeOpacity={0.7}>
            <Feather name={copied ? "check" : "copy"} size={12} color={copied ? "#c3e88d" : "#cdd3de"} />
            <Text style={[cs.headerBtnText, { color: copied ? "#c3e88d" : "#cdd3de" }]}>{copied ? "Copied!" : "Copy"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[cs.headerBtn, { backgroundColor: downloading ? "#1e3a2f" : "#2d3550" }]} onPress={handleDownload} activeOpacity={0.7} disabled={downloading}>
            <Feather name="download" size={12} color={downloading ? "#c3e88d" : "#cdd3de"} />
            <Text style={[cs.headerBtnText, { color: downloading ? "#c3e88d" : "#cdd3de" }]}>{downloading ? "Saving..." : "Download"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ✅ FIX 1: Vertical ScrollView நீக்கினோம் - horizontal மட்டும் போதும் */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        style={{ backgroundColor: "#0f1117" }}
      >
        <View style={cs.codeInner}>
          {lines.map((line, i) => (
            <View key={i} style={cs.lineRow}>
              <Text style={cs.lineNum}>{i + 1}</Text>
              <Text style={cs.lineText}>
                {tokenizeLine(line).map((tok, j) => (
                  <Text key={j} style={{ color: tok.color }}>{tok.text}</Text>
                ))}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={previewVisible} animationType="slide" onRequestClose={() => setPreviewVisible(false)} statusBarTranslucent>
        <View style={[cs.previewModal, { backgroundColor: "#0f1117" }]}>
          <View style={[cs.previewHeader, { backgroundColor: "#1a1f2e", borderBottomColor: "#2d3550" }]}>
            <Text style={cs.previewTitle}>Preview</Text>
            <TouchableOpacity onPress={() => setPreviewVisible(false)} activeOpacity={0.7}>
              <Feather name="x" size={22} color="#cdd3de" />
            </TouchableOpacity>
          </View>
          <WebView source={{ html: code }} style={{ flex: 1 }} originWhitelist={["*"]} />
        </View>
      </Modal>
    </View>
  );
}

const cs = StyleSheet.create({
  wrapper: { borderRadius: 10, overflow: "hidden", marginVertical: 8 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 8 },
  langLabel: { fontSize: 11, color: "#546e7a", fontFamily: "monospace" },
  headerBtns: { flexDirection: "row", gap: 6 },
  headerBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  headerBtnText: { fontSize: 11, fontFamily: "monospace" },
  // ✅ scrollV நீக்கினோம் - maxHeight இனி கிடையாது, full code show ஆகும்
  codeInner: { padding: 12, paddingRight: 20 },
  lineRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 1 },
  lineNum: { width: 32, fontSize: 12, color: "#3b4a5a", fontFamily: "monospace", textAlign: "right", marginRight: 14, lineHeight: 20 },
  lineText: { fontSize: 13, fontFamily: "monospace", lineHeight: 20 },
  previewModal: { flex: 1 },
  previewHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingTop: 52, paddingBottom: 14, borderBottomWidth: 1 },
  previewTitle: { fontSize: 17, color: "#cdd3de", fontFamily: "monospace" },
});

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
  const handleShare = async () => {
    setMenuVisible(false);
    try { await Share.share({ message: message.content }); } catch (_) {}
  };
  const handleEdit = () => { setMenuVisible(false); onEdit?.(message); };
  const handleRetry = () => { setMenuVisible(false); onRetry?.(message); };

  const stats = message.stats;
  const showStats = !isUser && !showCursor && message.content.length > 0 && stats && (stats.tokensPerSec > 0 || (stats.loadTimeMs ?? 0) > 0);

  const markdownRules = {
    fence: (node: any) => <CodeBlock key={node.key} code={(node.content ?? "").trimEnd()} language={node.info ?? ""} colors={colors} />,
    code_block: (node: any) => <CodeBlock key={node.key} code={(node.content ?? "").trimEnd()} colors={colors} />,
  };

  const mdStyles = {
    body: { color: textColor, fontSize: fs, lineHeight: lh, fontFamily: "Inter_400Regular" },
    strong: { fontFamily: "Inter_700Bold", color: textColor },
    em: { fontStyle: "italic" as const, color: textColor },
    code_inline: { backgroundColor: isUser ? "rgba(255,255,255,0.2)" : "#1a1f2e", color: "#c3e88d", fontFamily: "monospace", fontSize: fs - 1, paddingHorizontal: 5, borderRadius: 4 },
    fence: {},
    code_block: {},
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

      {/* ✅ FIX 2: User bubble alignment - paddingHorizontal சரிபண்ணினோம் */}
      <Pressable
        onPress={isUser ? () => setMenuVisible(true) : undefined}
        onLongPress={() => { if (isUser) setMenuVisible(true); }}
        delayLongPress={300}
        style={[
          styles.row,
          { justifyContent: isUser ? "flex-end" : "flex-start" }
        ]}
      >
        <View style={[
          styles.bubble,
          {
            backgroundColor: bubbleColor,
            borderTopRightRadius: isUser ? 4 : 20,
            borderTopLeftRadius: isUser ? 20 : 4,
            // ✅ User bubble: right side visible ஆக marginRight add
            marginRight: isUser ? 0 : undefined,
          }
        ]}>
          {/* ✅ NEW: User image preview — imageUri இருந்தா show பண்ணு */}
          {isUser && message.imageUri ? (
            <Image
              source={{ uri: message.imageUri }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          ) : null}

          {!isUser && message.content.length > 0 ? (
            <Markdown style={mdStyles as any} rules={markdownRules}>
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

      {showStats && (
        <View style={styles.statsRow}>
          {(stats.loadTimeMs ?? 0) > 0 && (
            <View style={[styles.statPill, { backgroundColor: colors.secondary }]}>
              <Feather name="clock" size={10} color={colors.mutedForeground} />
              <Text style={[styles.statText, { color: colors.mutedForeground }]}>{formatLoadTime(stats.loadTimeMs!)}</Text>
            </View>
          )}
          {stats.tokensPerSec > 0 && (
            <View style={[styles.statPill, { backgroundColor: colors.secondary }]}>
              <Feather name="zap" size={10} color={colors.mutedForeground} />
              <Text style={[styles.statText, { color: colors.mutedForeground }]}>{stats.tokensPerSec.toFixed(1)} tok/s</Text>
            </View>
          )}
          {stats.totalTokens > 0 && (
            <View style={[styles.statPill, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.statText, { color: colors.mutedForeground }]}>{stats.totalTokens} tokens</Text>
            </View>
          )}
        </View>
      )}

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
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.secondary }]} onPress={handleShare} activeOpacity={0.7}>
            <Feather name="share-2" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      )}

      {isUser && !showCursor && message.content.length > 0 && (
        // ✅ FIX 3: Action bar user side - flex-end + paddingHorizontal match
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
  // ✅ FIX 2: paddingHorizontal 16 → 12 (bubble screen edge-ல hide ஆகாம இருக்கும்)
  row: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 4 },
  // ✅ FIX 2: maxWidth 95% → 85% (user bubble right side clip ஆகாம)
  bubble: { maxWidth: "85%", paddingHorizontal: 14, paddingVertical: 12, borderRadius: 20 },
  text: { fontFamily: "Inter_400Regular" },
  statsRow: { flexDirection: "row", paddingHorizontal: 16, paddingTop: 2, paddingBottom: 2, gap: 6 },
  statPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statText: { fontSize: 10.5, fontFamily: "Inter_500Medium" },
  // ✅ FIX 3: actionBar paddingHorizontal 20 → 12 (bubble align match)
  actionBar: { flexDirection: "row", paddingHorizontal: 12, paddingBottom: 6, gap: 6 },
  actionBtn: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" },
  menu: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, minWidth: 200, overflow: "hidden", elevation: 12, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  menuItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  menuItemBorder: { borderBottomWidth: StyleSheet.hairlineWidth },
  menuIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  menuText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  // ✅ NEW: vision image in user bubble
  messageImage: {
    width: 220,
    height: 220,
    borderRadius: 12,
    marginBottom: 6,
  },
});