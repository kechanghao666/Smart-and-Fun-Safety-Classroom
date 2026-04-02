import type { AdminModuleCard } from "../types";
import { requestJson } from "./http";

export function fetchAdminModules(token: string) {
  return requestJson<AdminModuleCard[]>("/api/admin/modules", {
    token,
  });
}

