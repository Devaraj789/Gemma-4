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
  // ✅ NEW
  ramWarning?: boolean;
  capabilities?: ("chat" | "coding" | "vision" | "tamil" | "uncensored")[];
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
    capabilities: ["chat"],
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
    ramWarning: true,
    capabilities: ["chat"],
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
    capabilities: ["chat"],
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
    capabilities: ["chat"],
  },
  // ✅ NEW — Coding Models
  {
    id: "qwen2.5-coder-1.5b-q4",
    name: "Qwen2.5 Coder 1.5B",
    shortName: "Qwen Coder 1.5B",
    description:
      "Specialized coding model. Supports 92 languages. Fast on low-RAM phones. Great for code generation and debugging.",
    sizeLabel: "~1 GB",
    sizeBytes: 1_000_000_000,
    ramRequiredGb: 2,
    quantization: "Q4_K_M",
    format: "gguf",
    downloadUrl:
      "https://huggingface.co/Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF/resolve/main/qwen2.5-coder-1.5b-instruct-q4_k_m.gguf",
    badges: ["GGUF", "Coding", "Q4_K_M"],
    recommended: false,
    capabilities: ["coding"],
  },
  {
    id: "deepseek-coder-1.3b-q4",
    name: "DeepSeek Coder 1.3B",
    shortName: "DeepSeek Coder",
    description:
      "Lightweight coding model trained on 2T tokens of code. Excellent for code completion and generation.",
    sizeLabel: "~800 MB",
    sizeBytes: 800_000_000,
    ramRequiredGb: 2,
    quantization: "Q4_K_M",
    format: "gguf",
    downloadUrl:
      "https://huggingface.co/TheBloke/deepseek-coder-1.3b-instruct-GGUF/resolve/main/deepseek-coder-1.3b-instruct.Q4_K_M.gguf",
    badges: ["GGUF", "Coding", "Q4_K_M"],
    capabilities: ["coding"],
  },
  // ✅ NEW — Uncensored Model
  {
    id: "llama-3.2-1b-uncensored-q4",
    name: "Llama 3.2 1B Uncensored",
    shortName: "Llama 3.2 Uncensored",
    description:
      "Uncensored variant of Llama 3.2 1B. No content filters. Use responsibly.",
    sizeLabel: "~800 MB",
    sizeBytes: 800_000_000,
    ramRequiredGb: 2,
    quantization: "Q4_K_M",
    format: "gguf",
    downloadUrl:
      "https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-uncensored-GGUF/resolve/main/Llama-3.2-1B-Instruct-uncensored-Q4_K_M.gguf",
    badges: ["GGUF", "Uncensored", "Q4_K_M"],
    capabilities: ["chat", "uncensored"],
  },
];

export function findModel(id: string): ModelVariant | undefined {
  return GEMMA_MODELS.find((m) => m.id === id);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// ✅ RAM-based recommendation
export function getRecommendedModel(ramGb: number): ModelVariant {
  if (ramGb <= 2) return GEMMA_MODELS.find((m) => m.id === "gemma-3-1b-it-q4")!;
  if (ramGb <= 3) return GEMMA_MODELS.find((m) => m.id === "gemma-3-4b-it-q4")!;
  return GEMMA_MODELS.find((m) => m.id === "gemma-3n-e2b-it-q4")!;
}