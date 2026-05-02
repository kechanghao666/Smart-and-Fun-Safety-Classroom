import { requestJson } from "@/api/client";
import type {
  PaginatedResponse,
  TeacherClassManagementItem,
  TeacherDashboardResponse,
  TeacherStudentDetail,
  TeacherStudentSummary,
} from "@/types/contracts";

export function fetchTeacherDashboard(token: string) {
  return requestJson<TeacherDashboardResponse>("/teacher/dashboard", { token });
}

export function fetchTeacherClasses(token: string, page = 1, pageSize = 10) {
  return requestJson<PaginatedResponse<TeacherClassManagementItem>>(
    `/teacher/classes?page=${page}&pageSize=${pageSize}`,
    { token },
  );
}

export function fetchTeacherClassStudents(token: string, classId: string, page = 1, pageSize = 10) {
  return requestJson<PaginatedResponse<TeacherStudentSummary>>(
    `/teacher/classes/${classId}/students?page=${page}&pageSize=${pageSize}`,
    { token },
  );
}

export function fetchTeacherStudents(token: string, page = 1, pageSize = 10) {
  return requestJson<PaginatedResponse<TeacherStudentSummary>>(
    `/teacher/students?page=${page}&pageSize=${pageSize}`,
    { token },
  );
}

export function fetchTeacherStudentDetail(token: string, studentId: string) {
  return requestJson<TeacherStudentDetail>(`/teacher/students/${studentId}`, { token });
}
