/**
 * Inference engine wrapper.
 *
 * If a GGUF model is loaded into llama.rn, runs real on-device inference.
 * Otherwise falls back to a small placeholder so the UI remains functional.
 */

import * as Llama from "@/lib/llama";
import type { Message } from "@/context/ChatContext";
import type { Settings } from "@/context/SettingsContext";

export type InferenceChunk = {
  token: string;
  done: boolean;
};

export type GenerateParams = {
  messages: Message[];
  settings: Settings;
  onToken: (chunk: InferenceChunk) => void;
  signal?: AbortSignal;
};

const FALLBACK_RESPONSES: string[] = [
  "No model is loaded yet. Open the Models tab, download a Gemma model, then tap Use this model to load it into memory. After that I can answer offline.",
  "I am ready, but a model has not been activated. Tap the model name at the top of this screen, choose a downloaded model, and try again.",
];

export async function generate({
  messages,
  settings,
  onToken,
  signal,
}: GenerateParams): Promise<string> {
  if (Llama.isModelLoaded()) {
    let assembled = "";
    try {
      const text = await Llama.complete({
        messages,
        systemPrompt: settings.systemPrompt,
        temperature: settings.temperature,
        topK: settings.topK,
        topP: settings.topP,
        maxTokens: settings.maxTokens,
        signal,
        onToken: (token) => {
          assembled += token;
          onToken({ token, done: false });
        },
      });
      onToken({ token: "", done: true });
      return text || assembled;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Inference failed";
      const errChunk = `\n\n⚠ ${msg}`;
      onToken({ token: errChunk, done: false });
      onToken({ token: "", done: true });
      return assembled + errChunk;
    }
  }

  const fullText =
    FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)] ??
    FALLBACK_RESPONSES[0]!;
  const tokens = fullText.split(/(\s+)/);
  let assembled = "";
  const baseDelay = Math.max(10, 80 - settings.temperature * 50);
  for (const tk of tokens) {
    if (signal?.aborted) break;
    assembled += tk;
    onToken({ token: tk, done: false });
    await new Promise((res) => setTimeout(res, baseDelay + Math.random() * 30));
  }
  onToken({ token: "", done: true });
  return assembled;
}

export const INFERENCE_AVAILABLE = true;
export const INFERENCE_ENGINE_INFO =
  "On-device Gemma via llama.rn — fully offline once a model is loaded.";
