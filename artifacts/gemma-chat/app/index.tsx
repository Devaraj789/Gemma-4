import * as FileSystem from "expo-file-system/legacy";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatHeader } from "@/components/ChatHeader";
import { ChatInput } from "@/components/ChatInput";
import { EmptyChat } from "@/components/EmptyChat";
import { FavouritePromptsSheet } from "@/components/FavouritePromptsSheet";
import { PromptLibrarySheet } from "@/components/PromptLibrarySheet";
import { MessageBubble } from "@/components/MessageBubble";
import { QuickReplies } from "@/components/QuickReplies";
import { useChat } from "@/context/ChatContext";
import { useModels } from "@/context/ModelContext";
import { useSettings } from "@/context/SettingsContext";

import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { addFavourite } from "@/lib/favouritePrompts";

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
  } = useChat();
  const { activeModel } = useModels();
  const { settings, updateSettings } = useSettings();
  const listRef = useRef<FlatList>(null);
  const params = useLocalSearchParams<{ prompt?: string }>();
  const [prefill, setPrefill] = useState<string | null>(null);
  const [favSheetOpen, setFavSheetOpen] = useState(false);
  const [favSavedTick, setFavSavedTick] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  // Feature 6: Message search
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (params.prompt) {
      setPrefill(params.prompt);
      router.setParams({ prompt: undefined });
    }
  }, [params.prompt]);

  // Close search when conversation changes
  useEffect(() => {
    setSearchVisible(false);
    setSearchQuery("");
  }, [active?.id]);

  const messages = useMemo(() => {
    if (!active) return [];
    return [...active.messages].reverse();
  }, [active]);

  // Feature 6: Filtered messages for search
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter((m) => m.content.toLowerCase().includes(q));
  }, [messages, searchQuery]);

  const hasMessages = messages.length > 0;
  const lastMessageId = active?.messages[active.messages.length - 1]?.id;

  const handleSend = useCallback(
    (text: string, attachments?: import("@/context/ChatContext").Attachment[]) => {
      void sendMessage(text, activeModel?.id ?? null, attachments);
    },
    [sendMessage, activeModel],
  );

  const handleNewChat = useCallback(() => { setActiveId(null); }, [setActiveId]);

  const handleSaveFavourite = useCallback(async (text: string) => {
    await addFavourite(text);
    setFavSavedTick((p) => !p);
  }, []);

  // Feature 7: Delete individual message
  const handleDeleteMessage = useCallback((msgId: string) => {
    if (active) deleteMessage(active.id, msgId);
  }, [active, deleteMessage]);

  // Feature 5: Chat summary
  const handleSummarize = useCallback(() => {
    if (!hasMessages || isGenerating) return;
    handleSend("Please summarize this conversation in 3-5 concise bullet points, highlighting the main topics discussed.");
  }, [hasMessages, isGenerating, handleSend]);

  // Feature 9: Per-chat export
  const handleExportChat = useCallback(async () => {
    if (!active) return;
    try {
      const text = await exportConversation(active.id);
      if (Platform.OS === "web") {
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `${active.title}.txt`; a.click();
        return;
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

  // Feature 6: Toggle search
  const handleToggleSearch = useCallback(() => {
    setSearchVisible((p) => {
      if (p) setSearchQuery("");
      return !p;
    });
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ChatHeader
        modelName={activeModel?.shortName ?? null}
        onOpenHistory={() => router.push("/history")}
        onOpenModels={() => router.push("/models")}
        onOpenSettings={() => router.push("/settings")}
        onNewChat={handleNewChat}
        onOpenTools={() => setToolsOpen(true)}
        onToggleTheme={toggleTheme}
        isDark={isDark}
        onSearch={hasMessages ? handleToggleSearch : undefined}
        onExportChat={hasMessages ? () => void handleExportChat() : undefined}
        hasMessages={hasMessages}
        searchActive={searchVisible}
      />

      {/* Feature 6: Search bar */}
      {searchVisible && (
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={[styles.searchInner, { backgroundColor: colors.secondary }]}>
            <Feather name="search" size={15} color={colors.mutedForeground} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search messages…"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.searchInput, { color: colors.foreground }]}
              autoFocus
              returnKeyType="search"
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

      <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={0}>
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
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 12 }}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                showCursor={isGenerating && item.id === lastMessageId && item.role === "assistant"}
                fontSize={settings.fontSize}
                onDelete={(msg) => handleDeleteMessage(msg.id)}
                onRetry={(msg) => { if (msg.role === "user") handleSend(msg.content); }}
                convId={active?.id ?? ""}
                convTitle={active?.title ?? ""}
              />
            )}
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

        {/* Quick reply chips + Feature 5: Summarize button */}
        {hasMessages && !isGenerating && (
          <View style={[styles.bottomBar, { borderTopColor: colors.border }]}>
            <QuickReplies onSelect={(text) => { setPrefill(null); handleSend(text); }} />
            <View style={[styles.chatToolbar, { borderTopColor: colors.border }]}>
              {/* Feature 5: Summarize */}
              <Pressable
                onPress={handleSummarize}
                style={({ pressed }) => [styles.toolbarBtn, { backgroundColor: colors.secondary, opacity: pressed ? 0.75 : 1 }]}
              >
                <Feather name="list" size={13} color={colors.primary} />
                <Text style={[styles.toolbarBtnText, { color: colors.primary }]}>Summarize</Text>
              </Pressable>

              {/* Saved messages shortcut */}
              <Pressable
                onPress={() => router.push("/saved")}
                style={({ pressed }) => [styles.toolbarBtn, { backgroundColor: colors.secondary, opacity: pressed ? 0.75 : 1 }]}
              >
                <Feather name="bookmark" size={13} color={colors.mutedForeground} />
                <Text style={[styles.toolbarBtnText, { color: colors.mutedForeground }]}>Saved</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={{ paddingBottom: Platform.OS === "web" ? Math.max(insets.bottom, 12) : insets.bottom }}>
          <ChatInput
            onSend={(text) => { setPrefill(null); handleSend(text); }}
            onStop={stopGeneration}
            isGenerating={isGenerating}
            disabled={!activeModel}
            hapticsEnabled={settings.haptics}
            placeholder={activeModel ? "Message Gemma…" : "Download a model first to start chatting"}
            prefillText={prefill}
            onSaveFavourite={handleSaveFavourite}
            onOpenFavourites={() => setFavSheetOpen(true)}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Favourite Prompts Sheet */}
      <FavouritePromptsSheet
        visible={favSheetOpen}
        onClose={() => setFavSheetOpen(false)}
        onSelect={(text) => { setPrefill(text); }}
        onSaved={favSavedTick}
      />

      {/* Prompt / Tools Library Sheet */}
      <PromptLibrarySheet
        visible={toolsOpen}
        onClose={() => setToolsOpen(false)}
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
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", padding: 0 },
  searchCount: { fontSize: 12, fontFamily: "Inter_500Medium" },
  bottomBar: { borderTopWidth: StyleSheet.hairlineWidth },
  chatToolbar: { flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth },
  toolbarBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  toolbarBtnText: { fontSize: 12.5, fontFamily: "Inter_600SemiBold" },
  noResults: { alignItems: "center", justifyContent: "center", padding: 40, gap: 10 },
  noResultsText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
