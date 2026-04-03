const rawApiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").trim();
const rawTimeout = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? "8000");

export const apiBaseUrl = rawApiBaseUrl.replace(/\/+$/, "");
export const apiEnabled = apiBaseUrl.length > 0;
export const apiTimeoutMs =
  Number.isFinite(rawTimeout) && rawTimeout > 0 ? rawTimeout : 8000;
export const authModeLabel = apiEnabled ? "服务数据模式" : "预置数据模式";
