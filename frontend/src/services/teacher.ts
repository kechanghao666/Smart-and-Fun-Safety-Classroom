import type {
  TeacherClassManagementItem,
  TeacherClassSummary,
  TeacherStudentDetail,
  TeacherStudentSummary,
} from "../types";
import { requestJson } from "./http";

export interface TeacherDashboardResponse {
  classSummaries: TeacherClassSummary[];
  students: TeacherStudentSummary[];
  alerts?: string[];
}

export interface TeacherStudentFilters {
  className?: string;
  completionStatus?: "completed" | "incomplete" | "all";
  examStatus?: "completed" | "pending" | "all";
}

export function fetchTeacherDashboard(token: string) {
  return requestJson<TeacherDashboardResponse>("/api/teacher/dashboard", {
    token,
  });
}

export function fetchTeacherClasses(token: string) {
  return requestJson<TeacherClassManagementItem[]>("/api/teacher/classes", {
    token,
  });
}

export function createTeacherClass(
  token: string,
  payload: { name: string; description: string },
) {
  return requestJson<TeacherClassManagementItem>("/api/teacher/classes", {
    method: "POST",
    token,
    body: payload,
  });
}

export function updateTeacherClass(
  token: string,
  classId: string,
  payload: { name?: string; description?: string },
) {
  return requestJson<TeacherClassManagementItem>(`/api/teacher/classes/${classId}`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export function fetchTeacherStudents(token: string, filters?: TeacherStudentFilters) {
  const params = new URLSearchParams();

  if (filters?.className && filters.className !== "all") {
    params.set("className", filters.className);
  }

  if (filters?.completionStatus && filters.completionStatus !== "all") {
    params.set("completionStatus", filters.completionStatus);
  }

  if (filters?.examStatus && filters.examStatus !== "all") {
    params.set("examStatus", filters.examStatus);
  }

  const query = params.toString();
  return requestJson<TeacherStudentSummary[]>(
    query ? `/api/teacher/students?${query}` : "/api/teacher/students",
    {
      token,
    },
  );
}

export function fetchTeacherStudentDetail(token: string, studentId: string) {
  return requestJson<TeacherStudentDetail>(`/api/teacher/students/${studentId}`, {
    token,
  });
}
