import type { LevelId, LevelResult, StudentProgress } from "../types";
import { requestJson } from "./http";

export interface StudentExamAnswer {
  questionId: string;
  selectedIndex: number;
}

export interface CompleteLevelResponse {
  progress: StudentProgress;
  result?: LevelResult;
}

export interface AiChatRequest {
  scene: "welcome" | "hint" | "qa";
  levelId?: LevelId;
  message?: string;
}

export interface AiChatResponse {
  reply: string;
  suggestions?: string[];
}

export function fetchStudentProgress(token: string) {
  return requestJson<StudentProgress>("/api/student/progress", {
    token,
  });
}

export function startStudentLevel(token: string, levelId: LevelId) {
  return requestJson<StudentProgress>(`/api/student/levels/${levelId}/start`, {
    method: "POST",
    token,
  });
}

export function completeStudentLevel(token: string, levelId: LevelId) {
  return requestJson<CompleteLevelResponse>(`/api/student/levels/${levelId}/complete`, {
    method: "POST",
    token,
  });
}

export function submitStudentExam(token: string, answers: StudentExamAnswer[]) {
  return requestJson<StudentProgress>("/api/student/exam/submit", {
    method: "POST",
    token,
    body: { answers },
  });
}

export function chatWithStudentAi(token: string, payload: AiChatRequest) {
  return requestJson<AiChatResponse>("/api/ai/chat", {
    method: "POST",
    token,
    body: payload,
  });
}
