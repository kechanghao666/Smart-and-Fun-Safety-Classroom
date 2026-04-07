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
      const requestPrompt =
        message && message !== fallbackText
          ? `${prompt} 这次请换一种新的说法，不要重复上一句提醒：${message}`
          : prompt;

      const result = await resolveAiReply(requestPrompt, {
        authSource: state.authSource,
        authToken: state.authToken,
        scene,
        levelId,
        includeSuggestions: false,
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
    message,
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
