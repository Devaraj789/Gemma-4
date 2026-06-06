export type VoiceState = "idle" | "requesting" | "recording" | "transcribing" | "error";

export function useVoiceInput(_onTranscript: (text: string) => void) {
  return {
    voiceState: "idle" as VoiceState,
    errorMsg: null,
    startRecording: async () => {},
    stopRecording: async () => {},
    cancelRecording: async () => {},
    isRecording: false,
    isTranscribing: false,
  };
}
