import type {
  TeacherClassSummary,
  TeacherStudentDetail,
  TeacherStudentSummary,
} from "../types";
import { requestJson } from "./http";

export interface TeacherDashboardResponse {
  classSummaries: TeacherClassSummary[];
  students: TeacherStudentSummary[];
}

export function fetchTeacherDashboard(token: string) {
  return requestJson<TeacherDashboardResponse>("/api/teacher/dashboard", {
    token,
  });
}

export function fetchTeacherStudents(token: string) {
  return requestJson<TeacherStudentSummary[]>("/api/teacher/students", {
    token,
  });
}

export function fetchTeacherStudentDetail(token: string, studentId: string) {
  return requestJson<TeacherStudentDetail>(`/api/teacher/students/${studentId}`, {
    token,
  });
}

