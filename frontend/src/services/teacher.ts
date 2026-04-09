import type {
  StudentClassMembershipResponse,
  TeacherClassApplicationItem,
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
  return requestJson<TeacherDashboardResponse>("/teacher/dashboard", {
    token,
  });
}

export function fetchTeacherClasses(token: string) {
  return requestJson<TeacherClassManagementItem[]>("/teacher/classes", {
    token,
  });
}

export function createTeacherClass(
  token: string,
  payload: { name: string; description: string },
) {
  return requestJson<TeacherClassManagementItem>("/teacher/classes", {
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
  return requestJson<TeacherClassManagementItem>(`/teacher/classes/${classId}`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export function inviteStudentToTeacherClass(
  token: string,
  classId: string,
  studentNo: string,
) {
  return requestJson<StudentClassMembershipResponse>(
    `/teacher/classes/${classId}/invite-student`,
    {
      method: "POST",
      token,
      body: { studentNo },
    },
  );
}

export function fetchTeacherClassApplications(token: string, classId: string) {
  return requestJson<TeacherClassApplicationItem[]>(
    `/teacher/classes/${classId}/applications`,
    {
      token,
    },
  );
}

export function approveTeacherClassApplication(
  token: string,
  classId: string,
  applicationId: string,
) {
  return requestJson<TeacherClassApplicationItem[]>(
    `/teacher/classes/${classId}/applications/${applicationId}/approve`,
    {
      method: "POST",
      token,
    },
  );
}

export function rejectTeacherClassApplication(
  token: string,
  classId: string,
  applicationId: string,
) {
  return requestJson<TeacherClassApplicationItem[]>(
    `/teacher/classes/${classId}/applications/${applicationId}/reject`,
    {
      method: "POST",
      token,
    },
  );
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
    query ? `/teacher/students?${query}` : "/teacher/students",
    {
      token,
    },
  );
}

export function fetchTeacherStudentDetail(token: string, studentId: string) {
  return requestJson<TeacherStudentDetail>(`/teacher/students/${studentId}`, {
    token,
  });
}
