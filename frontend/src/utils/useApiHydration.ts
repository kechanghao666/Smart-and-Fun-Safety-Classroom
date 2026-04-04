import { useEffect, useRef, useState } from "react";
import { ApiError } from "../services/http";

interface UseApiHydrationOptions<T> {
  enabled: boolean;
  fetcher: () => Promise<T>;
  applyData: (data: T) => void;
  dependencies?: unknown[];
  fallbackMessage?: string;
}

export function useApiHydration<T>({
  enabled,
  fetcher,
  applyData,
  dependencies = [],
  fallbackMessage = "暂时无法同步最新内容，请稍后重试。",
}: UseApiHydrationOptions<T>) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [source, setSource] = useState<"mock" | "api">("api");
  const fetcherRef = useRef(fetcher);
  const applyDataRef = useRef(applyData);

  fetcherRef.current = fetcher;
  applyDataRef.current = applyData;

  useEffect(() => {
    let cancelled = false;

    if (!enabled) {
      setIsLoading(false);
      setError("当前会话未准备好，暂时不能同步后端数据。");
      setSource("api");
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);
    setError("");
    setSource("api");

    void fetcherRef.current()
      .then((result) => {
        if (cancelled) {
          return;
        }

        applyDataRef.current(result);
      })
      .catch((requestError) => {
        if (cancelled) {
          return;
        }

        setError(
          requestError instanceof ApiError ? requestError.message : fallbackMessage,
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, fallbackMessage, ...dependencies]);

  return {
    isLoading,
    error,
    source,
  };
}
