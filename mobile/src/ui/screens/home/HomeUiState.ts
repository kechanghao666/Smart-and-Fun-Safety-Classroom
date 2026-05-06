import type { StudentProgress } from "@/types/contracts";

export type HomeUiState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" }
  | { status: "success"; progress: StudentProgress };
