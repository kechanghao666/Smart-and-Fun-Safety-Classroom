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
  fallbackMessage = "暂时无法获取最新内容，请稍后重试。",
}: UseApiResourceOptions<T>) {
  const [data, setData] = useState<T>(fallbackData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [source, setSource] = useState<"mock" | "api">("api");
  const fetcherRef = useRef(fetcher);

  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;

    if (!enabled) {
      setData(fallbackData);
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

        setData(result);
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
  }, [enabled, fallbackData, fallbackMessage, ...dependencies]);

  return {
    data,
    isLoading,
    error,
    source,
  };
}
