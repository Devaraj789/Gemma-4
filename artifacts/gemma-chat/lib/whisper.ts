import { Platform } from "react-native";
import type { WhisperContext } from "whisper.rn";
import * as FileSystem from "expo-file-system/legacy";

let whisperCtx: WhisperContext | null = null;
let isInitializing = false;

const MODEL_URL =
  "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin";
const MODEL_PATH =
  (FileSystem.documentDirectory ?? "") + "whisper-tiny-en.bin";

export async function ensureWhisperModel(): Promise<void> {
  if (Platform.OS === "web") return;
  const info = await FileSystem.getInfoAsync(MODEL_PATH);
  if (info.exists && (info.size ?? 0) > 1_000_000) return;
  await FileSystem.downloadAsync(MODEL_URL, MODEL_PATH);
}

export async function loadWhisper(): Promise<WhisperContext> {
  if (Platform.OS === "web") throw new Error("Whisper not supported on web");
  if (whisperCtx) return whisperCtx;
  if (isInitializing) {
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (!isInitializing) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
    return whisperCtx!;
  }

  isInitializing = true;
  try {
    await ensureWhisperModel();
    // Dynamic import — web-ல load ஆகாது
    const { initWhisper } = await import("whisper.rn");
    whisperCtx = await initWhisper({ filePath: MODEL_PATH });
    return whisperCtx;
  } finally {
    isInitializing = false;
  }
}

export async function unloadWhisper(): Promise<void> {
  if (Platform.OS === "web") return;
  if (whisperCtx) {
    await whisperCtx.release();
    whisperCtx = null;
  }
}