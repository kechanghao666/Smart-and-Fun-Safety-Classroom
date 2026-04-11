import type {
  PaginatedResponse,
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
  query?: string;
  className?: string;
  completionStatus?: "completed" | "incomplete" | "all";
  examStatus?: "completed" | "pending" | "all";
  page?: number;
  pageSize?: number;
}

export interface TeacherClassFilters {
  query?: string;
  page?: number;
  pageSize?: number;
}

export interface TeacherClassApplicationFilters {
  query?: string;
  page?: number;
  pageSize?: number;
}

export function fetchTeacherDashboard(token: string) {
  return requestJson<TeacherDashboardResponse>("/teacher/dashboard", {
    token,
  });
}

function buildTeacherQuery(filters: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === "all") {
      return;
    }

    params.set(key, String(value));
  });

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function fetchTeacherClasses(token: string, filters?: TeacherClassFilters) {
  return requestJson<PaginatedResponse<TeacherClassManagementItem>>(
    `/teacher/classes${buildTeacherQuery({
      query: filters?.query,
      page: filters?.page,
      pageSize: filters?.pageSize,
    })}`,
    {
      token,
    },
  );
}

export function fetchTeacherClassStudents(
  token: string,
  classId: string,
  filters?: TeacherClassFilters,
) {
  return requestJson<PaginatedResponse<TeacherStudentSummary>>(
    `/teacher/classes/${classId}/students${buildTeacherQuery({
      query: filters?.query,
      page: filters?.page,
      pageSize: filters?.pageSize,
    })}`,
    {
      token,
    },
  );
}

export function fetchTeacherClassApplications(
  token: string,
  classId: string,
  filters?: TeacherClassApplicationFilters,
) {
  return requestJson<PaginatedResponse<TeacherClassApplicationItem>>(
    `/teacher/classes/${classId}/applications${buildTeacherQuery({
      query: filters?.query,
      page: filters?.page,
      pageSize: filters?.pageSize,
    })}`,
    {
      token,
    },
  );
}

export function createTeacherClass(
  token: string,
  payload: { name: string; description: string },
) {
  return requestJson<TeacherClassManagementItem>("/teacher/classes", {
    token,
    method: "POST",
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
  return requestJson<PaginatedResponse<TeacherStudentSummary>>(
    `/teacher/students${buildTeacherQuery({
      query: filters?.query,
      className: filters?.className,
      completionStatus: filters?.completionStatus,
      examStatus: filters?.examStatus,
      page: filters?.page,
      pageSize: filters?.pageSize,
    })}`,
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
