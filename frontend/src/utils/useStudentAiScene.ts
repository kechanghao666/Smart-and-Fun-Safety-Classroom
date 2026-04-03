import { useCallback, useEffect, useState } from "react";
import { useAppState } from "../state/AppState";
import type { LevelId } from "../types";
import { resolveAiReply } from "./aiAssistant";

interface UseStudentAiSceneOptions {
  prompt: string;
  scene: "welcome" | "hint";
  levelId?: LevelId;
  enabled?: boolean;
  fallbackText: string;
}

export function useStudentAiScene({
  prompt,
  scene,
  levelId,
  enabled = true,
  fallbackText,
}: UseStudentAiSceneOptions) {
  const { state } = useAppState();
  const [message, setMessage] = useState(fallbackText);
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setMessage(fallbackText);
      setNotice("");
      return;
    }

    setIsLoading(true);

    try {
      const result = await resolveAiReply(prompt, {
        authSource: state.authSource,
        authToken: state.authToken,
        scene,
        levelId,
      });

      setMessage(result.text || fallbackText);
      setNotice(result.notice ?? "");
    } finally {
      setIsLoading(false);
    }
  }, [
    enabled,
    fallbackText,
    levelId,
    prompt,
    scene,
    state.authSource,
    state.authToken,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    message,
    notice,
    isLoading,
    refresh,
  };
}
