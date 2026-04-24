# Gemma Offline Chat — Real Inference Setup Guide

This app's UI is fully production-ready. To swap the simulated responses for **real on-device Gemma inference**, follow the steps below. You need to run these from your **local machine** (not Replit), because EAS CLI builds require a real device/cloud build pipeline.

---

## Prerequisites

- Node.js 20+ and pnpm installed locally
- A free [Expo account](https://expo.dev/signup)
- An Android phone (for fastest path) or a Mac with Xcode (for iOS)
- ~8 GB free disk space for the build cache

---

## Step 1 — Pull this project to your laptop

In Replit, open the **Git** tab and connect a GitHub repo (or download the project as a zip). Then on your laptop:

```bash
git clone <your-repo-url> gemma-chat
cd gemma-chat
pnpm install
```

---

## Step 2 — Install EAS CLI and login

```bash
npm install -g eas-cli
eas login
```

Use your Expo account credentials.

---

## Step 3 — Add the native inference library

```bash
cd artifacts/gemma-chat
pnpm add llama.rn
```

`llama.rn` is a React Native wrapper around `llama.cpp` — the same engine that powers most local LLM apps. It supports GGUF model files (which is the format the app already downloads).

---

## Step 4 — Configure EAS in this artifact

Create `artifacts/gemma-chat/eas.json`:

```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "ios": { "simulator": false }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {}
  }
}
```

Then initialize the project on EAS:

```bash
eas init
```

This adds an `extra.eas.projectId` to `app.json` automatically.

---

## Step 5 — Build the development APK

```bash
eas build --profile development --platform android
```

- Takes ~15–25 minutes on EAS cloud (free tier gives 30 builds/month)
- When finished, EAS shows a QR code + download link
- Install the APK on your Android phone

> **iOS path:** use `--platform ios`. You will need to register your Apple device UDID with EAS — follow the prompts.

---

## Step 6 — Replace simulated inference with real llama.rn

Open `artifacts/gemma-chat/lib/inference.ts` and replace the file with:

```typescript
import { initLlama, type LlamaContext } from "llama.rn";

import type { Message } from "@/context/ChatContext";
import type { Settings } from "@/context/SettingsContext";
import { getModelPath } from "./storage";

export type InferenceChunk = { token: string; done: boolean };

export type GenerateParams = {
  messages: Message[];
  settings: Settings;
  onToken: (chunk: InferenceChunk) => void;
  signal?: AbortSignal;
  modelId: string;
};

let ctx: LlamaContext | null = null;
let loadedModelId: string | null = null;

async function ensureContext(modelId: string) {
  if (ctx && loadedModelId === modelId) return ctx;
  if (ctx) {
    await ctx.release();
    ctx = null;
  }
  const path = await getModelPath(modelId);
  ctx = await initLlama({
    model: path,
    n_ctx: 2048,
    n_gpu_layers: 0,
  });
  loadedModelId = modelId;
  return ctx;
}

function buildPrompt(messages: Message[], systemPrompt: string) {
  const sys = systemPrompt
    ? `<start_of_turn>system\n${systemPrompt}<end_of_turn>\n`
    : "";
  const turns = messages
    .map((m) => {
      const role = m.role === "user" ? "user" : "model";
      return `<start_of_turn>${role}\n${m.content}<end_of_turn>`;
    })
    .join("\n");
  return `${sys}${turns}\n<start_of_turn>model\n`;
}

export async function generate({
  messages,
  settings,
  onToken,
  signal,
  modelId,
}: GenerateParams): Promise<string> {
  const llama = await ensureContext(modelId);
  const prompt = buildPrompt(messages, settings.systemPrompt);

  let assembled = "";
  const result = await llama.completion(
    {
      prompt,
      n_predict: settings.maxTokens,
      temperature: settings.temperature,
      top_p: settings.topP,
      top_k: settings.topK,
      stop: ["<end_of_turn>", "<start_of_turn>"],
    },
    (data) => {
      if (signal?.aborted) return;
      assembled += data.token;
      onToken({ token: data.token, done: false });
    }
  );

  onToken({ token: "", done: true });
  return result.text ?? assembled;
}

export const INFERENCE_AVAILABLE = true;
export const INFERENCE_ENGINE_INFO = "llama.rn (llama.cpp) on-device";
```

Then update the call site in `context/ChatContext.tsx` to pass `modelId`:

```typescript
await generate({
  messages: nextMessages,
  settings,
  modelId: activeModel.id,
  signal: controller.signal,
  onToken: (chunk) => { /* existing handler */ },
});
```

---

## Step 7 — Start the dev server and connect

On your laptop:

```bash
pnpm --filter @workspace/gemma-chat run dev
```

Open the installed APK on your phone — it auto-discovers your dev server on the same Wi-Fi. The Metro bundler will push the new code over.

---

## Step 8 — Download a model and chat

1. Open the **Models** tab
2. Pick **Gemma 3 1B** (smallest — ~720 MB) for the first test
3. Wait for the download to complete
4. Go back to chat and start typing — real Gemma output streams in

> If responses are too slow, try the smaller 3 1B model first, lower `n_ctx` to 1024, or enable GPU layers (`n_gpu_layers: 99`) on newer Snapdragon / Apple Silicon devices.

---

## Production release

When you're ready to ship:

```bash
eas build --profile production --platform android
```

This produces an `.aab` bundle for Google Play, or `.ipa` for the App Store. The model files are downloaded by users at runtime, so your app binary stays small (~30 MB).

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Module llama.rn not found` | You're still in Expo Go. Install the dev APK from Step 5. |
| Out of memory crash | Use Gemma 3 1B, lower `n_ctx`, close background apps. |
| Very slow tokens | Enable GPU offload: `n_gpu_layers: 99` (only on newer chips). |
| Download fails | HuggingFace requires no auth for these GGUF files, but check your network. |

---

## What stays in Replit

The Replit environment is perfect for **iterating on the UI** (chat layout, settings, model cards, history). All UI changes you make here will show up in the dev build automatically — only native module additions require a rebuild.
