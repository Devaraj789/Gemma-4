import React, { useCallback, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useChat } from "@/context/ChatContext";
import { useModels } from "@/context/ModelContext";
import { useTheme } from "@/context/ThemeContext";

export default function ChatScreen() {
  const {
    active,
    sendMessage,
    stopGeneration,
    isGenerating,
    newConversation,
  } = useChat();
  const { activeModel } = useModels();
  const { colors, isDark, toggleTheme } = useTheme();
  const [input, setInput] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const messages = active?.messages ?? [];

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isGenerating) return;
    setInput("");
    await sendMessage(text, activeModel?.id ?? null);
  }, [input, isGenerating, sendMessage, activeModel]);

  const handleStop = useCallback(() => {
    stopGeneration();
  }, [stopGeneration]);

  const styles = makeStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => newConversation()}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {activeModel ? `● ${activeModel.name}` : "No Model"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleTheme} style={styles.themeBtn}>
          <Text style={styles.themeBtnText}>{isDark ? "☀️" : "🌙"}</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.role === "user"
                ? styles.bubbleUser
                : styles.bubbleAssistant,
              {
                backgroundColor:
                  item.role === "user"
                    ? colors.bubble.user
                    : colors.bubble.assistant,
              },
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                {
                  color:
                    item.role === "user"
                      ? colors.bubble.userText
                      : colors.bubble.assistantText,
                },
              ]}
            >
              {item.content}
            </Text>
          </View>
        )}
        contentContainerStyle={styles.messageList}
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground,
                color: colors.text,
              },
            ]}
            value={input}
            onChangeText={setInput}
            placeholder="Message Gemma..."
            placeholderTextColor={colors.textSecondary}
            multiline
            editable={!isGenerating}
          />
          {isGenerating ? (
            <TouchableOpacity style={styles.stopBtn} onPress={handleStop}>
              <Text style={styles.stopBtnText}>⏹</Text>
            </TouchableOpacity>
          ) : (
            <Pressable
              style={[
                styles.sendBtn,
                {
                  backgroundColor: input.trim()
                    ? colors.primary
                    : colors.border,
                },
              ]}
              onPress={handleSend}
              disabled={!input.trim()}
            >
              <Text style={styles.sendBtnText}>↑</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 48,
      paddingBottom: 12,
    },
    headerTitle: { fontSize: 16, fontWeight: "600" },
    themeBtn: { padding: 8 },
    themeBtnText: { fontSize: 20 },
    messageList: { padding: 16, gap: 12 },
    bubble: {
      maxWidth: "85%",
      borderRadius: 16,
      padding: 12,
    },
    bubbleUser: { alignSelf: "flex-end" },
    bubbleAssistant: { alignSelf: "flex-start" },
    bubbleText: { fontSize: 15, lineHeight: 22 },
    inputRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      padding: 12,
      borderTopWidth: 1,
      gap: 8,
    },
    input: {
      flex: 1,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 15,
      maxHeight: 120,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    sendBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
    stopBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#FF4444",
      alignItems: "center",
      justifyContent: "center",
    },
    stopBtnText: { fontSize: 16 },
  });
}