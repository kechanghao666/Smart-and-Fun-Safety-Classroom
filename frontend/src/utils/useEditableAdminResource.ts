import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "../services/http";

export type EditorStatus = "clean" | "dirty" | "saved" | "reset" | "sync_error";

interface PersistedEditableState<T> {
  savedData: T;
  baselineData: T;
  lastSavedAt: string;
  hasStoredState: boolean;
}

interface UseEditableAdminResourceOptions<T> {
  storageKey: string;
  fallbackData: T;
  enabled: boolean;
  fetcher: () => Promise<T>;
  dependencies?: unknown[];
  fallbackMessage?: string;
}

function cloneData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function loadPersistedEditableState<T>(
  storageKey: string,
  fallbackData: T,
): PersistedEditableState<T> {
  const fallbackClone = cloneData(fallbackData);

  if (typeof window === "undefined") {
    return {
      savedData: fallbackClone,
      baselineData: cloneData(fallbackData),
      lastSavedAt: "",
      hasStoredState: false,
    };
  }

  try {
    const raw = window.localStorage.getItem(storageKey);

    if (!raw) {
      return {
        savedData: fallbackClone,
        baselineData: cloneData(fallbackData),
        lastSavedAt: "",
        hasStoredState: false,
      };
    }

    const parsed = JSON.parse(raw) as {
      savedData?: T;
      baselineData?: T;
      lastSavedAt?: string;
    };

    return {
      savedData: cloneData(parsed.savedData ?? fallbackData),
      baselineData: cloneData(parsed.baselineData ?? fallbackData),
      lastSavedAt: parsed.lastSavedAt ?? "",
      hasStoredState: true,
    };
  } catch {
    return {
      savedData: fallbackClone,
      baselineData: cloneData(fallbackData),
      lastSavedAt: "",
      hasStoredState: false,
    };
  }
}

function persistEditableState<T>(
  storageKey: string,
  payload: Omit<PersistedEditableState<T>, "hasStoredState">,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    storageKey,
    JSON.stringify({
      savedData: payload.savedData,
      baselineData: payload.baselineData,
      lastSavedAt: payload.lastSavedAt,
    }),
  );
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
  storageKey,
  fallbackData,
  enabled,
  fetcher,
  dependencies = [],
  fallbackMessage = "暂时无法获取服务数据，当前继续使用预置数据。",
}: UseEditableAdminResourceOptions<T>) {
  const initialStateRef = useRef(
    loadPersistedEditableState(storageKey, fallbackData),
  );
  const [draftData, setDraftData] = useState<T>(initialStateRef.current.savedData);
  const [savedData, setSavedData] = useState<T>(initialStateRef.current.savedData);
  const [baselineData, setBaselineData] = useState<T>(initialStateRef.current.baselineData);
  const [lastSavedAt, setLastSavedAt] = useState(initialStateRef.current.lastSavedAt);
  const [status, setStatus] = useState<EditorStatus>(
    initialStateRef.current.hasStoredState && initialStateRef.current.lastSavedAt
      ? "saved"
      : "clean",
  );
  const [source, setSource] = useState<"api" | "mock">(enabled ? "api" : "mock");
  const [syncError, setSyncError] = useState("");
  const [isHydrating, setIsHydrating] = useState(false);
  const fetcherRef = useRef(fetcher);
  const draftDataRef = useRef(draftData);
  const savedDataRef = useRef(savedData);
  const baselineDataRef = useRef(baselineData);
  const lastSavedAtRef = useRef(lastSavedAt);
  const hasStoredStateRef = useRef(initialStateRef.current.hasStoredState);

  fetcherRef.current = fetcher;
  draftDataRef.current = draftData;
  savedDataRef.current = savedData;
  baselineDataRef.current = baselineData;
  lastSavedAtRef.current = lastSavedAt;

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
      setSource("mock");
      setSyncError("");
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

        if (!hasStoredStateRef.current) {
          setDraftData(clonedResult);
          setSavedData(clonedResult);
        }

        persistEditableState(storageKey, {
          savedData: hasStoredStateRef.current ? savedDataRef.current : clonedResult,
          baselineData: clonedResult,
          lastSavedAt: lastSavedAtRef.current,
        });
        hasStoredStateRef.current = true;
        setSource("api");

        if (!hasUnsavedChanges) {
          setStatus("clean");
        }
      })
      .catch((requestError) => {
        if (cancelled) {
          return;
        }

        setSource("mock");
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
  }, [enabled, fallbackMessage, hasUnsavedChanges, storageKey, ...dependencies]);

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

  const saveChanges = useCallback(() => {
    const nextSavedData = cloneData(draftDataRef.current);
    const savedAt = formatSavedAt();

    setSavedData(nextSavedData);
    setLastSavedAt(savedAt);
    setStatus("saved");
    setSyncError("");
    persistEditableState(storageKey, {
      savedData: nextSavedData,
      baselineData: baselineDataRef.current,
      lastSavedAt: savedAt,
    });
    hasStoredStateRef.current = true;
  }, [storageKey]);

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
    persistEditableState(storageKey, {
      savedData: nextBaseline,
      baselineData: baselineDataRef.current,
      lastSavedAt: lastSavedAtRef.current,
    });
    hasStoredStateRef.current = true;
  }, [storageKey]);

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
