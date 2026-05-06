import { useCallback, useEffect, useState } from "react";

import { fetchStudentProgress } from "@/api/student";
import { useAuth } from "@/store/authStore";
import { getErrorMessage } from "@/utils/errors";
import type { LearningPathUiState } from "./LearningPathUiState";

export function useLearningPathViewModel() {
  const { session } = useAuth();
  const [state, setState] = useState<LearningPathUiState>({ status: "loading" });

  const load = useCallback(async () => {
    if (!session?.token) {
      setState({ status: "empty" });
      return;
    }

    setState({ status: "loading" });
    try {
      const progress = await fetchStudentProgress(session.token);
      setState(progress ? { status: "success", progress } : { status: "empty" });
    } catch (error) {
      setState({ status: "error", message: getErrorMessage(error) });
    }
  }, [session?.token]);

  useEffect(() => {
    load();
  }, [load]);

  return { state, reload: load };
}
