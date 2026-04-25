import { initLlama, type LlamaContext } from "llama.rn";

import type { Message } from "@/context/ChatContext";

let activeContext: LlamaContext | null = null;
let activeModelPath: string | null = null;
let loadingPromise: Promise<LlamaContext> | null = null;

export async function loadModel(modelPath: string): Promise<void> {
  if (activeModelPath === modelPath && activeContext) return;
  await unloadModel();
  loadingPromise = initLlama({
    model: modelPath,
    n_ctx: 2048,
    n_gpu_layers: 0,
    use_mlock: false,
  });
  try {
    activeContext = await loadingPromise;
    activeModelPath = modelPath;
  } finally {
    loadingPromise = null;
  }
}

export async function unloadModel(): Promise<void> {
  if (activeContext) {
    try {
      await activeContext.release();
    } catch {
      // ignore
    }
    activeContext = null;
    activeModelPath = null;
  }
}

export function isModelLoaded(): boolean {
  return activeContext !== null;
}

export function getActiveModelPath(): string | null {
  return activeModelPath;
}

export function formatGemmaChat(
  messages: Message[],
  systemPrompt: string,
): string {
  let prompt = "";
  if (systemPrompt && systemPrompt.trim()) {
    prompt += `<start_of_turn>user\n${systemPrompt.trim()}<end_of_turn>\n`;
    prompt += `<start_of_turn>model\nUnderstood. I will help.<end_of_turn>\n`;
  }
  for (const m of messages) {
    if (m.role === "system") continue;
    if (!m.content || !m.content.trim()) continue;
    const role = m.role === "user" ? "user" : "model";
    prompt += `<start_of_turn>${role}\n${m.content}<end_of_turn>\n`;
  }
  prompt += "<start_of_turn>model\n";
  return prompt;
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

export async function complete({
  messages,
  systemPrompt,
  temperature,
  topK,
  topP,
  maxTokens,
  onToken,
  signal,
}: CompletionParams): Promise<string> {
  if (!activeContext) {
    throw new Error("No model loaded. Activate a model first.");
  }
  const prompt = formatGemmaChat(messages, systemPrompt);
  let assembled = "";

  const completionPromise = activeContext.completion(
    {
      prompt,
      n_predict: maxTokens,
      temperature,
      top_k: topK,
      top_p: topP,
      stop: ["<end_of_turn>", "<start_of_turn>"],
      penalty_repeat: 1.1,
    },
    (data: { token: string }) => {
      if (signal?.aborted) return;
      assembled += data.token;
      onToken(data.token);
    },
  );

  if (signal) {
    signal.addEventListener("abort", () => {
      try {
        activeContext?.stopCompletion();
      } catch {
        // ignore
      }
    });
  }

  const result = await completionPromise;
  return assembled || result.text || "";
}
