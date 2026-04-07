import type {
  ExamQuestion,
  LevelId,
  LevelResult,
  StudentAiReportResponse,
  StudentExamReviewItem,
  StudentExamReviewResponse,
  StudentGrowthResponse,
  StudentProfile,
  StudentProgress,
  StudentRecordsResponse,
} from "../types";
import { requestJson } from "./http";

export interface StudentExamAnswer {
  questionId: string;
  selectedIndex: number;
}

export interface CompleteLevelResponse {
  progress: StudentProgress;
  result?: LevelResult;
}

export interface CompleteWrongQuestionReviewResponse {
  review?: StudentExamReviewItem;
  growth: StudentGrowthResponse;
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

export function saveStudentProfile(token: string, payload: StudentProfile) {
  return requestJson<StudentProfile>("/api/student/profile", {
    method: "POST",
    token,
    body: payload,
  });
}

export function fetchStudentProgress(token: string) {
  return requestJson<StudentProgress>("/api/student/progress", {
    token,
  });
}

export function fetchStudentExamQuestions(token: string) {
  return requestJson<ExamQuestion[]>("/api/student/exam/questions", {
    token,
  });
}

export function fetchStudentRecords(token: string) {
  return requestJson<StudentRecordsResponse>("/api/student/records", {
    token,
  });
}

export function fetchStudentExamReview(token: string) {
  return requestJson<StudentExamReviewResponse>("/api/student/exam/review", {
    token,
  });
}

export function completeStudentWrongQuestionReview(token: string, questionId: string) {
  return requestJson<CompleteWrongQuestionReviewResponse>(
    `/api/student/exam/review/${questionId}/complete`,
    {
      method: "POST",
      token,
    },
  );
}

export function fetchStudentGrowth(token: string) {
  return requestJson<StudentGrowthResponse>("/api/student/growth", {
    token,
  });
}

export function saveStudentGrowthPreferences(
  token: string,
  payload: { appearance?: string | null; scene?: string | null },
) {
  return requestJson<StudentGrowthResponse>("/api/student/growth/preferences", {
    method: "PUT",
    token,
    body: payload,
  });
}

export function fetchStudentAiReport(token: string) {
  return requestJson<StudentAiReportResponse>("/api/student/ai-report", {
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
