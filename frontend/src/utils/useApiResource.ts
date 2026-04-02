import { useEffect, useRef, useState } from "react";
import { ApiError } from "../services/http";

interface UseApiResourceOptions<T> {
  enabled: boolean;
  fallbackData: T;
  fetcher: () => Promise<T>;
  dependencies?: unknown[];
  fallbackMessage?: string;
}

export function useApiResource<T>({
  enabled,
  fallbackData,
  fetcher,
  dependencies = [],
  fallbackMessage = "暂时无法获取后端数据，当前已回退为本地演示数据。",
}: UseApiResourceOptions<T>) {
  const [data, setData] = useState<T>(fallbackData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [source, setSource] = useState<"mock" | "api">(enabled ? "api" : "mock");
  const fetcherRef = useRef(fetcher);

  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;

    if (!enabled) {
      setData(fallbackData);
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

        setData(result);
        setSource("api");
      })
      .catch((requestError) => {
        if (cancelled) {
          return;
        }

        setData(fallbackData);
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
  }, [enabled, fallbackData, fallbackMessage, ...dependencies]);

  return {
    data,
    isLoading,
    error,
    source,
  };
}
