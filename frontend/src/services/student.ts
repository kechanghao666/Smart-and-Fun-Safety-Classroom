import type {
  ExamQuestion,
  LevelId,
  LevelCompletionPayload,
  LevelResult,
  StudentClassMembershipResponse,
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
  return requestJson<StudentProfile>("/student/profile", {
    method: "POST",
    token,
    body: payload,
  });
}

export function fetchStudentProgress(token: string) {
  return requestJson<StudentProgress>("/student/progress", {
    token,
  });
}

export function fetchStudentExamQuestions(token: string) {
  return requestJson<ExamQuestion[]>("/student/exam/questions", {
    token,
  });
}

export function fetchStudentRecords(token: string) {
  return requestJson<StudentRecordsResponse>("/student/records", {
    token,
  });
}

export function fetchStudentExamReview(token: string) {
  return requestJson<StudentExamReviewResponse>("/student/exam/review", {
    token,
  });
}

export function completeStudentWrongQuestionReview(token: string, questionId: string) {
  return requestJson<CompleteWrongQuestionReviewResponse>(
    `/student/exam/review/${questionId}/complete`,
    {
      method: "POST",
      token,
    },
  );
}

export function fetchStudentGrowth(token: string) {
  return requestJson<StudentGrowthResponse>("/student/growth", {
    token,
  });
}

export function fetchStudentClassMembership(token: string) {
  return requestJson<StudentClassMembershipResponse>("/student/class-membership", {
    token,
  });
}

export function applyStudentClassMembership(token: string, classCode: string) {
  return requestJson<StudentClassMembershipResponse>("/student/class-membership/apply", {
    method: "POST",
    token,
    body: { classCode },
  });
}

export function saveStudentGrowthPreferences(
  token: string,
  payload: { appearance?: string | null; scene?: string | null },
) {
  return requestJson<StudentGrowthResponse>("/student/growth/preferences", {
    method: "PUT",
    token,
    body: payload,
  });
}

export function fetchStudentAiReport(token: string) {
  return requestJson<StudentAiReportResponse>("/student/ai-report", {
    token,
  });
}

export function startStudentLevel(token: string, levelId: LevelId) {
  return requestJson<StudentProgress>(`/student/levels/${levelId}/start`, {
    method: "POST",
    token,
  });
}

export function completeStudentLevel(
  token: string,
  levelId: LevelId,
  payload?: LevelCompletionPayload,
) {
  return requestJson<CompleteLevelResponse>(`/student/levels/${levelId}/complete`, {
    method: "POST",
    token,
    body: payload,
  });
}

export function submitStudentExam(token: string, answers: StudentExamAnswer[]) {
  return requestJson<StudentProgress>("/student/exam/submit", {
    method: "POST",
    token,
    body: { answers },
  });
}

export function chatWithStudentAi(token: string, payload: AiChatRequest) {
  return requestJson<AiChatResponse>("/ai/chat", {
    method: "POST",
    token,
    body: payload,
  });
}
