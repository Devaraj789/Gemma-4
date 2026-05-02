import type { Capability } from "@/lib/models";

export type PromptSuggestion = {
  label: string;
  prompt: string;
  icon: string;
};

export type CapabilityGroup = {
  capability: Capability;
  title: string;
  color: string;
  featherIcon: string;
  suggestions: PromptSuggestion[];
};

export const CAPABILITY_PROMPT_GROUPS: Record<Capability, CapabilityGroup> = {
  vision: {
    capability: "vision",
    title: "Vision & Image Understanding",
    color: "#f59e0b",
    featherIcon: "eye",
    suggestions: [
      { icon: "🖼️", label: "Describe an image",         prompt: "Describe what you see in this image in detail." },
      { icon: "📄", label: "Extract text (OCR)",         prompt: "Extract and list all the text visible in this image." },
      { icon: "📊", label: "Explain a chart",            prompt: "Look at this chart or graph and explain the key insights." },
      { icon: "📸", label: "What's in this photo?",      prompt: "What objects, people, or scenes are in this photo?" },
      { icon: "📝", label: "Summarize a document scan",  prompt: "Summarize the main points from this scanned document." },
      { icon: "🔍", label: "Compare two images",         prompt: "What are the differences between these two images?" },
    ],
  },
  reasoning: {
    capability: "reasoning",
    title: "Reasoning & Problem Solving",
    color: "#a855f7",
    featherIcon: "cpu",
    suggestions: [
      { icon: "🧮", label: "Solve a math problem",       prompt: "Solve this step by step and show all your working:\n\n" },
      { icon: "🧩", label: "Logic puzzle",               prompt: "Solve this logic puzzle step by step:\n\n" },
      { icon: "🔬", label: "Explain a concept",          prompt: "Explain how [concept] works with clear reasoning steps." },
      { icon: "⚖️", label: "Pros and cons analysis",     prompt: "Analyze the pros and cons of [topic] with detailed reasoning." },
      { icon: "🎯", label: "Break down a problem",       prompt: "Break down this complex problem into smaller steps:\n\n" },
      { icon: "📐", label: "Physics / science question", prompt: "Solve this step by step showing all formulas:\n\n" },
    ],
  },
  tool_use: {
    capability: "tool_use",
    title: "Tool Use & Function Calling",
    color: "#06b6d4",
    featherIcon: "tool",
    suggestions: [
      { icon: "📋", label: "Format as JSON",             prompt: "Convert this data into a clean JSON format:\n\n" },
      { icon: "🗓️", label: "Plan a task list",           prompt: "Create a structured task plan with JSON output for: " },
      { icon: "🔧", label: "Call a function",            prompt: "Describe what function you would call to accomplish: " },
      { icon: "📊", label: "Data extraction",            prompt: "Extract and structure this data into a table format:\n\n" },
      { icon: "🤖", label: "API usage example",          prompt: "Show me how to call an API to achieve: " },
      { icon: "🔄", label: "Workflow automation",        prompt: "Design a step-by-step automation workflow for: " },
    ],
  },
  coding: {
    capability: "coding",
    title: "Code & Programming",
    color: "#3b82f6",
    featherIcon: "code",
    suggestions: [
      { icon: "✍️", label: "Write a function",           prompt: "Write a Python function that:\n\n" },
      { icon: "🐛", label: "Debug this code",            prompt: "Find and fix the bug in this code:\n\n```\n\n```" },
      { icon: "💡", label: "Explain code",               prompt: "Explain what this code does line by line:\n\n```\n\n```" },
      { icon: "🔄", label: "Convert language",           prompt: "Convert this JavaScript code to TypeScript:\n\n```\n\n```" },
      { icon: "⚡", label: "Optimize for speed",         prompt: "Optimize this code for better performance:\n\n```\n\n```" },
      { icon: "🧪", label: "Write unit tests",           prompt: "Write unit tests for this function:\n\n```\n\n```" },
    ],
  },
  chat: {
    capability: "chat",
    title: "Everyday Chat",
    color: "#22c55e",
    featherIcon: "message-circle",
    suggestions: [
      { icon: "📖", label: "Tell me a story",            prompt: "Tell me an engaging short story about: " },
      { icon: "🎓", label: "Explain simply",             prompt: "Explain [topic] in simple words as if I'm a beginner." },
      { icon: "📝", label: "Summarize this",             prompt: "Summarize the following text in 3-5 bullet points:\n\n" },
      { icon: "💬", label: "Give me 5 tips",             prompt: "Give me 5 practical tips on how to improve: " },
      { icon: "🌍", label: "Translate text",             prompt: "Translate the following to English:\n\n" },
      { icon: "📚", label: "Recommend something",        prompt: "Recommend the best [books/movies/tools] for someone interested in: " },
    ],
  },
  tamil: {
    capability: "tamil",
    title: "Tamil Language",
    color: "#f97316",
    featherIcon: "globe",
    suggestions: [
      { icon: "🗣️", label: "Tamil la pesungal",          prompt: "Naan Tamil la pesuren. Neenga enna topic patri solanum nu kelu." },
      { icon: "✍️", label: "Tamil la ezhuthungal",       prompt: "Intha topicai Tamil la vizha vivarikka: " },
      { icon: "📖", label: "Tamil kavithai",             prompt: "Oru azhagana Tamil kavithai ezhuthungal patrhi: " },
      { icon: "🎓", label: "Tamil la explain pannungal", prompt: "Intha conceptai Tamil la simple ah explain pannungal: " },
      { icon: "🤔", label: "Tanglish la pesalam",        prompt: "Naan Tanglish la pesuren, neenga purinjukkuveergala? Enna question kekkanum: " },
      { icon: "🌟", label: "Tamil story",                prompt: "Oru siriya Tamil kadai sollungal patrhi: " },
    ],
  },
  uncensored: {
    capability: "uncensored",
    title: "Uncensored Mode",
    color: "#ef4444",
    featherIcon: "unlock",
    suggestions: [
      { icon: "🔓", label: "No-filter question",         prompt: "Answer this without content filters: " },
      { icon: "📰", label: "Controversial topic",        prompt: "Give an unfiltered balanced view on: " },
      { icon: "🎭", label: "Dark fiction writing",       prompt: "Write a dark creative fiction story about: " },
      { icon: "💊", label: "Sensitive info",             prompt: "Explain the facts about [sensitive topic] objectively: " },
    ],
  },
};

export function getSuggestionsForModel(capabilities: Capability[]): CapabilityGroup[] {
  return capabilities
    .filter((cap) => CAPABILITY_PROMPT_GROUPS[cap])
    .map((cap) => CAPABILITY_PROMPT_GROUPS[cap]);
}
