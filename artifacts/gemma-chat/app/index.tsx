import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatHeader } from "@/components/ChatHeader";
import { ChatInput } from "@/components/ChatInput";
import { EmptyChat } from "@/components/EmptyChat";
import { MessageBubble } from "@/components/MessageBubble";
import { useChat } from "@/context/ChatContext";
import { useModels } from "@/context/ModelContext";
import { useSettings } from "@/context/SettingsContext";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";
import type { Message } from "@/context/ChatContext";

const QUICK_REPLIES = [
  { label: "💡 Tell me more", prompt: "Tell me more about that." },
  { label: "📖 Give an example", prompt: "Can you give me a practical example?" },
  { label: "📝 Summarize", prompt: "Summarize that in 3 bullet points." },
  { label: "➡️ Continue", prompt: "Please continue." },
  { label: "✂️ Shorter", prompt: "Explain that more briefly." },
  { label: "🔍 Explain more", prompt: "Explain that in more detail." },
];

function QuickReplies({ onSelect, colors }: { onSelect: (p: string) => void; colors: any }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.chipsScroll}
      contentContainerStyle={styles.chipsContent}
      keyboardShouldPersistTaps="handled"
    >
      {QUICK_REPLIES.map((chip) => (
        <TouchableOpacity
          key={chip.label}
          style={[styles.chip, { backgroundColor: colors.secondary, borderColor: colors.border }]}
          onPress={() => onSelect(chip.prompt)}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, { color: colors.foreground }]}>{chip.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function formatMsgTime(ts: number | undefined): string {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (isToday) return timeStr;
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${timeStr}`;
}

function TimestampSeparator({ timestamp, colors }: { timestamp: number | undefined; colors: any }) {
  if (!timestamp) return null;
  return (
    <View style={styles.tsRow}>
      <View style={[styles.tsDivider, { backgroundColor: colors.border }]} />
      <Text style={[styles.tsText, { color: colors.mutedForeground }]}>
        {formatMsgTime(timestamp)}
      </Text>
      <View style={[styles.tsDivider, { backgroundColor: colors.border }]} />
    </View>
  );
}

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { toggleTheme, isDark } = useTheme();
  const {
    active,
    sendMessage,
    isGenerating,
    stopGeneration,
    setActiveId,
  } = useChat();
  const { activeModel } = useModels();
  const { settings } = useSettings();
  const listRef = useRef<FlatList>(null);
  const params = useLocalSearchParams<{ prompt?: string }>();
  const [prefill, setPrefill] = useState<string | null>(null);

  useEffect(() => {
    if (params.prompt) {
      setPrefill(params.prompt);
      router.setParams({ prompt: undefined });
    }
  }, [params.prompt]);

  const messages = useMemo(() => {
    if (!active) return [];
    return [...active.messages].reverse();
  }, [active]);

  const handleSend = useCallback(
    (text: string) => { void sendMessage(text, activeModel?.id ?? null); },
    [sendMessage, activeModel],
  );

  const handleNewChat = useCallback(() => { setActiveId(null); }, [setActiveId]);

  const lastMessageId = active?.messages[active.messages.length - 1]?.id;

  const showQuickReplies =
    !isGenerating &&
    !!active &&
    active.messages.length > 0 &&
    active.messages[active.messages.length - 1]?.role === "assistant";

  const shouldShowTimestamp = useCallback(
    (index: number, reversedMsgs: Message[]) => {
      const current = reversedMsgs[index];
      const older = reversedMsgs[index + 1];
      if (!older) return true;
      const currentTs = current?.createdAt ?? 0;
      const olderTs = older?.createdAt ?? 0;
      return currentTs - olderTs > 5 * 60 * 1000;
    },
    [],
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ChatHeader
        modelName={activeModel?.shortName ?? null}
        onOpenHistory={() => router.push("/history")}
        onOpenModels={() => router.push("/models")}
        onOpenSettings={() => router.push("/settings")}
        onNewChat={handleNewChat}
        onToggleTheme={toggleTheme}
        isDark={isDark}
      />

      <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={0}>
        {!active || active.messages.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyChat
              hasModel={!!activeModel}
              modelName={activeModel?.shortName ?? null}
              onPickPrompt={(p) => handleSend(p)}
            />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            inverted
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 12 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <View>
                <MessageBubble
                  message={item}
                  showCursor={isGenerating && item.id === lastMessageId && item.role === "assistant"}
                  fontSize={settings.fontSize}
                />
                {shouldShowTimestamp(index, messages) && (
                  <TimestampSeparator
                    timestamp={item.createdAt}
                    colors={colors}
                  />
                )}
              </View>
            )}
            scrollEnabled={messages.length > 0}
          />
        )}

        {showQuickReplies && (
          <QuickReplies
            colors={colors}
            onSelect={(prompt) => {
              setPrefill(null);
              handleSend(prompt);
            }}
          />
        )}

        <View style={{ paddingBottom: Platform.OS === "web" ? Math.max(insets.bottom, 12) : insets.bottom }}>
          <ChatInput
            onSend={(text, imageUri, imageMimeType) => { setPrefill(null); void sendMessage(text, activeModel?.id ?? null, imageUri, imageMimeType); }}
            onStop={stopGeneration}
            isGenerating={isGenerating}
            disabled={Platform.OS !== "web" && !activeModel}
            hapticsEnabled={settings.haptics}
            placeholder={
              Platform.OS === "web" && !activeModel
                ? "Try the chat UI — AI runs on Android/iOS device"
                : activeModel
                ? "Message Gemma…"
                : "Download a model first to start chatting"
            }
            prefillText={prefill}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  emptyWrap: { flex: 1 },
  chipsScroll: { maxHeight: 56, flexGrow: 0 },
  chipsContent: { paddingHorizontal: 14, paddingVertical: 8, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  tsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginVertical: 6,
    gap: 8,
  },
  tsDivider: { flex: 1, height: StyleSheet.hairlineWidth },
  tsText: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
