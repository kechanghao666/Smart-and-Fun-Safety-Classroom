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
  fallbackMessage = "暂时无法更新最新内容，当前继续使用示例内容。",
}: UseApiHydrationOptions<T>) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [source, setSource] = useState<"mock" | "api">(enabled ? "api" : "mock");
  const fetcherRef = useRef(fetcher);
  const applyDataRef = useRef(applyData);

  fetcherRef.current = fetcher;
  applyDataRef.current = applyData;

  useEffect(() => {
    let cancelled = false;

    if (!enabled) {
      setIsLoading(false);
      setError("");
      setSource("mock");
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
        setSource("api");
      })
      .catch((requestError) => {
        if (cancelled) {
          return;
        }

        setSource("mock");
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
