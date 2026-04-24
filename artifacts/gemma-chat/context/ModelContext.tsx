import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { GEMMA_MODELS, type ModelVariant } from "@/lib/models";
import { StorageKeys, loadJSON, saveJSON } from "@/lib/storage";

export type DownloadStatus = "idle" | "downloading" | "ready" | "error";

export type DownloadState = {
  modelId: string;
  status: DownloadStatus;
  progress: number; // 0..1
  errorMessage?: string;
};

type ModelContextValue = {
  models: ModelVariant[];
  downloadedIds: string[];
  activeModelId: string | null;
  activeModel: ModelVariant | null;
  downloadState: Record<string, DownloadState>;
  startDownload: (id: string) => void;
  cancelDownload: (id: string) => void;
  deleteModel: (id: string) => void;
  setActiveModel: (id: string | null) => void;
  ready: boolean;
};

const ModelContext = createContext<ModelContextValue | null>(null);

const SIMULATED_DOWNLOAD_MS = 14000;

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);
  const [activeModelId, setActiveModelIdState] = useState<string | null>(null);
  const [downloadState, setDownloadState] = useState<Record<string, DownloadState>>({});
  const [ready, setReady] = useState<boolean>(false);
  const [timers, setTimers] = useState<Record<string, ReturnType<typeof setInterval>>>({});

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const ids = await loadJSON<string[]>(StorageKeys.DOWNLOADED_MODELS, []);
      const active = await loadJSON<string | null>(StorageKeys.ACTIVE_MODEL, null);
      if (!mounted) return;
      setDownloadedIds(ids);
      setActiveModelIdState(active);
      const initial: Record<string, DownloadState> = {};
      ids.forEach((id) => {
        initial[id] = { modelId: id, status: "ready", progress: 1 };
      });
      setDownloadState(initial);
      setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const persistDownloaded = useCallback((ids: string[]) => {
    setDownloadedIds(ids);
    void saveJSON(StorageKeys.DOWNLOADED_MODELS, ids);
  }, []);

  const setActiveModel = useCallback((id: string | null) => {
    setActiveModelIdState(id);
    void saveJSON(StorageKeys.ACTIVE_MODEL, id);
  }, []);

  const cancelDownload = useCallback(
    (id: string) => {
      setTimers((prev) => {
        const t = prev[id];
        if (t) clearInterval(t);
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setDownloadState((prev) => ({
        ...prev,
        [id]: { modelId: id, status: "idle", progress: 0 },
      }));
    },
    [],
  );

  const startDownload = useCallback(
    (id: string) => {
      if (downloadedIds.includes(id)) return;
      if (downloadState[id]?.status === "downloading") return;

      setDownloadState((prev) => ({
        ...prev,
        [id]: { modelId: id, status: "downloading", progress: 0 },
      }));

      const startedAt = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startedAt;
        const progress = Math.min(1, elapsed / SIMULATED_DOWNLOAD_MS);
        setDownloadState((prev) => ({
          ...prev,
          [id]: { modelId: id, status: "downloading", progress },
        }));
        if (progress >= 1) {
          clearInterval(interval);
          setTimers((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
          setDownloadState((prev) => ({
            ...prev,
            [id]: { modelId: id, status: "ready", progress: 1 },
          }));
          setDownloadedIds((prev) => {
            if (prev.includes(id)) return prev;
            const next = [...prev, id];
            void saveJSON(StorageKeys.DOWNLOADED_MODELS, next);
            return next;
          });
          // auto-activate if no active model
          setActiveModelIdState((curr) => {
            if (curr) return curr;
            void saveJSON(StorageKeys.ACTIVE_MODEL, id);
            return id;
          });
        }
      }, 200);

      setTimers((prev) => ({ ...prev, [id]: interval }));
    },
    [downloadedIds, downloadState],
  );

  const deleteModel = useCallback(
    (id: string) => {
      const next = downloadedIds.filter((m) => m !== id);
      persistDownloaded(next);
      setDownloadState((prev) => ({
        ...prev,
        [id]: { modelId: id, status: "idle", progress: 0 },
      }));
      if (activeModelId === id) {
        setActiveModel(next[0] ?? null);
      }
    },
    [downloadedIds, activeModelId, persistDownloaded, setActiveModel],
  );

  useEffect(() => {
    return () => {
      Object.values(timers).forEach((t) => clearInterval(t));
    };
  }, [timers]);

  const activeModel = useMemo(
    () => GEMMA_MODELS.find((m) => m.id === activeModelId) ?? null,
    [activeModelId],
  );

  return (
    <ModelContext.Provider
      value={{
        models: GEMMA_MODELS,
        downloadedIds,
        activeModelId,
        activeModel,
        downloadState,
        startDownload,
        cancelDownload,
        deleteModel,
        setActiveModel,
        ready,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
}

export function useModels(): ModelContextValue {
  const ctx = useContext(ModelContext);
  if (!ctx) {
    throw new Error("useModels must be used inside ModelProvider");
  }
  return ctx;
}
