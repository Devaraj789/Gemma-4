import { Feather } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
import {
  Clipboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

type Token = { text: string; color: string };

const LANG_ALIASES: Record<string, string> = {
  js: "JavaScript", javascript: "JavaScript", ts: "TypeScript", typescript: "TypeScript",
  tsx: "TypeScript", jsx: "JavaScript", py: "Python", python: "Python",
  html: "HTML", css: "CSS", scss: "SCSS", json: "JSON", bash: "Bash",
  sh: "Shell", sql: "SQL", java: "Java", kotlin: "Kotlin", swift: "Swift",
  go: "Go", rust: "Rust", cpp: "C++", c: "C", cs: "C#", rb: "Ruby",
  php: "PHP", md: "Markdown", yaml: "YAML", xml: "XML", dart: "Dart",
};

const KEYWORDS: Record<string, string[]> = {
  js: ["const","let","var","function","return","if","else","for","while","class","import","export","default","from","async","await","new","this","typeof","instanceof","try","catch","finally","throw","null","undefined","true","false","of","in","switch","case","break","continue","do","extends","super","static"],
  py: ["def","class","return","if","elif","else","for","while","import","from","as","with","try","except","finally","raise","pass","break","continue","True","False","None","and","or","not","in","is","lambda","yield","global","nonlocal","async","await"],
  java: ["public","private","protected","class","interface","extends","implements","void","return","if","else","for","while","new","this","super","static","final","abstract","try","catch","finally","throw","throws","import","package","null","true","false"],
  html: [],
  css: [],
  json: [],
  bash: ["if","then","else","fi","for","while","do","done","case","esac","function","return","exit","echo","source","export","local","readonly","shift","set","unset","trap"],
};

const TYPES_COLORS = "#79c0ff";
const KEYWORD_COLOR = "#ff7b72";
const STRING_COLOR = "#a5d6ff";
const COMMENT_COLOR = "#8b949e";
const NUMBER_COLOR = "#f2cc60";
const FUNCTION_COLOR = "#d2a8ff";
const OPERATOR_COLOR = "#ff7b72";

function tokenize(code: string, lang: string): Token[] {
  const normalized = lang.toLowerCase().replace(/[^a-z]/, "");
  const keywords = KEYWORDS[normalized] || KEYWORDS.js;
  const tokens: Token[] = [];
  let i = 0;

  while (i < code.length) {
    // Line comment //
    if (code[i] === "/" && code[i + 1] === "/") {
      const end = code.indexOf("\n", i);
      const t = end === -1 ? code.slice(i) : code.slice(i, end);
      tokens.push({ text: t, color: COMMENT_COLOR });
      i += t.length;
      continue;
    }
    // Block comment /* */
    if (code[i] === "/" && code[i + 1] === "*") {
      const end = code.indexOf("*/", i + 2);
      const t = end === -1 ? code.slice(i) : code.slice(i, end + 2);
      tokens.push({ text: t, color: COMMENT_COLOR });
      i += t.length;
      continue;
    }
    // Python # comment
    if ((normalized === "py" || normalized === "bash") && code[i] === "#") {
      const end = code.indexOf("\n", i);
      const t = end === -1 ? code.slice(i) : code.slice(i, end);
      tokens.push({ text: t, color: COMMENT_COLOR });
      i += t.length;
      continue;
    }
    // String double quote
    if (code[i] === '"') {
      let j = i + 1;
      while (j < code.length && (code[j] !== '"' || code[j - 1] === "\\")) j++;
      const t = code.slice(i, j + 1);
      tokens.push({ text: t, color: STRING_COLOR });
      i = j + 1;
      continue;
    }
    // String single quote
    if (code[i] === "'") {
      let j = i + 1;
      while (j < code.length && (code[j] !== "'" || code[j - 1] === "\\")) j++;
      const t = code.slice(i, j + 1);
      tokens.push({ text: t, color: STRING_COLOR });
      i = j + 1;
      continue;
    }
    // Template literal
    if (code[i] === "`") {
      let j = i + 1;
      while (j < code.length && (code[j] !== "`" || code[j - 1] === "\\")) j++;
      const t = code.slice(i, j + 1);
      tokens.push({ text: t, color: STRING_COLOR });
      i = j + 1;
      continue;
    }
    // Number
    if (/[0-9]/.test(code[i]) && (i === 0 || /[^a-zA-Z_$]/.test(code[i - 1]))) {
      let j = i;
      while (j < code.length && /[0-9._xX]/.test(code[j])) j++;
      tokens.push({ text: code.slice(i, j), color: NUMBER_COLOR });
      i = j;
      continue;
    }
    // Word
    if (/[a-zA-Z_$]/.test(code[i])) {
      let j = i;
      while (j < code.length && /[a-zA-Z0-9_$]/.test(code[j])) j++;
      const word = code.slice(i, j);
      let color = "#e6edf3"; // default text
      if (keywords.includes(word)) {
        color = KEYWORD_COLOR;
      } else if (/^[A-Z]/.test(word)) {
        color = TYPES_COLORS;
      } else if (j < code.length && code[j] === "(") {
        color = FUNCTION_COLOR;
      }
      tokens.push({ text: word, color });
      i = j;
      continue;
    }
    // Operators
    if (/[=+\-*/<>!&|^~%?:]/.test(code[i])) {
      tokens.push({ text: code[i], color: OPERATOR_COLOR });
      i++;
      continue;
    }
    // Everything else
    tokens.push({ text: code[i], color: "#e6edf3" });
    i++;
  }
  return tokens;
}

type Props = {
  code: string;
  language?: string;
};

export function CodeBlock({ code, language = "" }: Props) {
  const colors = useColors();
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const langKey = language.toLowerCase().trim();
  const langLabel = LANG_ALIASES[langKey] ?? (language || "Code");
  const tokens = tokenize(code.trimEnd(), langKey);

  const handleCopy = () => {
    Clipboard.setString(code);
    if (Platform.OS === "android") ToastAndroid.show("Code copied!", ToastAndroid.SHORT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (Platform.OS === "web") {
      const blob = new Blob([code], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `code.${langKey || "txt"}`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    const ext = langKey || "txt";
    const uri = `${FileSystem.cacheDirectory}code_${Date.now()}.${ext}`;
    await FileSystem.writeAsStringAsync(uri, code);
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) await Sharing.shareAsync(uri);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
    if (Platform.OS === "android") ToastAndroid.show("File ready to save!", ToastAndroid.SHORT);
  };

  return (
    <View style={[styles.container, { backgroundColor: "#0d1117", borderColor: "#30363d" }]}>
      {/* Header bar */}
      <View style={styles.header}>
        <View style={styles.langChip}>
          <Text style={styles.langText}>{langLabel}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => void handleDownload()}
            hitSlop={8}
            style={({ pressed }) => [styles.headerBtn, { backgroundColor: pressed ? "#21262d" : "transparent" }]}
          >
            <Feather name={downloaded ? "check" : "download"} size={13} color={downloaded ? "#3fb950" : "#8b949e"} />
          </Pressable>
          <Pressable
            onPress={handleCopy}
            hitSlop={8}
            style={({ pressed }) => [styles.headerBtn, { backgroundColor: pressed ? "#21262d" : "transparent" }]}
          >
            <Feather name={copied ? "check" : "copy"} size={13} color={copied ? "#3fb950" : "#8b949e"} />
            <Text style={[styles.copyText, { color: copied ? "#3fb950" : "#8b949e" }]}>
              {copied ? "Copied!" : "Copy"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Code area */}
      <ScrollView horizontal showsHorizontalScrollIndicator style={styles.scrollH}>
        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={styles.scrollV}>
          <View style={styles.codeBody}>
            {code.trimEnd().split("\n").map((line, lineIdx) => (
              <View key={lineIdx} style={styles.codeLine}>
                <Text style={styles.lineNum}>{lineIdx + 1}</Text>
                <Text style={styles.codeText}>
                  {tokenize(line, langKey).map((tok, i) => (
                    <Text key={i} style={{ color: tok.color }}>
                      {tok.text}
                    </Text>
                  ))}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 6,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#161b22",
    borderBottomWidth: 1,
    borderBottomColor: "#30363d",
  },
  langChip: {
    backgroundColor: "#21262d",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  langText: { color: "#8b949e", fontSize: 11.5, fontFamily: "monospace" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  copyText: { fontSize: 11.5, fontFamily: "monospace" },
  scrollH: { maxHeight: 320 },
  scrollV: {},
  codeBody: { paddingHorizontal: 8, paddingVertical: 10 },
  codeLine: {
    flexDirection: "row",
    gap: 12,
    minHeight: 18,
  },
  lineNum: {
    color: "#484f58",
    fontSize: 12,
    fontFamily: "monospace",
    minWidth: 24,
    textAlign: "right",
    lineHeight: 18,
  },
  codeText: {
    fontSize: 12.5,
    fontFamily: "monospace",
    lineHeight: 18,
    flexShrink: 1,
  },
});
