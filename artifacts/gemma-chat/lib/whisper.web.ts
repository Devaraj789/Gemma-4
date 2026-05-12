export async function ensureWhisperModel(): Promise<void> {}

export async function loadWhisper(): Promise<never> {
  throw new Error("whisper.rn is not available on web");
}

export async function unloadWhisper(): Promise<void> {}
