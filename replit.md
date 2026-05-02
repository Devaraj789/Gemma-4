# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Gemma Offline Chat (artifacts/gemma-chat)

Expo mobile app (React Native + Expo Router) for offline AI chat using MediaPipe/Gemma models.

### App Screens

| Route | File | Description |
|---|---|---|
| `/` | `app/index.tsx` | Main chat screen |
| `/models` | `app/models.tsx` | Model download & selection |
| `/history` | `app/history.tsx` | Conversation history |
| `/settings` | `app/settings.tsx` | Settings (redesigned with reference UI) |
| `/saved` | `app/saved.tsx` | Bookmarks (saved messages) |
| `/storage` | `app/storage.tsx` | Model storage management |
| `/stats` | `app/stats.tsx` | Usage statistics |
| `/language` | `app/language.tsx` | Language picker (12 languages) |
| `/network-check` | `app/network-check.tsx` | Network connectivity test |
| `/privacy` | `app/privacy.tsx` | Privacy & data toggle |
| `/feedback` | `app/feedback.tsx` | Feedback form (mailto) |

### Key Components

- `ChatHeader` — top bar with model pill, search, export, theme toggle
- `ChatInput` — voice input (whisper.rn) + text input
- `MessageBubble` — markdown rendering + TTS (expo-speech) + save/delete/retry
- `EmptyChat` — onboarding state with quick prompts
- `QuickReplies` — contextual reply chips
- `FavouritePromptsSheet` — saved favourite prompts bottom sheet
- `PromptLibrarySheet` — 4-tab prompt/persona browser (My Presets / Built-in / Custom / Templates)

### Settings Architecture (reference-inspired redesign)

Settings screen now follows reference app patterns (photos 1–55 analysed):
- **App identity card** — icon + name + offline badge + engine info
- **Appearance** — segmented theme (Light/Dark/Auto) + font size
- **Generation** — sliders (temperature, topK, topP, maxTokens, contextLength)
- **AI Persona** — Prompt Library sheet (4 tabs) + custom system prompt inline
- **Preferences** — Bookmarks, Language, Privacy & Data, Network Check, Auto-delete slider
- **App** — Rate App, Terms of Service, Privacy Policy, Feedback
- **Data** — Statistics, Export, Storage, Delete all, Reset

### Context

- `SettingsContext` — settings including `language` (string) and `localDataOnly` (boolean)
- `ThemeContext` — light/dark/system theme
- `ChatContext` — conversations, messages, send, clear, export
- `ModelContext` — model list, active model, download progress

### GitHub Actions APK Build

Workflow at `artifacts/gemma-chat/GITHUB_WORKFLOW.yml` (copy to `.github/workflows/` in user's GitHub repo: Devaraj89/Gemma-4).
- Patches `build.gradle` to force universal APK (arm64-v8a + armeabi-v7a)
- Package: `com.devarajrdx9.gemmachat`
- minSdkVersion 23, targetSdkVersion 34
