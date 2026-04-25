import type { Message } from "@/context/ChatContext";

export async function loadModel(_modelPath: string): Promise<void> {
  throw new Error("llama.rn is not available on web");
}

export async function unloadModel(): Promise<void> {
  // no-op
}

export function isModelLoaded(): boolean {
  return false;
}

export function getActiveModelPath(): string | null {
  return null;
}

export function formatGemmaChat(
  _messages: Message[],
  _systemPrompt: string,
): string {
  return "";
}

export type CompletionParams = {
  messages: Message[];
  systemPrompt: string;
  temperature: number;
  topK: number;
  topP: number;
  maxTokens: number;
  onToken: (token: string) => void;
  signal?: AbortSignal;
};

export async function complete(_params: CompletionParams): Promise<string> {
  throw new Error("llama.rn is not available on web");
}
