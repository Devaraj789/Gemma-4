/**
 * lib/openrouter.ts
 * ─────────────────────────────────────────────
 * Sparks AI — OpenRouter online model integration
 * Supports: model listing, streaming chat completion
 * Free-first: free tier models filtered & sorted first
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type OpenRouterModel = {
  id: string;               // e.g. "mistralai/mistral-7b-instruct:free"
  name: string;             // Display name
  description: string;
  contextLength: number;    // Max context window
  isFree: boolean;          // true if ":free" tier
  pricing: {
    prompt: string;         // cost per 1k tokens (string from API)
    completion: string;
  };
};

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type StreamChunk = {
  text: string;             // delta text
  done: boolean;            // true on final chunk
};

// ─── Constants ───────────────────────────────────────────────────────────────

const BASE_URL = "https://openrouter.ai/api/v1";

const HEADERS = (apiKey: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${apiKey}`,
  "HTTP-Referer": "https://sparks-ai.app",   // Required by OpenRouter
  "X-Title": "Sparks AI",                    // Shows in OpenRouter dashboard
});

// ─── Fetch Models ─────────────────────────────────────────────────────────────

/**
 * Fetches available models from OpenRouter.
 * Free models (":free" suffix) are sorted first.
 */
export async function fetchOpenRouterModels(
  apiKey: string
): Promise<OpenRouterModel[]> {
  if (!apiKey.trim()) throw new Error("API key is required");

  const res = await fetch(`${BASE_URL}/models`, {
    method: "GET",
    headers: HEADERS(apiKey),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.error?.message ?? `OpenRouter error: ${res.status}`
    );
  }

  const json = await res.json();

  // Map API response → OpenRouterModel
  const models: OpenRouterModel[] = (json.data ?? []).map((m: any) => ({
    id: m.id,
    name: m.name ?? m.id,
    description: m.description ?? "",
    contextLength: m.context_length ?? 4096,
    isFree:
      m.id.endsWith(":free") ||
      (parseFloat(m.pricing?.prompt ?? "1") === 0 &&
        parseFloat(m.pricing?.completion ?? "1") === 0),
    pricing: {
      prompt: m.pricing?.prompt ?? "0",
      completion: m.pricing?.completion ?? "0",
    },
  }));

  // Free models first, then alphabetical
  return models.sort((a, b) => {
    if (a.isFree && !b.isFree) return -1;
    if (!a.isFree && b.isFree) return 1;
    return a.name.localeCompare(b.name);
  });
}

// ─── Streaming Chat Completion ────────────────────────────────────────────────

/**
 * Streams a chat completion from OpenRouter.
 *
 * Usage:
 *   for await (const chunk of streamChatCompletion({ ... })) {
 *     if (chunk.done) break;
 *     appendText(chunk.text);
 *   }
 */
export async function* streamChatCompletion(params: {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}): AsyncGenerator<StreamChunk> {
  const {
    apiKey,
    model,
    messages,
    temperature = 0.7,
    maxTokens = 512,
    systemPrompt,
  } = params;

  if (!apiKey.trim()) throw new Error("API key is required");

  // Build message array — prepend system prompt if provided
  const finalMessages: ChatMessage[] = [
    ...(systemPrompt
      ? [{ role: "system" as const, content: systemPrompt }]
      : []),
    ...messages,
  ];

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: HEADERS(apiKey),
    body: JSON.stringify({
      model,
      messages: finalMessages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.error?.message ?? `OpenRouter error: ${res.status}`
    );
  }

  // ── Stream parsing ──────────────────────────────────────────────────────────
  // React Native fetch supports ReadableStream on Hermes (RN 0.73+)
  // Fallback: read full body if stream not supported

  if (res.body && typeof res.body.getReader === "function") {
    // ── Streaming path (RN 0.73+ / modern) ──
    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE lines: "data: {...}\n\n"
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // keep incomplete last line

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;

        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") {
          yield { text: "", done: true };
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (delta) yield { text: delta, done: false };
        } catch {
          // Malformed chunk — skip
        }
      }
    }
  } else {
    // ── Fallback: non-streaming (older RN / Expo Go) ──
    // Re-request without stream:true
    const fallbackRes = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: HEADERS(apiKey),
      body: JSON.stringify({
        model,
        messages: finalMessages,
        temperature,
        max_tokens: maxTokens,
        stream: false,
      }),
    });

    const json = await fallbackRes.json();
    const content = json?.choices?.[0]?.message?.content ?? "";

    // Simulate word-by-word yield for consistent UX
    const words = content.split(" ");
    for (const word of words) {
      yield { text: word + " ", done: false };
    }
  }

  yield { text: "", done: true };
}

// ─── Validate API Key ─────────────────────────────────────────────────────────

/**
 * Quick check: hits /auth/key to validate the API key.
 * Returns { valid: boolean, limit?: number, usage?: number }
 */
export async function validateApiKey(apiKey: string): Promise<{
  valid: boolean;
  limit?: number;
  usage?: number;
  error?: string;
}> {
  try {
    const res = await fetch(`${BASE_URL}/auth/key`, {
      method: "GET",
      headers: HEADERS(apiKey),
    });

    if (!res.ok) return { valid: false, error: `Status ${res.status}` };

    const json = await res.json();
    return {
      valid: true,
      limit: json?.data?.limit ?? undefined,
      usage: json?.data?.usage ?? undefined,
    };
  } catch (e: any) {
    return { valid: false, error: e?.message ?? "Network error" };
  }
}

// ─── Network Check ────────────────────────────────────────────────────────────

/**
 * Simple online check before making OpenRouter calls.
 * Use with NetInfo (@react-native-community/netinfo) in caller.
 * This is a lightweight ping to OpenRouter's base URL.
 */
export async function isOpenRouterReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/models`, {
      method: "HEAD",
      // No auth needed for HEAD
    });
    return res.status < 500;
  } catch {
    return false;
  }
}