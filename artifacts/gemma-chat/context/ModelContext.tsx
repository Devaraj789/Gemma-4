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

import * as Llama from "@/lib/llama";
import { GEMMA_MODELS, type ModelVariant } from "@/lib/models";
import { StorageKeys, loadJSON, saveJSON } from "@/lib/storage";
import { uuid } from "@/lib/uuid";

export type DownloadStatus = "idle" | "downloading" | "ready" | "error" | "loading";

export type DownloadState = {
  modelId: string;
  status: DownloadStatus;
  progress: number;
  mmprojProgress?: number;
  errorMessage?: string;
};

export type DownloadedModel = {
  id: string;
  localPath: string;
  mmprojLocalPath?: string;
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
  startDownload: (id: string) => void;
  cancelDownload: (id: string) => void;
  deleteModel: (id: string) => void;
  setActiveModel: (id: string | null) => void;
  addCustomModel: (opts: { name: string; url: string }) => void;
  loadActiveModelNow: () => Promise<void>;
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

function getMmprojPath(model: ModelVariant): string {
  return MODELS_DIR + model.id + "-mmproj.gguf";
}

const customModels: ModelVariant[] = [];

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [downloadedModels, setDownloadedModels] = useState<DownloadedModel[]>([]);
  const [activeModelId, setActiveModelIdState] = useState<string | null>(null);
  const [activeModelLoaded, setActiveModelLoaded] = useState<boolean>(false);
  const [downloadState, setDownloadState] = useState<Record<string, DownloadState>>({});
  const [allModels, setAllModels] = useState<ModelVariant[]>(GEMMA_MODELS);
  const [ready, setReady] = useState<boolean>(false);
  const downloadsRef = useRef<Record<string, FileSystem.DownloadResumable | undefined>>({});
  const loadingRef = useRef<boolean>(false);

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
          if (!info.exists || (info.size ?? 0) <= 1_000_000) continue;
          if (dm.mmprojLocalPath) {
            const mmprojInfo = await FileSystem.getInfoAsync(dm.mmprojLocalPath);
            if (!mmprojInfo.exists || (mmprojInfo.size ?? 0) <= 100_000) {
              verified.push({ ...dm, mmprojLocalPath: undefined });
              continue;
            }
          }
          verified.push(dm);
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

      // ✅ LAZY LOAD: App open-ல model load வேண்டாம்!
      // User first message அனுப்பும்போது loadActiveModelNow() call ஆகும்

      setReady(true);
    })();
    return () => { mounted = false; };
  }, []);

  // ✅ NEW: Manual trigger - user chat பண்ண ஆரம்பிக்கும்போது மட்டும் load
  const loadActiveModelNow = useCallback(async () => {
    if (loadingRef.current || activeModelLoaded) return;

    const currentId = activeModelId;
    if (!currentId) return;

    const dm = downloadedModels.find((m) => m.id === currentId);
    if (!dm) return;

    loadingRef.current = true;
    setDownloadState((prev) => ({
      ...prev,
      [currentId]: { modelId: currentId, status: "loading", progress: 1 },
    }));

    try {
      await Llama.loadModel(dm.localPath, dm.mmprojLocalPath);
      setActiveModelLoaded(true);
      setDownloadState((prev) => ({
        ...prev,
        [currentId]: { modelId: currentId, status: "ready", progress: 1 },
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Model load failed";
      setDownloadState((prev) => ({
        ...prev,
        [currentId]: { modelId: currentId, status: "error", progress: 1, errorMessage: msg },
      }));
    } finally {
      loadingRef.current = false;
    }
  }, [activeModelId, activeModelLoaded, downloadedModels]);

  const downloadedIds = useMemo(() => downloadedModels.map((d) => d.id), [downloadedModels]);

  const addCustomModel = useCallback((opts: { name: string; url: string }) => {
    const id = "custom-" + uuid().slice(0, 8);
    const custom: ModelVariant = {
      id,
      name: opts.name,
      shortName: opts.name,
      description: "Custom user-added model",
      sizeLabel: "Unknown",
      sizeBytes: 0,
      ramRequiredGb: 4,
      quantization: "GGUF",
      format: "gguf",
      downloadUrl: opts.url,
      badges: ["GGUF", "Custom"],
    };
    customModels.push(custom);
    setAllModels([...GEMMA_MODELS, ...customModels]);
    setDownloadState((prev) => ({ ...prev, [id]: { modelId: id, status: "idle", progress: 0 } }));
  }, []);

  const setActiveModel = useCallback(
    (id: string | null) => {
      setActiveModelIdState(id);
      setActiveModelLoaded(false); // ✅ Reset - new model select பண்ணும்போது
      loadingRef.current = false;
      void saveJSON(StorageKeys.ACTIVE_MODEL, id);
      if (id === null) {
        void Llama.unloadModel();
        return;
      }
      // ✅ LAZY: setActiveModel-லயே load பண்ண வேண்டாம்
      // loadActiveModelNow() மட்டும் load பண்ணும்
      setDownloadState((prev) => ({
        ...prev,
        [id]: { modelId: id, status: "ready", progress: 1 },
      }));
    },
    [],
  );

  const cancelDownload = useCallback((id: string) => {
    const dl = downloadsRef.current[id];
    if (dl) { void dl.pauseAsync().catch(() => {}); downloadsRef.current[id] = undefined; }
    const dlMmproj = downloadsRef.current[id + "-mmproj"];
    if (dlMmproj) { void dlMmproj.pauseAsync().catch(() => {}); downloadsRef.current[id + "-mmproj"] = undefined; }
    setDownloadState((prev) => ({ ...prev, [id]: { modelId: id, status: "idle", progress: 0 } }));
  }, []);

  const startDownload = useCallback(
    (id: string) => {
      const model = allModels.find((m) => m.id === id);
      if (!model) return;
      if (downloadedIds.includes(id)) return;
      if (downloadState[id]?.status === "downloading") return;

      setDownloadState((prev) => ({ ...prev, [id]: { modelId: id, status: "downloading", progress: 0, mmprojProgress: 0 } }));

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
                setDownloadState((prev) => ({ ...prev, [id]: { ...prev[id], modelId: id, status: "downloading", progress } }));
              }
            },
          );
          downloadsRef.current[id] = dl;
          const result = await dl.downloadAsync();
          downloadsRef.current[id] = undefined;

          if (!result?.uri) throw new Error("Download did not return a file URI");

          let mmprojLocalPath: string | undefined;
          if (model.mmprojUrl) {
            const mmprojPath = getMmprojPath(model);
            const existingMmproj = await FileSystem.getInfoAsync(mmprojPath);
            if (existingMmproj.exists) await FileSystem.deleteAsync(mmprojPath, { idempotent: true });

            setDownloadState((prev) => ({
              ...prev,
              [id]: { ...prev[id], modelId: id, status: "downloading", progress: 1, mmprojProgress: 0 },
            }));

            const dlMmproj = FileSystem.createDownloadResumable(
              model.mmprojUrl,
              mmprojPath,
              {},
              (data) => {
                if (data.totalBytesExpectedToWrite > 0) {
                  const mmprojProgress = data.totalBytesWritten / data.totalBytesExpectedToWrite;
                  setDownloadState((prev) => ({ ...prev, [id]: { ...prev[id], modelId: id, status: "downloading", mmprojProgress } }));
                }
              },
            );
            downloadsRef.current[id + "-mmproj"] = dlMmproj;
            const mmprojResult = await dlMmproj.downloadAsync();
            downloadsRef.current[id + "-mmproj"] = undefined;

            if (mmprojResult?.uri) {
              mmprojLocalPath = mmprojResult.uri;
            }
          }

          const newEntry: DownloadedModel = {
            id,
            localPath: result.uri,
            mmprojLocalPath,
            downloadedAt: Date.now(),
          };
          setDownloadedModels((prev) => {
            const next = [...prev.filter((m) => m.id !== id), newEntry];
            void saveJSON(StorageKeys.DOWNLOADED_MODELS, next);
            return next;
          });

          // ✅ Download முடிஞ்சதும் ready - ஆனா load பண்ண வேண்டாம்
          setDownloadState((prev) => ({
            ...prev,
            [id]: { modelId: id, status: "ready", progress: 1, mmprojProgress: 1 },
          }));

          setActiveModelIdState((curr) => {
            if (curr) return curr;
            void saveJSON(StorageKeys.ACTIVE_MODEL, id);
            return id;
            // ✅ Auto-load இல்ல - lazy load மட்டும்
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Download failed";
          downloadsRef.current[id] = undefined;
          downloadsRef.current[id + "-mmproj"] = undefined;
          setDownloadState((prev) => ({ ...prev, [id]: { modelId: id, status: "error", progress: 0, errorMessage: msg } }));
        }
      })();
    },
    [allModels, downloadedIds, downloadState],
  );

  const deleteModel = useCallback(
    (id: string) => {
      void (async () => {
        const dm = downloadedModels.find((m) => m.id === id);
        if (dm) {
          try { await FileSystem.deleteAsync(dm.localPath, { idempotent: true }); } catch { /* ignore */ }
          if (dm.mmprojLocalPath) {
            try { await FileSystem.deleteAsync(dm.mmprojLocalPath, { idempotent: true }); } catch { /* ignore */ }
          }
        }
        const next = downloadedModels.filter((m) => m.id !== id);
        setDownloadedModels(next);
        void saveJSON(StorageKeys.DOWNLOADED_MODELS, next);
        setDownloadState((prev) => ({ ...prev, [id]: { modelId: id, status: "idle", progress: 0 } }));
        if (activeModelId === id) {
          await Llama.unloadModel();
          setActiveModelLoaded(false);
          loadingRef.current = false;
          const fallback = next[0] ?? null;
          const fallbackId = fallback?.id ?? null;
          setActiveModelIdState(fallbackId);
          void saveJSON(StorageKeys.ACTIVE_MODEL, fallbackId);
          // ✅ Fallback-லயும் lazy - user chat பண்ணும்போது load ஆகும்
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
        models: allModels,
        downloadedIds,
        downloadedModels,
        activeModelId,
        activeModel,
        activeModelLoaded,
        downloadState,
        startDownload,
        cancelDownload,
        deleteModel,
        setActiveModel,
        addCustomModel,
        loadActiveModelNow,
        ready,
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
