import * as FileSystem from "expo-file-system/legacy";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform, ToastAndroid } from "react-native";

import * as Llama from "@/lib/llama";
import { GEMMA_MODELS, type ModelVariant } from "@/lib/models";
import { StorageKeys, loadJSON, saveJSON } from "@/lib/storage";
import { uuid } from "@/lib/uuid";

export type DownloadStatus = "idle" | "downloading" | "ready" | "error" | "loading";

export type DownloadState = {
  modelId: string;
  status: DownloadStatus;
  progress: number;
  errorMessage?: string;
};

export type DownloadedModel = {
  id: string;
  localPath: string;
  downloadedAt: number;
};

type ModelContextValue = {
  models: ModelVariant[];
  downloadedIds: string[];
  downloadedModels: DownloadedModel[];
  activeModelId: string | null;
  activeModel: ModelVariant | null;
  activeModelLoaded: boolean;
  downloadState: Record<string, DownloadState>;
  downloadQueue: string[];
  addToQueue: (id: string) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  startQueue: () => void;
  startDownload: (id: string) => void;
  cancelDownload: (id: string) => void;
  deleteModel: (id: string) => void;
  setActiveModel: (id: string | null) => void;
  addCustomModel: (opts: { name: string; url: string }) => void;
  ready: boolean;
};

const ModelContext = createContext<ModelContextValue | null>(null);

const MODELS_DIR = (FileSystem.documentDirectory ?? "") + "models/";

async function ensureModelsDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(MODELS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(MODELS_DIR, { intermediates: true });
  }
}

function getLocalPath(model: ModelVariant): string {
  return MODELS_DIR + model.id + ".gguf";
}

