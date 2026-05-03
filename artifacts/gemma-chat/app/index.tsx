import * as FileSystem from "expo-file-system/legacy";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
// FIXED: Removed react-native-keyboard-controller import
// Using React Native built-in KeyboardAvoidingView instead
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatHeader } from "@/components/ChatHeader";
import { ChatInput } from "@/components/ChatInput";
import { EmptyChat } from "@/components/EmptyChat";
import { FavouritePromptsSheet } from "@/components/FavouritePromptsSheet";
import { FollowUpChips } from "@/components/FollowUpChips";
import { MessageBubble } from "@/components/MessageBubble";
import { PinnedMessagesSheet } from "@/components/PinnedMessagesSheet";
import { PromptLibrarySheet } from "@/components/PromptLibrarySheet";
import { QuickReplies } from "@/components/QuickReplies";
import { ReplyPreviewBar } from "@/components/ReplyPreviewBar";
import { TypingIndicator } from "@/components/TypingIndicator";
import { useChat } from "@/context/ChatContext";
import { useModels } from "@/context/ModelContext";
import { useSettings } from "@/context/SettingsContext";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { addFavourite } from "@/lib/favouritePrompts";
import { getThemeBg } from "@/constants/chatThemes";
import type { Attachment, Message, ReplyTo } from "@/context/ChatContext";

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
    exportConversation,
    deleteMessage,
    toggleReaction,
    pinMessage,
    unpinMessage,
  } = useChat();
  const { activeModel } = useModels();
  const { settings, updateSettings } = useSettings();
  const listRef = useRef<FlatList>(null);
  const params = useLocalSearchParams<{ prompt?: string }>();
  const [prefill, setPrefill] = useState<string | null>(null);
  const [favSheetOpen, setFavSheetOpen] = useState(false);
  const [favSavedTick, setFavSavedTick] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pinnedSheetOpen, setPinnedSheetOpen] = useState(false);

  // ── Reply state ──────────────────────────────────────────────────────────────
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);

  useEffect(() => {
    if (params.prompt) { setPrefill(params.prompt); router.setParams({ prompt: undefined }); }
  }, [params.prompt]);

  useEffect(() => { setSearchVisible(false); setSearchQuery(""); setReplyTo(null); }, [active?.id]);

  const messages = useMemo(() => {
    if (!active) return [];
    return [...active.messages].reverse();
  }, [active]);

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter((m) => m.content.toLowerCase().includes(q));
  }, [messages, searchQuery]);

  const pinnedMessages = useMemo(() => {
    if (!active) return [];
    return active.messages.filter((m) => m.pinned);
  }, [active]);

  const hasMessages = messages.length > 0;
  const lastMsg = active?.messages[active.messages.length - 1];
  const lastMessageId = lastMsg?.id;
  const showTypingDots = isGenerating && lastMsg?.role === "assistant" && lastMsg.content.length === 0;

  const lastAssistantContent = useMemo(() => {
    if (!active) return null;
    const found = [...active.messages].reverse().find((m) => m.role === "assistant" && m.content.length > 0);
    return found?.content ?? null;
  }, [active]);

  // Chat theme background
  const chatBg = getThemeBg(settings.chatTheme ?? "default", isDark);

  const handleSend = useCallback(
    (text: string, attachments?: Attachment[]) => {
      void sendMessage(text, activeModel?.id ?? null, attachments, replyTo ?? undefined);
      setReplyTo(null);
    },
    [sendMessage, activeModel, replyTo],
  );

  const handleReply = useCallback((msg: Message) => {
    setReplyTo({ id: msg.id, role: msg.role as "user" | "assistant", content: msg.content });
  }, []);

  const handleReact = useCallback((msgId: string, emoji: string) => {
    if (active) toggleReaction(active.id, msgId, emoji);
  }, [active, toggleReaction]);

  const handlePin = useCallback((msgId: string) => {
    if (active) pinMessage(active.id, msgId);
  }, [active, pinMessage]);

  const handleUnpin = useCallback((msgId: string) => {
    if (active) unpinMessage(active.id, msgId);
  }, [active, unpinMessage]);

  const handleScrollToMessage = useCallback((msgId: string) => {
    const idx = messages.findIndex((m) => m.id === msgId);
    if (idx >= 0) listRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
  }, [messages]);

  const handleNewChat = useCallback(() => { setActiveId(null); }, [setActiveId]);

  const handleSaveFavourite = useCallback(async (text: string) => {
    await addFavourite(text);
    setFavSavedTick((p) => !p);
  }, []);

  const handleDeleteMessage = useCallback((msgId: string) => {
    if (active) deleteMessage(active.id, msgId);
  }, [active, deleteMessage]);

  const handleSummarize = useCallback(() => {
    if (!hasMessages || isGenerating) return;
    handleSend("Please summarize this conversation in 3-5 concise bullet points.");
  }, [hasMessages, isGenerating, handleSend]);

  const handleContinue = useCallback(() => {
    if (!hasMessages || isGenerating) return;
    handleSend("Please continue from where you left off.");
  }, [hasMessages, isGenerating, handleSend]);

  const handleExportChat = useCallback(async () => {
    if (!active) return;
    try {
      const text = await exportConversation(active.id);
      if (Platform.OS === "web") {
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `${active.title}.txt`; a.click(); return;
      }
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) { Alert.alert("Sharing not available"); return; }
      const path = (FileSystem.documentDirectory ?? "") + `chat-${active.id}.txt`;
      await FileSystem.writeAsStringAsync(path, text);
      await Sharing.shareAsync(path, { mimeType: "text/plain", dialogTitle: `Export: ${active.title}` });
    } catch (e) {
      Alert.alert("Export failed", e instanceof Error ? e.message : "Unknown error");
    }
  }, [active, exportConversation]);

  const handleToggleSearch = useCallback(() => {
    setSearchVisible((p) => { if (p) setSearchQuery(""); return !p; });
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ChatHeader
        onNewChat={handleNewChat}
        onToggleTheme={toggleTheme}
        isDark={isDark}
        onToggleSearch={handleToggleSearch}
        searchActive={searchVisible}
        onExport={handleExportChat}
        hasMessages={hasMessages}
        onOpenTools={() => setToolsOpen(true)}
        toolsOpen={toolsOpen}
      />

      {searchVisible && (
        <View style={[styles.searchBar, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
          <View style={[styles.searchInner, { backgroundColor: colors.secondary }]}>
            <Feather name="search" size={15} color={colors.mutedForeground} />
            <TextInput
              value={searchQuery} onChangeText={setSearchQuery}
              placeholder="Search messages…" placeholderTextColor={colors.mutedForeground}
              style={[styles.searchInput, { color: colors.foreground }]}
              autoFocus returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                <Feather name="x" size={15} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
          {searchQuery.trim().length > 0 && (
            <Text style={[styles.searchCount, { color: colors.mutedForeground }]}>
              {filteredMessages.length} result{filteredMessages.length !== 1 ? "s" : ""}
            </Text>
          )}
        </View>
      )}

      {/* Pinned messages banner */}
      {pinnedMessages.length > 0 && !searchVisible && (
        <Pressable
          onPress={() => setPinnedSheetOpen(true)}
          style={[styles.pinnedBanner, { backgroundColor: colors.accent, borderBottomColor: colors.border }]}
        >
          <Feather name="bookmark" size={13} color={colors.primary} />
          <Text style={[styles.pinnedBannerText, { color: colors.primary }]}>
            {pinnedMessages.length} pinned {pinnedMessages.length === 1 ? "message" : "messages"}
          </Text>
          <Feather name="chevron-right" size={13} color={colors.primary} />
        </Pressable>
      )}

      {/* FIXED: Using React Native built-in KeyboardAvoidingView
          behavior="padding" → Android best practice
          behavior="padding" on iOS too — works correctly without keyboard-controller */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {!active || active.messages.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyChat
              hasModel={!!activeModel}
              modelName={activeModel?.shortName ?? null}
              onPickPrompt={(p) => handleSend(p)}
              onSetPersona={(prompt) => updateSettings({ systemPrompt: prompt })}
            />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={filteredMessages}
            keyExtractor={(m) => m.id}
            inverted
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            style={chatBg ? { backgroundColor: chatBg } : undefined}
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 12 }}
            onScrollToIndexFailed={() => {}}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                showCursor={isGenerating && item.id === lastMessageId && item.role === "assistant" && item.content.length > 0}
                fontSize={settings.fontSize}
                onDelete={(msg) => handleDeleteMessage(msg.id)}
                onRetry={(msg) => { if (msg.role === "user") handleSend(msg.content, msg.attachments); }}
                onReply={handleReply}
                onReact={handleReact}
                onPin={handlePin}
                onUnpin={handleUnpin}
                convId={active?.id ?? ""}
                convTitle={active?.title ?? ""}
                searchHighlight={searchQuery.trim() || undefined}
              />
            )}
            ListHeaderComponent={showTypingDots ? <TypingIndicator /> : null}
            scrollEnabled={messages.length > 0}
            ListEmptyComponent={
              searchQuery.trim().length > 0 ? (
                <View style={styles.noResults}>
                  <Feather name="search" size={28} color={colors.mutedForeground} />
                  <Text style={[styles.noResultsText, { color: colors.mutedForeground }]}>No messages found</Text>
                </View>
              ) : null
            }
          />
        )}

        {/* Quick replies + toolbar */}
        {hasMessages && !isGenerating && (
          <View style={[styles.bottomBar, { borderTopColor: colors.border }]}>
            <FollowUpChips
              lastAssistantMessage={lastAssistantContent}
              onSelect={(t) => { setPrefill(null); handleSend(t); }}
              visible={!searchVisible}
            />
            <QuickReplies onSelect={(text) => { setPrefill(null); handleSend(text); }} />
            <View style={[styles.chatToolbar, { borderTopColor: colors.border }]}>
              <Pressable onPress={handleSummarize} style={({ pressed }) => [styles.toolbarBtn, { backgroundColor: colors.secondary, opacity: pressed ? 0.75 : 1 }]}>
                <Feather name="list" size={13} color={colors.primary} />
                <Text style={[styles.toolbarBtnText, { color: colors.primary }]}>Summarize</Text>
              </Pressable>
              <Pressable onPress={handleContinue} style={({ pressed }) => [styles.toolbarBtn, { backgroundColor: colors.secondary, opacity: pressed ? 0.75 : 1 }]}>
                <Feather name="arrow-right" size={13} color={colors.primary} />
                <Text style={[styles.toolbarBtnText, { color: colors.primary }]}>Continue</Text>
              </Pressable>
              {pinnedMessages.length > 0 && (
                <Pressable onPress={() => setPinnedSheetOpen(true)} style={({ pressed }) => [styles.toolbarBtn, { backgroundColor: colors.accent, opacity: pressed ? 0.75 : 1 }]}>
                  <Feather name="bookmark" size={13} color={colors.primary} />
                  <Text style={[styles.toolbarBtnText, { color: colors.primary }]}>Pinned ({pinnedMessages.length})</Text>
                </Pressable>
              )}
              <Pressable onPress={() => router.push("/saved")} style={({ pressed }) => [styles.toolbarBtn, { backgroundColor: colors.secondary, opacity: pressed ? 0.75 : 1 }]}>
                <Feather name="bookmark" size={13} color={colors.mutedForeground} />
                <Text style={[styles.toolbarBtnText, { color: colors.mutedForeground }]}>Saved</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Reply preview bar */}
        {replyTo && (
          <ReplyPreviewBar replyTo={replyTo} onCancel={() => setReplyTo(null)} />
        )}

        <View style={{ paddingBottom: Platform.OS === "web" ? Math.max(insets.bottom, 12) : insets.bottom }}>
          <ChatInput
            onSend={(text, attachments) => { setPrefill(null); handleSend(text, attachments); }}
            onStop={stopGeneration}
            isGenerating={isGenerating}
            disabled={!activeModel}
            hapticsEnabled={settings.haptics}
            placeholder={activeModel ? (replyTo ? "Reply to message…" : "Message Gemma…") : "Download a model first"}
            prefillText={prefill}
            onSaveFavourite={handleSaveFavourite}
            onOpenFavourites={() => setFavSheetOpen(true)}
            convId={active?.id}
          />
        </View>
      </KeyboardAvoidingView>

      <FavouritePromptsSheet
        visible={favSheetOpen}
        onClose={() => setFavSheetOpen(false)}
        onSelect={(text) => { setPrefill(text); }}
        onSaved={favSavedTick}
      />
      <PromptLibrarySheet visible={toolsOpen} onClose={() => setToolsOpen(false)} />

      {/* Pinned messages sheet */}
      <PinnedMessagesSheet
        visible={pinnedSheetOpen}
        onClose={() => setPinnedSheetOpen(false)}
        pinnedMessages={pinnedMessages}
        onUnpin={(msgId) => handleUnpin(msgId)}
        onScrollTo={handleScrollToMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  emptyWrap: { flex: 1 },
  searchBar: { borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 8 },
  searchInner: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  searchCount: { fontSize: 12 },
  pinnedBanner: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  pinnedBannerText: { flex: 1, fontSize: 13 },
  bottomBar: { borderTopWidth: StyleSheet.hairlineWidth },
  chatToolbar: { flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth, flexWrap: "wrap" },
  toolbarBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  toolbarBtnText: { fontSize: 12.5 },
  noResults: { alignItems: "center", justifyContent: "center", padding: 40, gap: 10 },
  noResultsText: { fontSize: 14 },
});code artifacts/gemma-chat/app.json