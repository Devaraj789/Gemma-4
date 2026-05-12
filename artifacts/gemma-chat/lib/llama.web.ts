import type { Message } from "@/context/ChatContext";

export type CompletionParams = {
  messages: Message[];
  systemPrompt: string;
  temperature: number;
  topK: number;
  topP: number;
  maxTokens: number;
  onToken: (token: string) => void;
  onStats?: (stats: { tokensPerSec: number; totalTokens: number }) => void;
  signal?: AbortSignal;
};

export function getLastLoadTimeMs(): number {
  return 0;
}

export async function loadModel(_modelPath: string): Promise<void> {
  throw new Error("llama.rn is not available on web");
}

export async function unloadModel(): Promise<void> {}

export function isModelLoaded(): boolean {
  return false;
}

export function getActiveModelPath(): string | null {
  return null;
}

export function formatChat(
  _messages: Message[],
  _systemPrompt: string,
  _modelPath: string,
): string {
  return "";
}

export function formatGemmaChat(
  _messages: Message[],
  _systemPrompt: string,
): string {
  return "";
}

export function formatLlamaChat(
  _messages: Message[],
  _systemPrompt: string,
): string {
  return "";
}

export function formatQwenChat(
  _messages: Message[],
  _systemPrompt: string,
): string {
  return "";
}

export async function complete(_params: CompletionParams): Promise<string> {
  throw new Error("llama.rn is not available on web");
}