const customModels: ModelVariant[] = [];

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [downloadedModels, setDownloadedModels] = useState<DownloadedModel[]>([]);
  const [activeModelId, setActiveModelIdState] = useState<string | null>(null);
  const [activeModelLoaded, setActiveModelLoaded] = useState<boolean>(false);
  const [downloadState, setDownloadState] = useState<Record<string, DownloadState>>({});
  const [allModels, setAllModels] = useState<ModelVariant[]>(GEMMA_MODELS);
  const [ready, setReady] = useState<boolean>(false);
  const [downloadQueue, setDownloadQueue] = useState<string[]>([]);
  const downloadsRef = useRef<Record<string, FileSystem.DownloadResumable | undefined>>({});
  const startDownloadRef = useRef<(id: string) => void>(() => {});

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try { await ensureModelsDir(); } catch { /* retry on first download */ }

      const saved = await loadJSON<DownloadedModel[] | string[]>(StorageKeys.DOWNLOADED_MODELS, []);
      let normalized: DownloadedModel[] = [];
      if (Array.isArray(saved) && saved.length > 0 && typeof saved[0] === "string") {
        normalized = (saved as string[])
          .map((id) => {
            const m = GEMMA_MODELS.find((x) => x.id === id);
            if (!m) return null;
            return { id, localPath: getLocalPath(m), downloadedAt: Date.now() };
          })
          .filter((x): x is DownloadedModel => x !== null);
      } else {
        normalized = saved as DownloadedModel[];
      }

      const verified: DownloadedModel[] = [];
      for (const dm of normalized) {
        try {
          const info = await FileSystem.getInfoAsync(dm.localPath);
          if (info.exists && (info.size ?? 0) > 1_000_000) verified.push(dm);
        } catch { /* skip */ }
      }

      const active = await loadJSON<string | null>(StorageKeys.ACTIVE_MODEL, null);
      if (!mounted) return;

      setDownloadedModels(verified);
      void saveJSON(StorageKeys.DOWNLOADED_MODELS, verified);
      const validActive = active && verified.find((m) => m.id === active) ? active : null;
      setActiveModelIdState(validActive);

      const initial: Record<string, DownloadState> = {};
      verified.forEach((dm) => {
        initial[dm.id] = { modelId: dm.id, status: "ready", progress: 1 };
      });
      setDownloadState(initial);
      setReady(true);

      if (validActive) {
        const dm = verified.find((m) => m.id === validActive);
        if (dm) {
          setDownloadState((prev) => ({ ...prev, [dm.id]: { modelId: dm.id, status: "loading", progress: 1 } }));
          try {
            await Llama.loadModel(dm.localPath);
            if (mounted) {
              setActiveModelLoaded(true);
              setDownloadState((prev) => ({ ...prev, [dm.id]: { modelId: dm.id, status: "ready", progress: 1 } }));
            }
          } catch (e) {
            const msg = e instanceof Error ? e.message : "Model load failed";
            if (mounted) {
              setDownloadState((prev) => ({ ...prev, [dm.id]: { modelId: dm.id, status: "error", progress: 1, errorMessage: msg } }));
            }
          }
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  const downloadedIds = useMemo(() => downloadedModels.map((d) => d.id), [downloadedModels]);

  useEffect(() => {
    if (downloadQueue.length === 0) return;
    const isAnyDownloading = Object.values(downloadState).some((d) => d.status === "downloading");
    if (isAnyDownloading) return;

    const nextId = downloadQueue[0];
    if (!nextId) return;

    if (downloadedIds.includes(nextId)) {
      setDownloadQueue((prev) => prev.slice(1));
      return;
    }

    setDownloadQueue((prev) => prev.slice(1));
    startDownloadRef.current(nextId);
  }, [downloadQueue, downloadState, downloadedIds]);

  const addToQueue = useCallback((id: string) => {
    setDownloadQueue((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setDownloadQueue((prev) => prev.filter((qid) => qid !== id));
  }, []);

  const clearQueue = useCallback(() => { setDownloadQueue([]); }, []);

  const startQueue = useCallback(() => { setDownloadQueue((prev) => [...prev]); }, []);

  const addCustomModel = useCallback((opts: { name: string; url: string }) => {
    const id = "custom-" + uuid().slice(0, 8);
    const custom: ModelVariant = {
      id, name: opts.name, shortName: opts.name,
      description: "Custom user-added model",
      sizeLabel: "Unknown", sizeBytes: 0, ramRequiredGb: 4,
      quantization: "GGUF", format: "gguf", downloadUrl: opts.url,
      badges: ["GGUF", "Custom"],
    };
    customModels.push(custom);
    setAllModels([...GEMMA_MODELS, ...customModels]);
    setDownloadState((prev) => ({ ...prev, [id]: { modelId: id, status: "idle", progress: 0 } }));
  }, []);

  const setActiveModel = useCallback(
    (id: string | null) => {
      setActiveModelIdState(id);
      void saveJSON(StorageKeys.ACTIVE_MODEL, id);
      if (id === null) {
        void Llama.unloadModel();
        setActiveModelLoaded(false);
        return;
      }
      const dm = downloadedModels.find((m) => m.id === id);
      if (!dm) return;
      setActiveModelLoaded(false);
      setDownloadState((prev) => ({ ...prev, [id]: { modelId: id, status: "loading", progress: 1 } }));
      void (async () => {
        try {
          await Llama.loadModel(dm.localPath);
          setActiveModelLoaded(true);
          setDownloadState((prev) => ({ ...prev, [id]: { modelId: id, status: "ready", progress: 1 } }));
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Failed to load model";
          setDownloadState((prev) => ({ ...prev, [id]: { modelId: id, status: "error", progress: 1, errorMessage: msg } }));
        }
      })();
    },
    [downloadedModels],
  );

  const cancelDownload = useCallback((id: string) => {
    const dl = downloadsRef.current[id];
    if (dl) { void dl.pauseAsync().catch(() => {}); downloadsRef.current[id] = undefined; }
    setDownloadState((prev) => ({ ...prev, [id]: { modelId: id, status: "idle", progress: 0 } }));
  }, []);

  const startDownload = useCallback(
    (id: string) => {
      const model = allModels.find((m) => m.id === id);
      if (!model) return;
      if (downloadedIds.includes(id)) return;
      if (downloadState[id]?.status === "downloading") return;

      setDownloadState((prev) => ({ ...prev, [id]: { modelId: id, status: "downloading", progress: 0 } }));

      void (async () => {
        try {
          await ensureModelsDir();
          const localPath = getLocalPath(model);
          const existing = await FileSystem.getInfoAsync(localPath);
          if (existing.exists) await FileSystem.deleteAsync(localPath, { idempotent: true });

          const dl = FileSystem.createDownloadResumable(
            model.downloadUrl,
            localPath,
            {},
            (data) => {
              if (data.totalBytesExpectedToWrite > 0) {
                const progress = data.totalBytesWritten / data.totalBytesExpectedToWrite;
                setDownloadState((prev) => ({ ...prev, [id]: { modelId: id, status: "downloading", progress } }));
              }
            },
          );
          downloadsRef.current[id] = dl;
          const result = await dl.downloadAsync();
          downloadsRef.current[id] = undefined;

          if (!result?.uri) throw new Error("Download did not return a file URI");

          const newEntry: DownloadedModel = { id, localPath: result.uri, downloadedAt: Date.now() };
          setDownloadedModels((prev) => {
            const next = [...prev.filter((m) => m.id !== id), newEntry];
            void saveJSON(StorageKeys.DOWNLOADED_MODELS, next);
            return next;
          });
          setDownloadState((prev) => ({ ...prev, [id]: { modelId: id, status: "ready", progress: 1 } }));

          // Feature 3: Download complete toast notification
          if (Platform.OS === "android") {
            ToastAndroid.show(`✅ ${model.shortName} downloaded!`, ToastAndroid.LONG);
          }

          setActiveModelIdState((curr) => {
            if (curr) return curr;
            void saveJSON(StorageKeys.ACTIVE_MODEL, id);
            setDownloadState((prev) => ({ ...prev, [id]: { modelId: id, status: "loading", progress: 1 } }));
            void Llama.loadModel(result.uri)
              .then(() => {
                setActiveModelLoaded(true);
                setDownloadState((prev) => ({ ...prev, [id]: { modelId: id, status: "ready", progress: 1 } }));
              })
              .catch((e) => {
                const msg = e instanceof Error ? e.message : "Failed to load model";
                setDownloadState((prev) => ({ ...prev, [id]: { modelId: id, status: "error", progress: 1, errorMessage: msg } }));
              });
            return id;
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Download failed";
          downloadsRef.current[id] = undefined;
          setDownloadState((prev) => ({ ...prev, [id]: { modelId: id, status: "error", progress: 0, errorMessage: msg } }));
        }
      })();
    },
    [allModels, downloadedIds, downloadState],
  );

  startDownloadRef.current = startDownload;

  const deleteModel = useCallback(
    (id: string) => {
      void (async () => {
        const dm = downloadedModels.find((m) => m.id === id);
        if (dm) {
          try { await FileSystem.deleteAsync(dm.localPath, { idempotent: true }); } catch { /* ignore */ }
        }
        const next = downloadedModels.filter((m) => m.id !== id);
        setDownloadedModels(next);
        void saveJSON(StorageKeys.DOWNLOADED_MODELS, next);
        setDownloadState((prev) => ({ ...prev, [id]: { modelId: id, status: "idle", progress: 0 } }));
        if (activeModelId === id) {
          await Llama.unloadModel();
          setActiveModelLoaded(false);
          const fallback = next[0] ?? null;
          const fallbackId = fallback?.id ?? null;
          setActiveModelIdState(fallbackId);
          void saveJSON(StorageKeys.ACTIVE_MODEL, fallbackId);
          if (fallback) {
            try { await Llama.loadModel(fallback.localPath); setActiveModelLoaded(true); } catch { /* ignore */ }
          }
        }
      })();
    },
    [downloadedModels, activeModelId],
  );

  const activeModel = useMemo(
    () => allModels.find((m) => m.id === activeModelId) ?? null,
    [allModels, activeModelId],
  );

  return (
    <ModelContext.Provider
      value={{
        models: allModels, downloadedIds, downloadedModels,
        activeModelId, activeModel, activeModelLoaded,
        downloadState, downloadQueue,
        addToQueue, removeFromQueue, clearQueue, startQueue,
        startDownload, cancelDownload, deleteModel,
        setActiveModel, addCustomModel, ready,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
}

export function useModels(): ModelContextValue {
  const ctx = useContext(ModelContext);
  if (!ctx) throw new Error("useModels must be used inside ModelProvider");
  return ctx;
}
