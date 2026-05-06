import type { StudentProgress } from "@/types/contracts";

export type LearningPathUiState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" }
  | { status: "success"; progress: StudentProgress };
