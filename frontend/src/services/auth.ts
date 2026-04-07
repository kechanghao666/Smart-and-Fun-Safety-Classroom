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

export function registerWithPassword(input: {
  account: string;
  password: string;
  displayName: string;
  role: UserRole;
}) {
  return requestJson<LoginResponse>("/api/auth/register", {
    method: "POST",
    body: input,
  });
}
