import { apiBaseUrl, apiEnabled, apiTimeoutMs } from "./apiConfig";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status = 0, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

interface RequestJsonOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  token?: string;
}

function resolveUrl(path: string) {
  if (!apiEnabled) {
    throw new ApiError("当前未配置服务地址，请先设置 VITE_API_BASE_URL。");
  }

  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function requestJson<T>(path: string, options: RequestJsonOptions = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), apiTimeoutMs);
  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  try {
    const response = await fetch(resolveUrl(path), {
      ...options,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal ?? controller.signal,
    });

    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message =
        typeof payload === "object" && payload && "message" in payload
          ? String(payload.message)
          : `请求失败（${response.status}）`;
      throw new ApiError(message, response.status, payload);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("请求超时，请检查服务是否已启动。");
    }

    throw new ApiError("暂时无法连接服务，请确认应用服务已启动。");
  } finally {
    window.clearTimeout(timeoutId);
  }
}
