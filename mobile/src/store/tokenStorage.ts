import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { StudentProfile } from "@/types/contracts";

const KEY = "xingtu-zhixue-mobile-session";

export interface StoredSession {
  token: string;
  role: "student" | "teacher";
  account?: string;
  displayName?: string;
  studentProfile?: StudentProfile | null;
}

export async function saveSession(session: StoredSession) {
  const serialized = JSON.stringify(session);

  if (Platform.OS === "web") {
    window.localStorage.setItem(KEY, serialized);
    return;
  }

  await SecureStore.setItemAsync(KEY, serialized);
}

export async function readSession(): Promise<StoredSession | null> {
  const serialized =
    Platform.OS === "web" ? window.localStorage.getItem(KEY) : await SecureStore.getItemAsync(KEY);

  if (!serialized) {
    return null;
  }

  try {
    return JSON.parse(serialized) as StoredSession;
  } catch {
    return null;
  }
}

export async function clearSession() {
  if (Platform.OS === "web") {
    window.localStorage.removeItem(KEY);
    return;
  }

  await SecureStore.deleteItemAsync(KEY);
}
