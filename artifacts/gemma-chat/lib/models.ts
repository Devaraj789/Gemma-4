export type Capability = "chat" | "coding" | "vision" | "tamil" | "uncensored" | "reasoning" | "tool_use" | "instruct" | "multilingual";


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
  mmprojUrl?: string;
  mmprojSizeBytes?: number;
  badges: string[];
  recommended?: boolean;
  ramWarning?: boolean;
  capabilities?: Capability[];
};


export const GEMMA_MODELS: ModelVariant[] = [
  // ─── Google Gemma 3 Series ───────────────────────────────────────────────
  {
    id: "gemma-3-270m-it-q4",
    name: "Gemma 3 270M Instruct",
    shortName: "Gemma 3 270M",
    description: "Ultra-tiny Gemma 3. Runs on any device with minimal RAM. Best for simple Q&A on very low-end phones.",
    sizeLabel: "~200 MB",
    sizeBytes: 200_000_000,
    ramRequiredGb: 1,
    quantization: "Q4_K_M",
    format: "gguf",
    downloadUrl: "https://huggingface.co/bartowski/google_gemma-3-270m-it-GGUF/resolve/main/google_gemma-3-270m-it-Q4_K_M.gguf",
    badges: ["GGUF", "Tiny", "Q4_K_M"],
    capabilities: ["chat"],
  },
  {
    id: "gemma-3-1b-it-q4",
    name: "Gemma 3 1B Instruct",
    shortName: "Gemma 3 1B",
    description: "Smallest Gemma 3 variant. Runs on almost any modern phone. Great for quick prompts and low-RAM devices.",
    sizeLabel: "~720 MB",
    sizeBytes: 720_000_000,
    ramRequiredGb: 2,
    quantization: "Q4_K_M",
    format: "gguf",
    downloadUrl: "https://huggingface.co/unsloth/gemma-3-1b-it-GGUF/resolve/main/gemma-3-1b-it-Q4_K_M.gguf",
    badges: ["GGUF", "Tiny"],
    capabilities: ["chat"],
  },
  {
    id: "gemma-3-4b-it-q4",
    name: "Gemma 3 4B Instruct",
    shortName: "Gemma 3 4B",
    description: "A balanced mid-size model. Good answer quality with reasonable size for most modern Android phones.",
    sizeLabel: "~2.5 GB",
    sizeBytes: 2_500_000_000,
    ramRequiredGb: 4,
    quantization: "Q4_K_M",
    format: "gguf",
    downloadUrl: "https://huggingface.co/unsloth/gemma-3-4b-it-GGUF/resolve/main/gemma-3-4b-it-Q4_K_M.gguf",
    badges: ["GGUF", "Balanced"],
    capabilities: ["chat"],
  },
  // ─── Google Gemma 3n Series ──────────────────────────────────────────────
  {
    id: "gemma-3n-e2b-it-q4",
    name: "Gemma 3n E2B Instruct",
    shortName: "Gemma 3n E2B",
    description: "Lightweight on-device chat model. Faster responses, perfect for everyday conversations and coding questions.",
    sizeLabel: "~3.1 GB",
    sizeBytes: 3_100_000_000,
    ramRequiredGb: 4,
    quantization: "Q4_K_M",
    format: "gguf",
    downloadUrl: "https://huggingface.co/unsloth/gemma-3n-E2B-it-GGUF/resolve/main/gemma-3n-E2B-it-Q4_K_M.gguf",
    badges: ["GGUF", "Chat", "Q4_K_M"],
    recommended: true,
    capabilities: ["chat"],
  },
  {
    id: "gemma-3n-e4b-it-q4",
    name: "Gemma 3n E4B Instruct",
    shortName: "Gemma 3n E4B",
    description: "Stronger reasoning and longer answers. Larger model size with slower first load but more complete responses.",
    sizeLabel: "~4.9 GB",
    sizeBytes: 4_900_000_000,
    ramRequiredGb: 6,
    quantization: "Q4_K_M",
    format: "gguf",
    downloadUrl: "https://huggingface.co/unsloth/gemma-3n-E4B-it-GGUF/resolve/main/gemma-3n-E4B-it-Q4_K_M.gguf",
    badges: ["GGUF", "Chat", "Q4_K_M"],
    ramWarning: true,
    capabilities: ["chat"],
  },
  // ─── Qwen 2.5 VL (Vision Language) ──────────────────────────────────────
  {
    id: "qwen2.5-vl-3b-q4",
    name: "Qwen 2.5 VL 3B Instruct",
    shortName: "Qwen 2.5 VL 3B",
    description: "Vision-language model. Can understand images and answer questions about them. Balanced size.",
    sizeLabel: "~1.93 GB",
    sizeBytes: 2_000_000_000,
    ramRequiredGb: 4,
    quantization: "Q4_K_M",
    format: "gguf",
    downloadUrl: "https://huggingface.co/unsloth/Qwen2.5-VL-3B-Instruct-GGUF/resolve/main/Qwen2.5-VL-3B-Instruct-Q4_K_M.gguf",
    mmprojUrl: "https://huggingface.co/unsloth/Qwen2.5-VL-3B-Instruct-GGUF/resolve/main/mmproj-F16.gguf",
    mmprojSizeBytes: 800_000_000,
    badges: ["GGUF", "Vision", "Q4_K_M"],
    capabilities: ["chat", "vision", "tool_use"],
  },
  // ─── Qwen 3 VL (Vision Language) ─────────────────────────────────────────
  {
    id: "qwen3-vl-2b-q4",
    name: "Qwen 3 VL 2B Instruct",
    shortName: "Qwen 3 VL 2B",
    description: "Latest Qwen 3 vision model. See and analyze images, screenshots, charts. Compact size with strong vision.",
    sizeLabel: "~1.11 GB",
    sizeBytes: 1_191_182_336,
    ramRequiredGb: 3,
    quantization: "Q4_K_M",
    format: "gguf",
    downloadUrl: "https://huggingface.co/Qwen/Qwen3-VL-2B-Instruct-GGUF/resolve/main/Qwen3VL-2B-Instruct-Q4_K_M.gguf",
    mmprojUrl: "https://huggingface.co/Qwen/Qwen3-VL-2B-Instruct-GGUF/resolve/main/mmproj-Qwen3VL-2B-Instruct-F16.gguf",
    mmprojSizeBytes: 400_000_000,
    badges: ["GGUF", "Vision", "NEW"],
    capabilities: ["chat", "vision", "tool_use", "reasoning"],
  },
  {
    id: "qwen3-vl-4b-q4",
    name: "Qwen 3 VL 4B Instruct",
    shortName: "Qwen 3 VL 4B",
    description: "Mid-size Qwen 3 vision model. Stronger image reasoning, better at text extraction and visual QA.",
    sizeLabel: "~2.5 GB",
    sizeBytes: 2_684_354_560,
    ramRequiredGb: 4,
    quantization: "Q4_K_M",
    format: "gguf",
    downloadUrl: "https://huggingface.co/Qwen/Qwen3-VL-4B-Instruct-GGUF/resolve/main/Qwen3VL-4B-Instruct-Q4_K_M.gguf",
    mmprojUrl: "https://huggingface.co/Qwen/Qwen3-VL-4B-Instruct-GGUF/resolve/main/mmproj-Qwen3VL-4B-Instruct-F16.gguf",
    mmprojSizeBytes: 800_000_000,
    badges: ["GGUF", "Vision", "NEW"],
    capabilities: ["chat", "vision", "tool_use", "reasoning"],
  },
  // ─── Qwen 3.5 Series ─────────────────────────────────────────────────────
  {
    id: "qwen3.5-2b-q4",
    name: "Qwen 3.5 2B Instruct",
    shortName: "Qwen 3.5 2B",
    description: "Compact Qwen 3.5 with improved long-context and better instruction following. Great for low-RAM phones.",
    sizeLabel: "~1.33 GB",
    sizeBytes: 1_428_799_488,
    ramRequiredGb: 3,
    quantization: "Q4_K_M",
    format: "gguf",
    downloadUrl: "https://huggingface.co/unsloth/Qwen3.5-2B-MTP-GGUF/resolve/main/Qwen3.5-2B-Q4_K_M.gguf",
    badges: ["GGUF", "NEW", "Q4_K_M"],
    capabilities: ["chat", "reasoning", "tool_use"],
  },
  // ─── Mistral / Ministral ─────────────────────────────────────────────────
  {
    id: "ministral-3b-q4",
    name: "Ministral 3 3B Instruct",
    shortName: "Ministral 3 3B",
    description: "Mistral's compact 3B model with strong tool use. Multilingual, fast inference, good for assistant tasks.",
    sizeLabel: "~2.15 GB",
    sizeBytes: 2_308_672_512,
    ramRequiredGb: 4,
    quantization: "Q4_K_M",
    format: "gguf",
    downloadUrl: "https://huggingface.co/mistralai/Ministral-3-3B-Instruct-2512-GGUF/resolve/main/Ministral-3-3B-Instruct-2512-Q4_K_M.gguf",
    badges: ["GGUF", "Tool Use", "Q4_K_M"],
    capabilities: ["chat", "tool_use"],
  },
  {
    id: "ministral-3b-reasoning-q4",
    name: "Ministral 3 3B Reasoning",
    shortName: "Ministral 3B Reason",
    description: "Reasoning-focused Ministral 3B. Chain-of-thought thinking for math, logic, and analysis tasks.",
    sizeLabel: "~2.0 GB",
    sizeBytes: 2_000_000_000,
    ramRequiredGb: 4,
    quantization: "Q4_K_M",
    format: "gguf",
    downloadUrl: "https://huggingface.co/bartowski/Ministral-3B-reasoning-GGUF/resolve/main/Ministral-3B-reasoning-Q4_K_M.gguf",
    badges: ["GGUF", "Reasoning", "Q4_K_M"],
    capabilities: ["chat", "reasoning"],
  },
  // ─── Microsoft Phi-4 Series ───────────────────────────────────────────────
  {
    id: "phi-4-mini-reasoning-q4",
    name: "Phi-4 Mini Reasoning",
    shortName: "Phi-4 Mini Reason",
    description: "Microsoft's compact reasoning model. Excellent math and science. Small footprint, strong performance.",
    sizeLabel: "~2.49 GB",
    sizeBytes: 2_673_868_390,
    ramRequiredGb: 4,
    quantization: "Q4_K_M",
    format: "gguf",
    downloadUrl: "https://huggingface.co/unsloth/Phi-4-mini-reasoning-GGUF/resolve/main/Phi-4-mini-reasoning-Q4_K_M.gguf",
    badges: ["GGUF", "Reasoning", "Microsoft"],
    capabilities: ["chat", "reasoning", "coding"],
  },
  {
    id: "phi-4-mini-reasoning-q5",
    name: "Phi-4 Mini Reasoning",
    shortName: "Phi-4 Mini Reason",
    description: "Microsoft's compact reasoning model. Excellent math and science. Small footprint, strong performance.",
    sizeLabel: "~2.85 GB",
    sizeBytes: 3_060_963_328,
    ramRequiredGb: 4,
    quantization: "Q5_K_M",
    format: "gguf",
    downloadUrl: "https://huggingface.co/unsloth/Phi-4-mini-reasoning-GGUF/resolve/main/Phi-4-mini-reasoning-Q5_K_M.gguf",
    badges: ["GGUF", "Reasoning", "Microsoft"],
    capabilities: ["chat", "reasoning", "coding"],
  },
  // ─── Coding Models ────────────────────────────────────────────────────────
  {
    id: "qwen2.5-coder-1.5b-q4",
    name: "Qwen2.5 Coder 1.5B",
    shortName: "Qwen Coder 1.5B",
    description: "Specialized coding model. Supports 92 languages. Fast on low-RAM phones. Great for code generation and debugging.",
    sizeLabel: "~1 GB",
    sizeBytes: 1_000_000_000,
    ramRequiredGb: 2,
    quantization: "Q4_K_M",
    format: "gguf",
    downloadUrl: "https://huggingface.co/Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF/resolve/main/qwen2.5-coder-1.5b-instruct-q4_k_m.gguf",
    badges: ["GGUF", "Coding", "Q4_K_M"],
    capabilities: ["coding", "tool_use"],
  },
  {
    id: "deepseek-coder-1.3b-q4",
    name: "DeepSeek Coder 1.3B",
    shortName: "DeepSeek Coder",
    description: "Lightweight coding model trained on 2T tokens of code. Excellent for code completion and generation.",
    sizeLabel: "~833 MB",
    sizeBytes: 800_000_000,
    ramRequiredGb: 2,
    quantization: "Q4_K_M",
    format: "gguf",
    downloadUrl: "https://huggingface.co/TheBloke/deepseek-coder-1.3b-instruct-GGUF/resolve/main/deepseek-coder-1.3b-instruct.Q4_K_M.gguf",
    badges: ["GGUF", "Coding", "Q4_K_M"],
    capabilities: ["coding"],
  },
  // ─── Instruct ───────────────────────────────────────────────────────────
  {
    id: "llama-3.2-1b-instruct-q4",
    name: "Llama 3.2 1B Instruct",
    shortName: "Llama 3.2 1B",
    description: "Meta's lightweight 1B parameter instruction-following model. Supports 128K context, multilingual (EN, DE, FR, IT, PT+), optimized for fast inference on low-resource devices.",
    sizeLabel: "~808 MB",
    sizeBytes: 847_249_408,
    ramRequiredGb: 2,
    quantization: "Q4_K_M",
    format: "gguf",
    downloadUrl: "https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf",
    badges: ["GGUF", "Instruct", "Q4_K_M"],
    capabilities: ["chat", "multilingual"],
  },
  // ─── Instruct ───────────────────────────────────────────────────────────
  {
    id: "llama-3.2-3b-instruct-q4",
    name: "Llama 3.2 3B Instruct",
    shortName: "Llama 3.2 3B",
    description: "Meta's 3B parameter instruction-following model with better reasoning than 1B. Supports 128K context, multilingual (EN, DE, FR, IT, PT+), optimized for fast inference on mobile devices.",
    sizeLabel: "~2.0 GB",
    sizeBytes: 2_147_483_648,
    ramRequiredGb: 3,
    quantization: "Q4_K_M",
    format: "gguf",
    downloadUrl: "https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf",
    badges: ["GGUF", "Instruct", "Q4_K_M"],
    capabilities: ["chat", "multilingual", "reasoning"],
  },
  // ─── OpenBMB MiniCPM-V Vision Series ─────────────────────────────────────
  {
    id: "minicpm-v-4-6-q4",
    name: "MiniCPM-V 4.6",
    shortName: "MiniCPM-V 4.6",
    description: "OpenBMB's ultra-efficient 1.3B multimodal vision-language model. Supports image captioning, OCR, visual QA, video understanding. Mobile-optimized with Q4_K_M quantization.",
    sizeLabel: "~1.6 GB",
    sizeBytes: 1_717_986_918,
    ramRequiredGb: 2,
    quantization: "Q4_K_M",
    format: "gguf",
    downloadUrl: "https://huggingface.co/openbmb/MiniCPM-V-4.6-gguf/resolve/main/MiniCPM-V-4.6-Q4_K_M.gguf",
    mmprojUrl: "https://huggingface.co/openbmb/MiniCPM-V-4.6-gguf/resolve/main/mmproj-MiniCPM-V-4.6-F16.gguf",
    mmprojSizeBytes: 400_000_000,
    badges: ["GGUF", "Vision", "Multimodal", "Q4_K_M", "OCR", "NEW"],
    recommended: true,
    capabilities: ["chat", "vision", "tamil", "multilingual", "tool_use", "reasoning"],
  },
  // ─── Uncensored ───────────────────────────────────────────────────────────
  {
    id: "felldude-uncensored-ministral3-3b-q4",
    name: "Felldude Uncensored Ministral3 3B",
    shortName: "Felldude Uncensored 3B",
    description: "Uncensored merge of Ministral 3 3B Instruct. No content filters. Based on Mistral architecture. Use responsibly.",
    sizeLabel: "~2.15 GB",
    sizeBytes: 2_308_672_512,
    ramRequiredGb: 4,
    quantization: "Q4_K_M",
    format: "gguf",
    downloadUrl: "https://huggingface.co/mradermacher/Felldude-Uncensored-Ministral3-3B-bf16-i1-GGUF/resolve/main/Felldude-Uncensored-Ministral3-3B-bf16.i1-Q4_K_M.gguf",
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
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}


export function getRecommendedModel(ramGb: number): ModelVariant {
  if (ramGb <= 2) return GEMMA_MODELS.find((m) => m.id === "gemma-3-1b-it-q4")!;
  if (ramGb <= 3) return GEMMA_MODELS.find((m) => m.id === "gemma-3-4b-it-q4")!;
  return GEMMA_MODELS.find((m) => m.id === "gemma-3n-e2b-it-q4")!;
}