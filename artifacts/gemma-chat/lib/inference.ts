/**
 * lib/inference.ts
 * ─────────────────────────────────────────────────────────────
 * Sparks AI — Unified inference engine
 *
 * Route logic:
 *   settings.useOnlineModel = true  + apiKey set  → OpenRouter
 *   settings.useOnlineModel = false OR no apiKey  → llama.rn (offline)
 * ─────────────────────────────────────────────────────────────
 */

import * as Llama from "@/lib/llama";
import { streamChatCompletion } from "@/lib/openrouter";
import type { Message } from "@/context/ChatContext";
import type { Settings } from "@/context/SettingsContext";

// ─── Types ────────────────────────────────────────────────────

export type InferenceChunk = {
  token: string;
  done: boolean;
  tokensPerSec?: number;
  totalTokens?: number;
};

export type GenerateParams = {
  messages: Message[];
  settings: Settings;
  onToken: (chunk: InferenceChunk) => void;
  onStats?: (stats: { tokensPerSec: number; totalTokens: number }) => void;
  signal?: AbortSignal;
};

// ─── Fallback (no model loaded, no API key) ───────────────────

const FALLBACK_RESPONSES: string[] = [
  "No model is loaded yet. Open the Models tab, download a model, then tap 'Use this model' to load it into memory.",
  "I am ready, but a model has not been activated. Tap the model name at the top of this screen, choose a downloaded model, and try again.",
];

// ─── Main generate() ──────────────────────────────────────────

export async function generate({
  messages,
  settings,
  onToken,
  onStats,
  signal,
}: GenerateParams): Promise<string> {

  // ── Route 1: OpenRouter (online) ──────────────────────────────
  const shouldUseOnline =
    settings.useOnlineModel &&
    settings.openRouterApiKey.trim().length > 0;

  if (shouldUseOnline) {
    return await generateOnline({ messages, settings, onToken, onStats, signal });
  }

  // ── Route 2: llama.rn (offline) ───────────────────────────────
  if (Llama.isModelLoaded()) {
    return await generateOffline({ messages, settings, onToken, onStats, signal });
  }

  // ── Route 3: Fallback (nothing loaded) ────────────────────────
  return await generateFallback({ settings, onToken, signal });
}

// ─── Online: OpenRouter streaming ─────────────────────────────

async function generateOnline({
  messages,
  settings,
  onToken,
  onStats,
  signal,
}: GenerateParams): Promise<string> {
  let assembled = "";
  let tokenCount = 0;
  const startTime = Date.now();

  try {
    // Convert ChatContext Message[] → OpenRouter ChatMessage[]
    // Filter out system messages (we pass systemPrompt separately)
    const chatMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const stream = streamChatCompletion({
      apiKey: settings.openRouterApiKey,
      model: settings.openRouterModel,
      messages: chatMessages,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
      systemPrompt: settings.systemPrompt,
    });

    for await (const chunk of stream) {
      // Respect abort signal
      if (signal?.aborted) break;

      if (chunk.done) break;

      assembled += chunk.text;
      tokenCount++;
      onToken({ token: chunk.text, done: false });

      // Emit stats every 5 tokens
      if (onStats && tokenCount % 5 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const tokensPerSec = elapsed > 0 ? tokenCount / elapsed : 0;
        onStats({ tokensPerSec, totalTokens: tokenCount });
      }
    }

    // Final stats
    if (onStats && tokenCount > 0) {
      const elapsed = (Date.now() - startTime) / 1000;
      onStats({
        tokensPerSec: elapsed > 0 ? tokenCount / elapsed : 0,
        totalTokens: tokenCount,
      });
    }

    onToken({ token: "", done: true });
    return assembled;

  } catch (e: unknown) {
    // Network error or API error
    const msg = e instanceof Error ? e.message : "Online inference failed";

    // User-friendly error messages
    let userMsg = "\n\n⚠️ " + msg;
    if (msg.includes("401")) userMsg = "\n\n⚠️ Invalid API key. Please check Settings → OpenRouter API Key.";
    if (msg.includes("429")) userMsg = "\n\n⚠️ Rate limit reached. Try again in a moment or use offline mode.";
    if (msg.includes("Network") || msg.includes("fetch")) {
      userMsg = "\n\n⚠️ No internet connection. Switch to offline mode in Settings.";
    }

    onToken({ token: userMsg, done: false });
    onToken({ token: "", done: true });
    return assembled + userMsg;
  }
}

// ─── Offline: llama.rn ────────────────────────────────────────

async function generateOffline({
  messages,
  settings,
  onToken,
  onStats,
  signal,
}: GenerateParams): Promise<string> {
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
      onStats: (stats) => {
        onToken({
          token: "",
          done: false,
          tokensPerSec: stats.tokensPerSec,
          totalTokens: stats.totalTokens,
        });
        onStats?.(stats);
      },
    });

    onToken({ token: "", done: true });
    return text || assembled;

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Inference failed";
    const errChunk = "\n\n⚠️ ERROR: " + msg;
    onToken({ token: errChunk, done: false });
    onToken({ token: "", done: true });
    return assembled + errChunk;
  }
}

// ─── Fallback: no model, no API key ───────────────────────────

async function generateFallback({
  settings,
  onToken,
  signal,
}: Pick<GenerateParams, "settings" | "onToken" | "signal">): Promise<string> {
  const fullText =
    FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)] ??
    FALLBACK_RESPONSES[0]!;

  const words = fullText.split(" ");
  let assembled = "";
  const baseDelay = Math.max(10, 80 - settings.temperature * 50);

  for (const word of words) {
    if (signal?.aborted) break;
    const token = (assembled ? " " : "") + word;
    assembled += token;
    onToken({ token, done: false });
    await new Promise((res) => setTimeout(res, baseDelay + Math.random() * 30));
  }

  onToken({ token: "", done: true });
  return assembled;
}

// ─── Engine info (for UI display) ────────────────────────────

export const INFERENCE_AVAILABLE = true;

export function getEngineInfo(settings: Settings): string {
  if (settings.useOnlineModel && settings.openRouterApiKey.trim()) {
    return `Online · ${settings.openRouterModel}`;
  }
  if (Llama.isModelLoaded()) {
    return `Offline · ${Llama.getActiveModelPath()?.split("/").pop() ?? "model"}`;
  }
  return "No model loaded";
}

// Keep backward compat
export const INFERENCE_ENGINE_INFO =
  "Sparks AI — offline (llama.rn) + online (OpenRouter)";