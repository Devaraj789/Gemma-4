export type ModelVariant = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  sizeLabel: string;
  sizeBytes: number;
  ramRequiredGb: number;
  quantization: string;
  format: "gguf" | "task";
  downloadUrl: string;
  badges: string[];
  recommended?: boolean;
};

export const GEMMA_MODELS: ModelVariant[] = [
  {
    id: "gemma-3n-e2b-it-q4",
    name: "Gemma 3n E2B Instruct",
    shortName: "Gemma 3n E2B",
    description:
      "Lightweight on-device chat model. Faster responses, perfect for everyday conversations and coding questions.",
    sizeLabel: "~3.1 GB",
    sizeBytes: 3_100_000_000,
    ramRequiredGb: 4,
    quantization: "Q4_K_M",
    format: "gguf",
    downloadUrl:
      "https://huggingface.co/unsloth/gemma-3n-E2B-it-GGUF/resolve/main/gemma-3n-E2B-it-Q4_K_M.gguf",
    badges: ["GGUF", "Chat", "Q4_K_M"],
    recommended: true,
  },
  {
    id: "gemma-3n-e4b-it-q4",
    name: "Gemma 3n E4B Instruct",
    shortName: "Gemma 3n E4B",
    description:
      "Stronger reasoning and longer answers. Larger model size with slower first load but more complete responses.",
    sizeLabel: "~4.9 GB",
    sizeBytes: 4_900_000_000,
    ramRequiredGb: 6,
    quantization: "Q4_K_M",
    format: "gguf",
    downloadUrl:
      "https://huggingface.co/unsloth/gemma-3n-E4B-it-GGUF/resolve/main/gemma-3n-E4B-it-Q4_K_M.gguf",
    badges: ["GGUF", "Chat", "Q4_K_M"],
  },
  {
    id: "gemma-3-1b-it-q4",
    name: "Gemma 3 1B Instruct",
    shortName: "Gemma 3 1B",
    description:
      "Smallest Gemma 3 variant. Runs on almost any modern phone. Great for quick prompts and low-RAM devices.",
    sizeLabel: "~720 MB",
    sizeBytes: 720_000_000,
    ramRequiredGb: 2,
    quantization: "Q4_K_M",
    format: "gguf",
    downloadUrl:
      "https://huggingface.co/unsloth/gemma-3-1b-it-GGUF/resolve/main/gemma-3-1b-it-Q4_K_M.gguf",
    badges: ["GGUF", "Tiny"],
  },
  {
    id: "gemma-3-4b-it-q4",
    name: "Gemma 3 4B Instruct",
    shortName: "Gemma 3 4B",
    description:
      "A balanced mid-size model. Good answer quality with reasonable size for most modern Android phones.",
    sizeLabel: "~2.5 GB",
    sizeBytes: 2_500_000_000,
    ramRequiredGb: 4,
    quantization: "Q4_K_M",
    format: "gguf",
    downloadUrl:
      "https://huggingface.co/unsloth/gemma-3-4b-it-GGUF/resolve/main/gemma-3-4b-it-Q4_K_M.gguf",
    badges: ["GGUF", "Balanced"],
  },
];

export function findModel(id: string): ModelVariant | undefined {
  return GEMMA_MODELS.find((m) => m.id === id);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
