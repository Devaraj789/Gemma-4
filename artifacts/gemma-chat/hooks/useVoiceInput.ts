import { useState, useRef, useCallback } from "react";
import { Audio } from "expo-av";
import { loadWhisper } from "@/lib/whisper";
import { Platform } from "react-native";

export type VoiceState = "idle" | "requesting" | "recording" | "transcribing" | "error";

export function useVoiceInput(onTranscript: (text: string) => void) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startRecording = useCallback(async () => {
    if (Platform.OS === "web") return;
    try {
      setVoiceState("requesting");
      setErrorMsg(null);

      // Permission check
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setErrorMsg("Microphone permission denied");
        setVoiceState("error");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setVoiceState("recording");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Recording failed");
      setVoiceState("error");
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) return;

    try {
      setVoiceState("transcribing");
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;

      if (!uri) throw new Error("No audio file");

      // Whisper transcribe
      const ctx = await loadWhisper();
      const { promise } = ctx.transcribe(uri, {
        language: "auto",
        maxLen: 1,
        tokenTimestamps: true,
      });
      const result = await promise;
      const text = result.result?.trim();

      if (text && text.length > 0) {
        onTranscript(text);
      }
      setVoiceState("idle");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Transcription failed");
      setVoiceState("error");
      setTimeout(() => setVoiceState("idle"), 2000);
    }
  }, [onTranscript]);

  const cancelRecording = useCallback(async () => {
    const recording = recordingRef.current;
    if (recording) {
      await recording.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    }
    setVoiceState("idle");
    setErrorMsg(null);
  }, []);

  return {
    voiceState,
    errorMsg,
    startRecording,
    stopRecording,
    cancelRecording,
    isRecording: voiceState === "recording",
    isTranscribing: voiceState === "transcribing",
  };
}