import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
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
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                showCursor={isGenerating && item.id === lastMessageId && item.role === "assistant"}
                fontSize={settings.fontSize}
              />
            )}
            scrollEnabled={messages.length > 0}
          />
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
});
