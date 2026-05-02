import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { generate } from "@/lib/inference";
import { StorageKeys, loadJSON, saveJSON } from "@/lib/storage";
import { uuid } from "@/lib/uuid";

import { useSettings } from "./SettingsContext";

export type MessageStats = {
  tokensPerSec: number;
  totalTokens: number;
  loadTimeMs?: number;
};

export type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
  stats?: MessageStats;
};

export type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  modelId?: string;
};

type ChatContextValue = {
  conversations: Conversation[];
  active: Conversation | null;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  newConversation: () => string;
  deleteConversation: (id: string) => void;
  clearAll: () => void;
  sendMessage: (text: string, modelId: string | null) => Promise<void>;
  stopGeneration: () => void;
  isGenerating: boolean;
  generatingStats: MessageStats | null;
  ready: boolean;
};

const ChatContext = createContext<ChatContextValue | null>(null);

function inferTitle(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 40) return trimmed || "New chat";
  return `${trimmed.slice(0, 40)}…`;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveIdState] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatingStats, setGeneratingStats] = useState<MessageStats | null>(null);
  const [ready, setReady] = useState<boolean>(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const stored = await loadJSON<Conversation[]>(StorageKeys.CONVERSATIONS, []);
      const storedActive = await loadJSON<string | null>(
        StorageKeys.ACTIVE_CONVERSATION,
        null,
      );
      if (!mounted) return;
      setConversations(stored);
      setActiveIdState(storedActive);
      setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const persist = useCallback((next: Conversation[]) => {
    setConversations(next);
    void saveJSON(StorageKeys.CONVERSATIONS, next);
  }, []);

  const setActiveId = useCallback((id: string | null) => {
    setActiveIdState(id);
    void saveJSON(StorageKeys.ACTIVE_CONVERSATION, id);
  }, []);

  const newConversation = useCallback((): string => {
    const id = uuid();
    const conv: Conversation = {
      id,
      title: "New chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations((prev) => {
      const next = [conv, ...prev];
      void saveJSON(StorageKeys.CONVERSATIONS, next);
      return next;
    });
    setActiveId(id);
    return id;
  }, [setActiveId]);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const next = prev.filter((c) => c.id !== id);
        void saveJSON(StorageKeys.CONVERSATIONS, next);
        if (activeId === id) {
          setActiveId(next[0]?.id ?? null);
        }
        return next;
      });
    },
    [activeId, setActiveId],
  );

  const clearAll = useCallback(() => {
    persist([]);
    setActiveId(null);
  }, [persist, setActiveId]);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsGenerating(false);
    setGeneratingStats(null);
  }, []);

  const sendMessage = useCallback(
    async (text: string, modelId: string | null) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      let convId = activeId;
      let isNewConv = false;
      if (!convId) {
        convId = uuid();
        isNewConv = true;
      }

      const userMsg: Message = {
        id: uuid(),
        role: "user",
        content: trimmed,
        createdAt: Date.now(),
      };

      const placeholder: Message = {
        id: uuid(),
        role: "assistant",
        content: "",
        createdAt: Date.now(),
      };

      setConversations((prev) => {
        let next: Conversation[];
        if (isNewConv) {
          const conv: Conversation = {
            id: convId!,
            title: inferTitle(trimmed),
            messages: [userMsg, placeholder],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            modelId: modelId ?? undefined,
          };
          next = [conv, ...prev];
        } else {
          next = prev.map((c) => {
            if (c.id !== convId) return c;
            return {
              ...c,
              messages: [...c.messages, userMsg, placeholder],
              updatedAt: Date.now(),
              title: c.messages.length === 0 ? inferTitle(trimmed) : c.title,
              modelId: c.modelId ?? modelId ?? undefined,
            };
          });
        }
        void saveJSON(StorageKeys.CONVERSATIONS, next);
        return next;
      });

      if (isNewConv) setActiveId(convId);

      setIsGenerating(true);
      setGeneratingStats(null);
      const controller = new AbortController();
      abortRef.current = controller;

      const updateAssistant = (content: string, stats?: MessageStats) => {
        setConversations((prev) => {
          const next = prev.map((c) => {
            if (c.id !== convId) return c;
            const msgs = c.messages.map((m) =>
              m.id === placeholder.id ? { ...m, content, stats } : m,
            );
            return { ...c, messages: msgs, updatedAt: Date.now() };
          });
          return next;
        });
      };

      try {
        const baseConv = isNewConv
          ? { messages: [userMsg] as Message[] }
          : conversations.find((c) => c.id === convId);
        const history = baseConv?.messages ?? [userMsg];
        const messagesForEngine: Message[] = isNewConv
          ? [userMsg]
          : [...history, userMsg];

        let assembled = "";
        let liveStats: MessageStats = { tokensPerSec: 0, totalTokens: 0 };

        await generate({
          messages: messagesForEngine,
          settings,
          signal: controller.signal,
          onToken: (chunk) => {
            if (chunk.done) return;
            assembled += chunk.token;
            updateAssistant(assembled, liveStats);
          },
          onStats: (s) => {
            liveStats = { tokensPerSec: s.tokensPerSec, totalTokens: s.totalTokens };
            setGeneratingStats(liveStats);
          },
        });

        setConversations((prev) => {
          void saveJSON(StorageKeys.CONVERSATIONS, prev);
          return prev;
        });
      } catch (err) {
        const errorText =
          err instanceof Error
            ? `Generation failed: ${err.message}`
            : "Generation failed.";
        updateAssistant(errorText);
      } finally {
        abortRef.current = null;
        setIsGenerating(false);
        setGeneratingStats(null);
      }
    },
    [activeId, conversations, settings, setActiveId],
  );

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  return (
    <ChatContext.Provider
      value={{
        conversations,
        active,
        activeId,
        setActiveId,
        newConversation,
        deleteConversation,
        clearAll,
        sendMessage,
        stopGeneration,
        isGenerating,
        generatingStats,
        ready,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChat must be used inside ChatProvider");
  }
  return ctx;
}
