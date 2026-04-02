import type { StudentProfile, StudentProgress, UserRole } from "../types";
import { requestJson } from "./http";

export interface LoginResponse {
  token: string;
  role: UserRole;
  account?: string;
  displayName?: string;
  studentProfile?: StudentProfile | null;
  progress?: StudentProgress | null;
}

export function loginWithPassword(account: string, password: string) {
  return requestJson<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: { account, password },
  });
}
