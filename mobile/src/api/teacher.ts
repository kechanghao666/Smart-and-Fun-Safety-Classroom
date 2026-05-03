import { requestJson } from "@/api/client";
import type {
  PaginatedResponse,
  TeacherClassManagementItem,
  TeacherDashboardResponse,
  TeacherStudentDetail,
  TeacherStudentSummary,
} from "@/types/contracts";

function toQuery(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function fetchTeacherDashboard(token: string) {
  return requestJson<TeacherDashboardResponse>("/teacher/dashboard", { token });
}

export function fetchTeacherClasses(token: string, page = 1, pageSize = 10, query?: string) {
  return requestJson<PaginatedResponse<TeacherClassManagementItem>>(
    `/teacher/classes${toQuery({ page, pageSize, query })}`,
    { token },
  );
}

export function fetchTeacherClassStudents(
  token: string,
  classId: string,
  page = 1,
  pageSize = 10,
  query?: string,
) {
  return requestJson<PaginatedResponse<TeacherStudentSummary>>(
    `/teacher/classes/${classId}/students${toQuery({ page, pageSize, query })}`,
    { token },
  );
}

export function fetchTeacherStudents(token: string, page = 1, pageSize = 10, query?: string) {
  return requestJson<PaginatedResponse<TeacherStudentSummary>>(
    `/teacher/students${toQuery({ page, pageSize, query })}`,
    { token },
  );
}

export function fetchTeacherStudentDetail(token: string, studentId: string) {
  return requestJson<TeacherStudentDetail>(`/teacher/students/${studentId}`, { token });
}
