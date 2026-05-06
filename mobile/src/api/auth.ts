import { requestJson } from "@/api/client";
import type { LoginResponse, UserRole } from "@/types/contracts";

export function loginWithPassword(account: string, password: string) {
  return requestJson<LoginResponse>("/auth/login", {
    method: "POST",
    body: { account, password },
  });
}

export function registerWithPassword(input: {
  account: string;
  password: string;
  displayName: string;
  role: Exclude<UserRole, "admin">;
}) {
  return requestJson<LoginResponse>("/auth/register", {
    method: "POST",
    body: input,
  });
}

export function resetPasswordWithAccount(input: { account: string; password: string }) {
  return requestJson<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: input,
  });
}
