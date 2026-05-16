import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Text,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useVoiceInput } from "@/hooks/useVoiceInput";

type Props = {
  onSend: (text: string, imageUri?: string, imageMimeType?: string) => void;
  onStop: () => void;
  isGenerating: boolean;
  disabled?: boolean;
  placeholder?: string;
  hapticsEnabled?: boolean;
  prefillText?: string | null;
  visionEnabled?: boolean;
};

export function ChatInput({
  onSend,
  onStop,
  isGenerating,
  disabled,
  placeholder,
  hapticsEnabled = true,
  prefillText,
  visionEnabled = true,
}: Props) {
  const colors = useColors();
  const [text, setText] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<{
    uri: string;
    mimeType: string;
  } | null>(null);

  useEffect(() => {
    if (prefillText != null) setText(prefillText);
  }, [prefillText]);

  const { voiceState, startRecording, stopRecording, cancelRecording } =
    useVoiceInput((transcript: string) => {
      setText((prev) => (prev ? prev + " " + transcript : transcript));
    });

  const handleSend = () => {
    const trimmed = text.trim();
    if ((!trimmed && !selectedImage) || disabled) return;
    if (hapticsEnabled && Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSend(trimmed, selectedImage?.uri, selectedImage?.mimeType);
    setText("");
    setSelectedImage(null);
  };

  const handleStop = () => {
    if (hapticsEnabled && Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onStop();
  };

  const handleVoicePress = async () => {
    if (voiceState === "idle") await startRecording();
    else if (voiceState === "recording") await stopRecording();
    else if (voiceState === "error") await cancelRecording();
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow camera access to take photos.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedImage({ uri: asset.uri, mimeType: asset.mimeType ?? "image/jpeg" });
    }
  };

  const handlePickImage = async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Allow photo access to send images.");
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedImage({ uri: asset.uri, mimeType: asset.mimeType ?? "image/jpeg" });
    }
  };

  const handleAttach = () => {
    if (Platform.OS === "web") {
      Alert.alert("Not supported", "Image input works on Android/iOS only.");
      return;
    }
    Alert.alert("Add Image", "Choose source", [
      { text: "📷 Camera", onPress: handleCamera },
      { text: "🖼 Gallery", onPress: handlePickImage },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const showStop = isGenerating;
  const canSend = (text.trim().length > 0 || !!selectedImage) && !disabled;
  const isRecording = voiceState === "recording";
  const isTranscribing = voiceState === "transcribing";

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
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

      {selectedImage && (
        <View style={styles.imagePreviewWrap}>
          <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} resizeMode="cover" />
          <TouchableOpacity
            style={[styles.removeImg, { backgroundColor: colors.destructive }]}
            onPress={() => setSelectedImage(null)}
          >
            <Feather name="x" size={12} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.inputRow, {
        backgroundColor: colors.secondary,
        borderColor: isRecording ? colors.destructive : colors.border,
        borderWidth: isRecording ? 1.5 : 1,
      }]}>
        {visionEnabled && Platform.OS !== "web" && (
          <Pressable
            onPress={handleAttach}
            disabled={disabled || isGenerating}
            style={({ pressed }) => [styles.sideBtn, { backgroundColor: pressed ? colors.muted : "transparent", opacity: disabled ? 0.4 : 1 }]}
          >
            <Feather name="plus" size={20} color={colors.mutedForeground} />
          </Pressable>
        )}

        {Platform.OS !== "web" && (
          <Pressable
            onPress={handleVoicePress}
            disabled={isTranscribing || disabled}
            style={({ pressed }) => [styles.sideBtn, {
              backgroundColor: isRecording ? colors.destructive : pressed ? colors.muted : "transparent",
              opacity: isTranscribing ? 0.5 : 1,
            }]}
          >
            <Feather name={isRecording ? "square" : "mic"} size={18} color={isRecording ? colors.destructiveForeground : colors.mutedForeground} />
          </Pressable>
        )}

        <TextInput
          style={[styles.input, { color: colors.foreground }]}
          placeholder={isRecording ? "Listening..." : isTranscribing ? "Transcribing..." : placeholder ?? "Message Gemma…"}
          placeholderTextColor={colors.mutedForeground}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={4000}
          editable={!disabled && !isRecording}
          textAlignVertical="center"
        />

        {showStop ? (
          <Pressable onPress={handleStop} style={({ pressed }) => [styles.iconBtn, { backgroundColor: colors.destructive, opacity: pressed ? 0.85 : 1 }]}>
            <Feather name="square" size={16} color={colors.destructiveForeground} />
          </Pressable>
        ) : (
          <Pressable onPress={handleSend} disabled={!canSend} style={({ pressed }) => [styles.iconBtn, { backgroundColor: canSend ? colors.primary : colors.muted, opacity: pressed ? 0.85 : 1 }]}>
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
  wrapper: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12, borderTopWidth: StyleSheet.hairlineWidth },
  recordingBar: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, marginBottom: 8 },
  recordingDot: { width: 8, height: 8, borderRadius: 4 },
  recordingText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  imagePreviewWrap: { marginBottom: 8, alignSelf: "flex-start", marginLeft: 4 },
  imagePreview: { width: 80, height: 80, borderRadius: 10 },
  removeImg: { position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  inputRow: { flexDirection: "row", alignItems: "flex-end", borderRadius: 24, borderWidth: 1, paddingLeft: 8, paddingRight: 6, paddingVertical: 6, gap: 4, minHeight: 48 },
  sideBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  input: { flex: 1, fontSize: 15.5, fontFamily: "Inter_400Regular", paddingVertical: 6, maxHeight: 140 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
});
