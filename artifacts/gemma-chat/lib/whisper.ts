import { initWhisper } from "whisper.rn";
import * as FileSystem from "expo-file-system/legacy";

type WhisperContext = Awaited<ReturnType<typeof initWhisper>>;

let whisperCtx: WhisperContext | null = null;
let initPromise: Promise<WhisperContext> | null = null;

const MODEL_URL =
  "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin";
const MODEL_PATH =
  (FileSystem.documentDirectory ?? "") + "whisper-tiny-en.bin";

export async function ensureWhisperModel(): Promise<void> {
  const info = await FileSystem.getInfoAsync(MODEL_PATH);
  if (info.exists && (info.size ?? 0) > 1_000_000) return;
  await FileSystem.downloadAsync(MODEL_URL, MODEL_PATH);
}

export async function loadWhisper(): Promise<WhisperContext> {
  if (whisperCtx) return whisperCtx;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    await ensureWhisperModel();
    whisperCtx = await initWhisper({ filePath: MODEL_PATH });
    return whisperCtx;
  })().finally(() => {
    initPromise = null;
  });

  return initPromise;
}

export async function unloadWhisper(): Promise<void> {
  if (whisperCtx) {
    await whisperCtx.release().catch(() => {});
    whisperCtx = null;
  }
}
