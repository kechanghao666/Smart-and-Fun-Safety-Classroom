import { requestJson } from "@/api/client";
import type {
  AiChatRequest,
  AiChatResponse,
  CompleteLevelResponse,
  CompleteWrongQuestionReviewResponse,
  ExamQuestion,
  LevelCompletionPayload,
  LevelId,
  StudentExamAnswer,
  StudentExamReviewResponse,
  StudentGrowthResponse,
  StudentProgress,
  StudentRecordsResponse,
} from "@/types/contracts";

export function fetchStudentProgress(token: string) {
  return requestJson<StudentProgress>("/student/progress", { token });
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

export function fetchStudentRecords(token: string) {
  return requestJson<StudentRecordsResponse>("/student/records", { token });
}

export function fetchStudentExamQuestions(token: string) {
  return requestJson<ExamQuestion[]>("/student/exam/questions", { token });
}

export function submitStudentExam(token: string, answers: StudentExamAnswer[]) {
  return requestJson<StudentProgress>("/student/exam/submit", {
    method: "POST",
    token,
    body: { answers },
  });
}

export function fetchStudentExamReview(token: string) {
  return requestJson<StudentExamReviewResponse>("/student/exam/review", { token });
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
  return requestJson<StudentGrowthResponse>("/student/growth", { token });
}

export function chatWithStudentAi(token: string, payload: AiChatRequest) {
  return requestJson<AiChatResponse>("/ai/chat", {
    method: "POST",
    token,
    body: payload,
  });
}
