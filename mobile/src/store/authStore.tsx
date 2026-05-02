import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import { loginWithPassword, registerWithPassword } from "@/api/auth";
import type { LoginResponse, UserRole } from "@/types/contracts";
import { clearSession, readSession, saveSession, type StoredSession } from "./tokenStorage";

type AuthStatus = "loading" | "signedOut" | "signedIn";

interface AuthContextValue {
  status: AuthStatus;
  session: StoredSession | null;
  signIn(account: string, password: string): Promise<LoginResponse>;
  signUp(input: {
    account: string;
    password: string;
    displayName: string;
    role: Exclude<UserRole, "admin">;
  }): Promise<LoginResponse>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isMobileRole(role: UserRole): role is "student" | "teacher" {
  return role === "student" || role === "teacher";
}

function buildStoredSession(response: LoginResponse, fallbackAccount?: string): StoredSession {
  if (!isMobileRole(response.role)) {
    throw new Error("移动端第一版暂不支持管理员登录，请使用 Web 后台。");
  }

  return {
    token: response.token,
    role: response.role,
    account: response.account ?? fallbackAccount,
    displayName: response.displayName,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<StoredSession | null>(null);

  useEffect(() => {
    let active = true;

    readSession()
      .then((stored) => {
        if (!active) {
          return;
        }

        setSession(stored);
        setStatus(stored ? "signedIn" : "signedOut");
      })
      .catch(() => {
        if (active) {
          setStatus("signedOut");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      async signIn(account, password) {
        const response = await loginWithPassword(account, password);
        const stored = buildStoredSession(response, account);
        await saveSession(stored);
        setSession(stored);
        setStatus("signedIn");
        return response;
      },
      async signUp(input) {
        const response = await registerWithPassword(input);
        const stored = buildStoredSession(response, input.account);
        await saveSession(stored);
        setSession(stored);
        setStatus("signedIn");
        return response;
      },
      async signOut() {
        await clearSession();
        setSession(null);
        setStatus("signedOut");
      },
    }),
    [session, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return value;
}
