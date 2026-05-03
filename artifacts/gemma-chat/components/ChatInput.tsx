import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Text,
  Alert,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import type { Attachment } from "@/context/ChatContext";

const MAX_CHARS = 4000;

type Props = {
  onSend: (text: string, attachments?: Attachment[]) => void;
  onStop: () => void;
  isGenerating: boolean;
  disabled?: boolean;
  placeholder?: string;
  hapticsEnabled?: boolean;
  prefillText?: string | null;
  onSaveFavourite?: (text: string) => void;
  onOpenFavourites?: () => void;
};

export function ChatInput({
  onSend,
  onStop,
  isGenerating,
  disabled,
  placeholder,
  hapticsEnabled = true,
  prefillText,
  onSaveFavourite,
  onOpenFavourites,
}: Props) {
  const colors = useColors();
  const [text, setText] = useState<string>("");
  const [justSaved, setJustSaved] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    if (prefillText != null) setText(prefillText);
  }, [prefillText]);

  const { voiceState, startRecording, stopRecording, cancelRecording } =
    useVoiceInput((transcript: string) => {
      setText((prev) => (prev ? prev + " " + transcript : transcript));
    });

  const handleSend = () => {
    const trimmed = text.trim();
    if ((!trimmed && attachments.length === 0) || disabled) return;
    if (hapticsEnabled && Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSend(trimmed, attachments.length > 0 ? attachments : undefined);
    setText("");
    setAttachments([]);
  };

  const handleStop = () => {
    if (hapticsEnabled && Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onStop();
  };

  const handleSaveFav = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSaveFavourite?.(trimmed);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const handleVoicePress = async () => {
    if (voiceState === "idle") await startRecording();
    else if (voiceState === "recording") await stopRecording();
    else if (voiceState === "error") await cancelRecording();
  };

  const handlePickImage = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Image picker not available on web preview", "Use on Android device.");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo library access to attach images.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 4,
    });
    if (!result.canceled) {
      const newAttachments: Attachment[] = result.assets.map((a) => ({
        type: "image" as const,
        uri: a.uri,
        name: a.fileName ?? `image_${Date.now()}.jpg`,
        mimeType: a.mimeType ?? "image/jpeg",
      }));
      setAttachments((prev) => [...prev, ...newAttachments].slice(0, 4));
    }
  };

  const handlePickCamera = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Camera not available on web preview", "Use on Android device.");
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow camera access to take photos.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      const a = result.assets[0];
      setAttachments((prev) => [
        ...prev,
        { type: "image", uri: a.uri, name: `photo_${Date.now()}.jpg`, mimeType: "image/jpeg" },
      ].slice(0, 4));
    }
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const showStop = isGenerating;
  const canSend = (text.trim().length > 0 || attachments.length > 0) && !disabled;
  const isRecording = voiceState === "recording";
  const isTranscribing = voiceState === "transcribing";
  const charCount = text.length;
  const nearLimit = charCount > MAX_CHARS * 0.8;
  const atLimit = charCount >= MAX_CHARS;

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
      {/* Attachment preview strip */}
      {attachments.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.attachPreviewBar}
          contentContainerStyle={styles.attachPreviewContent}
        >
          {attachments.map((att, idx) => (
            <View key={idx} style={styles.attachThumbWrap}>
              {att.type === "image" ? (
                <Image source={{ uri: att.uri }} style={styles.attachThumb} resizeMode="cover" />
              ) : (
                <View style={[styles.attachDocThumb, { backgroundColor: colors.secondary }]}>
                  <Feather name="file-text" size={20} color={colors.mutedForeground} />
                </View>
              )}
              <Pressable
                onPress={() => removeAttachment(idx)}
                style={[styles.attachRemoveBtn, { backgroundColor: colors.foreground }]}
              >
                <Feather name="x" size={10} color={colors.background} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <View style={[styles.recordingBar, { backgroundColor: colors.accent }]}>
          <View style={[styles.recordingDot, { backgroundColor: colors.destructive }]} />
          <Text style={[styles.recordingText, { color: colors.accentForeground }]}>
            Recording... tap mic to stop
          </Text>
        </View>
      )}
      {isTranscribing && (
        <View style={[styles.recordingBar, { backgroundColor: colors.accent }]}>
          <ActivityIndicator size="small" color={colors.accentForeground} />
          <Text style={[styles.recordingText, { color: colors.accentForeground }]}>Transcribing...</Text>
        </View>
      )}

      {/* Character counter */}
      {charCount > 0 && !isGenerating && (
        <View style={styles.counterRow}>
          <Text style={[styles.counter, { color: atLimit ? colors.destructive : nearLimit ? colors.warning : colors.mutedForeground }]}>
            {charCount} / {MAX_CHARS}
          </Text>
        </View>
      )}

      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.secondary,
            borderColor: isRecording ? colors.destructive : atLimit ? colors.destructive : colors.border,
            borderWidth: isRecording || atLimit ? 1.5 : 1,
          },
        ]}
      >
        {/* Attach image from gallery */}
        <Pressable
          onPress={() => void handlePickImage()}
          disabled={isTranscribing || isGenerating}
          style={({ pressed }) => [
            styles.sideBtn,
            { backgroundColor: pressed ? colors.muted : "transparent", opacity: isGenerating ? 0.4 : 1 },
          ]}
        >
          <Feather name="image" size={17} color={colors.mutedForeground} />
        </Pressable>

        {/* Camera — native only */}
        {Platform.OS !== "web" && (
          <Pressable
            onPress={() => void handlePickCamera()}
            disabled={isTranscribing || isGenerating}
            style={({ pressed }) => [
              styles.sideBtn,
              { backgroundColor: pressed ? colors.muted : "transparent", opacity: isGenerating ? 0.4 : 1 },
            ]}
          >
            <Feather name="camera" size={17} color={colors.mutedForeground} />
          </Pressable>
        )}

        {/* Favourites bookmark button */}
        {onOpenFavourites && (
          <Pressable
            onPress={onOpenFavourites}
            disabled={isTranscribing}
            style={({ pressed }) => [
              styles.sideBtn,
              { backgroundColor: pressed ? colors.muted : "transparent" },
            ]}
          >
            <Feather name="bookmark" size={17} color={colors.mutedForeground} />
          </Pressable>
        )}

        {/* Voice button */}
        {Platform.OS !== "web" && (
          <Pressable
            onPress={handleVoicePress}
            disabled={isTranscribing || disabled}
            style={({ pressed }) => [
              styles.sideBtn,
              {
                backgroundColor: isRecording ? colors.destructive : pressed ? colors.muted : "transparent",
                opacity: isTranscribing ? 0.5 : 1,
              },
            ]}
          >
            <Feather
              name={isRecording ? "square" : "mic"}
              size={18}
              color={isRecording ? colors.destructiveForeground : colors.mutedForeground}
            />
          </Pressable>
        )}

        <TextInput
          style={[styles.input, { color: colors.foreground }]}
          placeholder={
            isRecording ? "Listening..." : isTranscribing ? "Transcribing..." : placeholder ?? "Message Gemma…"
          }
          placeholderTextColor={colors.mutedForeground}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={MAX_CHARS}
          editable={!disabled && !isRecording}
          textAlignVertical="center"
        />

        {/* Save to favourites star — shows when typing */}
        {canSend && onSaveFavourite && text.trim().length > 0 && (
          <Pressable
            onPress={handleSaveFav}
            style={({ pressed }) => [
              styles.sideBtn,
              { backgroundColor: justSaved ? colors.accent : pressed ? colors.muted : "transparent" },
            ]}
          >
            <Feather
              name={justSaved ? "check" : "star"}
              size={17}
              color={justSaved ? colors.accentForeground : colors.mutedForeground}
            />
          </Pressable>
        )}

        {showStop ? (
          <Pressable
            onPress={handleStop}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: colors.destructive, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Feather name="square" size={16} color={colors.destructiveForeground} />
          </Pressable>
        ) : (
          <Pressable
            onPress={handleSend}
            disabled={!canSend}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: canSend ? colors.primary : colors.muted, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            {disabled && !canSend ? (
              <ActivityIndicator size="small" color={colors.mutedForeground} />
            ) : (
              <Feather name="arrow-up" size={18} color={canSend ? colors.primaryForeground : colors.mutedForeground} />
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  attachPreviewBar: { maxHeight: 90, marginBottom: 8 },
  attachPreviewContent: { paddingHorizontal: 4, gap: 8, alignItems: "center" },
  attachThumbWrap: { position: "relative" },
  attachThumb: { width: 72, height: 72, borderRadius: 10 },
  attachDocThumb: { width: 72, height: 72, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  attachRemoveBtn: {
    position: "absolute", top: -6, right: -6,
    width: 18, height: 18, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
  },
  recordingBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, marginBottom: 8,
  },
  recordingDot: { width: 8, height: 8, borderRadius: 4 },
  recordingText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  counterRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 4, paddingHorizontal: 4 },
  counter: { fontSize: 11.5, fontFamily: "Inter_500Medium" },
  inputRow: {
    flexDirection: "row", alignItems: "flex-end",
    borderRadius: 24, borderWidth: 1,
    paddingLeft: 4, paddingRight: 6, paddingVertical: 6,
    gap: 2, minHeight: 48,
  },
  sideBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  input: {
    flex: 1, fontSize: 15.5, fontFamily: "Inter_400Regular",
    paddingVertical: Platform.OS === "ios" ? 10 : 6, maxHeight: 140,
  },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
});
