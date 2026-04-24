/**
 * Inference engine wrapper.
 *
 * In a custom EAS Development Build, this would use `llama.rn` to run
 * the downloaded GGUF model directly on the device's CPU/GPU. In Expo Go
 * (which cannot load custom native modules), we provide a high-quality
 * simulated streaming response so the UI is fully testable.
 *
 * To enable real on-device inference:
 *   1. `pnpm add llama.rn` in this artifact
 *   2. Create an EAS Development Build (`eas build --profile development`)
 *   3. Replace the simulated stream below with `LlamaContext.completion(...)`
 *      from llama.rn — see https://github.com/mybigday/llama.rn
 */

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

const SAMPLE_RESPONSES: Record<string, string[]> = {
  greeting: [
    "Hello. I am running locally on your device — no internet, no servers, no telemetry. Everything you type stays here.",
    "Hi there. I am a Gemma model running offline on your phone. Ask me anything, your conversation never leaves the device.",
  ],
  default: [
    "That is a great question. Running entirely on-device means I can respond without any network connection — useful in airplane mode, remote areas, or whenever you want full privacy.\n\nTo enable full inference quality, build this app with EAS and link the llama.rn library. The chat surface, model manager, and settings screens you see right now are already production-ready.",
    "I can help with conversations, brainstorming, code questions, summaries, and short writing tasks — all without sending data anywhere.\n\nThis preview answer is generated locally for UI testing. Real inference activates after the EAS development build completes and a Gemma GGUF model is loaded into llama.rn.",
    "Good thinking. On-device language models are advancing quickly — Gemma 3 and 3n variants are tuned to run on phones with 4-8 GB of RAM using INT4 quantization.\n\nThe streaming you are seeing now is a simulation so the chat experience can be tested end-to-end inside Expo Go. Swap in llama.rn at build time for the genuine model output.",
  ],
};

function pickResponse(prompt: string): string {
  const lower = prompt.toLowerCase().trim();
  if (
    lower.startsWith("hi") ||
    lower.startsWith("hello") ||
    lower.startsWith("hey") ||
    lower === "vanakkam"
  ) {
    const opts = SAMPLE_RESPONSES.greeting;
    return opts[Math.floor(Math.random() * opts.length)] ?? opts[0]!;
  }
  const opts = SAMPLE_RESPONSES.default;
  return opts[Math.floor(Math.random() * opts.length)] ?? opts[0]!;
}

export async function generate({
  messages,
  settings,
  onToken,
  signal,
}: GenerateParams): Promise<string> {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const prompt = lastUser?.content ?? "";

  const fullText = pickResponse(prompt);
  const tokens = fullText.split(/(\s+)/);

  let assembled = "";
  const baseDelay = Math.max(10, 80 - settings.temperature * 50);

  for (let i = 0; i < tokens.length; i++) {
    if (signal?.aborted) break;
    const tk = tokens[i]!;
    assembled += tk;
    onToken({ token: tk, done: false });
    await new Promise((res) => setTimeout(res, baseDelay + Math.random() * 30));
  }

  onToken({ token: "", done: true });
  return assembled;
}

export const INFERENCE_AVAILABLE = false;
export const INFERENCE_ENGINE_INFO =
  "Preview mode — install llama.rn via EAS build to enable on-device inference.";
