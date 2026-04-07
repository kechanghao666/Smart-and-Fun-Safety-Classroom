import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "../services/http";

export type EditorStatus = "clean" | "dirty" | "saved" | "reset" | "sync_error";

interface UseEditableAdminResourceOptions<T> {
  storageKey: string;
  fallbackData: T;
  enabled: boolean;
  fetcher: () => Promise<T>;
  saveHandler?: (draftData: T, savedData: T) => Promise<T>;
  dependencies?: unknown[];
  fallbackMessage?: string;
}

function cloneData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function formatSavedAt() {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

export function useEditableAdminResource<T>({
  storageKey: _storageKey,
  fallbackData,
  enabled,
  fetcher,
  saveHandler,
  dependencies = [],
  fallbackMessage = "暂时无法获取最新配置，请稍后重试。",
}: UseEditableAdminResourceOptions<T>) {
  const initialDataRef = useRef(cloneData(fallbackData));
  const [draftData, setDraftData] = useState<T>(initialDataRef.current);
  const [savedData, setSavedData] = useState<T>(initialDataRef.current);
  const [baselineData, setBaselineData] = useState<T>(initialDataRef.current);
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [status, setStatus] = useState<EditorStatus>("clean");
  const [source, setSource] = useState<"api" | "mock">("api");
  const [syncError, setSyncError] = useState("");
  const [isHydrating, setIsHydrating] = useState(false);
  const fetcherRef = useRef(fetcher);
  const saveHandlerRef = useRef(saveHandler);
  const draftDataRef = useRef(draftData);
  const savedDataRef = useRef(savedData);
  const baselineDataRef = useRef(baselineData);

  fetcherRef.current = fetcher;
  saveHandlerRef.current = saveHandler;
  draftDataRef.current = draftData;
  savedDataRef.current = savedData;
  baselineDataRef.current = baselineData;

  const draftSignature = useMemo(() => JSON.stringify(draftData), [draftData]);
  const savedSignature = useMemo(() => JSON.stringify(savedData), [savedData]);
  const baselineSignature = useMemo(() => JSON.stringify(baselineData), [baselineData]);
  const hasUnsavedChanges = draftSignature !== savedSignature;
  const canRestoreBaseline =
    draftSignature !== baselineSignature || savedSignature !== baselineSignature;

  useEffect(() => {
    if (hasUnsavedChanges) {
      setStatus("dirty");
    }
  }, [hasUnsavedChanges]);

  useEffect(() => {
    let cancelled = false;

    if (!enabled) {
      setSource("api");
      setSyncError("当前会话未准备好，暂时不能同步后端配置。");
      setIsHydrating(false);
      return () => {
        cancelled = true;
      };
    }

    setSource("api");
    setSyncError("");
    setIsHydrating(true);

    void fetcherRef.current()
      .then((result) => {
        if (cancelled) {
          return;
        }

        const clonedResult = cloneData(result);
        setBaselineData(clonedResult);

        if (!hasUnsavedChanges) {
          setDraftData(clonedResult);
          setSavedData(clonedResult);
          setStatus("clean");
        }
      })
      .catch((requestError) => {
        if (cancelled) {
          return;
        }

        setSyncError(
          requestError instanceof ApiError ? requestError.message : fallbackMessage,
        );

        if (!hasUnsavedChanges) {
          setStatus("sync_error");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsHydrating(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, fallbackMessage, hasUnsavedChanges, ...dependencies]);

  const updateDraft = useCallback(
    (updater: T | ((current: T) => T)) => {
      setDraftData((current) =>
        typeof updater === "function"
          ? (updater as (current: T) => T)(current)
          : updater,
      );
    },
    [],
  );

  const saveChanges = useCallback(async () => {
    setSyncError("");

    if (saveHandlerRef.current) {
      setIsHydrating(true);

      try {
        const nextRemoteData = cloneData(
          await saveHandlerRef.current(
            cloneData(draftDataRef.current),
            cloneData(savedDataRef.current),
          ),
        );
        const savedAt = formatSavedAt();

        setDraftData(nextRemoteData);
        setSavedData(nextRemoteData);
        setBaselineData(nextRemoteData);
        setLastSavedAt(savedAt);
        setStatus("saved");
      } catch (requestError) {
        setStatus("sync_error");
        setSyncError(
          requestError instanceof ApiError
            ? requestError.message
            : "保存失败，请稍后重试。",
        );
      } finally {
        setIsHydrating(false);
      }

      return;
    }

    const nextSavedData = cloneData(draftDataRef.current);
    const savedAt = formatSavedAt();

    setDraftData(nextSavedData);
    setSavedData(nextSavedData);
    setBaselineData(nextSavedData);
    setLastSavedAt(savedAt);
    setStatus("saved");
  }, []);

  const resetChanges = useCallback(() => {
    setDraftData(cloneData(savedDataRef.current));
    setStatus("reset");
    setSyncError("");
  }, []);

  const restoreBaseline = useCallback(() => {
    const nextBaseline = cloneData(baselineDataRef.current);

    setDraftData(nextBaseline);
    setSavedData(nextBaseline);
    setStatus("reset");
    setSyncError("");
  }, []);

  return {
    draftData,
    source,
    status,
    syncError,
    isHydrating,
    hasUnsavedChanges,
    canRestoreBaseline,
    lastSavedAt,
    updateDraft,
    saveChanges,
    resetChanges,
    restoreBaseline,
  };
}
