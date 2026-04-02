import type {
  AdminModuleCard,
  AdminStatMetric,
  AdminUserSummary,
  AiCopyTemplateItem,
  LevelManagementItem,
  QuestionBankManagementItem,
  TeacherClassSummary,
  ThemeManagementItem,
} from "../types";
import { requestJson } from "./http";

export function fetchAdminModules(token: string) {
  return requestJson<AdminModuleCard[]>("/api/admin/modules", {
    token,
  });
}

export function fetchAdminThemes(token: string) {
  return requestJson<ThemeManagementItem[]>("/api/admin/themes", {
    token,
  });
}

export function fetchAdminLevels(token: string) {
  return requestJson<LevelManagementItem[]>("/api/admin/levels", {
    token,
  });
}

export function fetchAdminQuestionBank(token: string) {
  return requestJson<QuestionBankManagementItem[]>("/api/admin/question-bank", {
    token,
  });
}

export function fetchAdminAiCopy(token: string) {
  return requestJson<AiCopyTemplateItem[]>("/api/admin/ai-copy", {
    token,
  });
}

export function fetchAdminUsers(token: string) {
  return requestJson<AdminUserSummary[]>("/api/admin/users", {
    token,
  });
}

export interface AdminStatsResponse {
  metrics: AdminStatMetric[];
  classSummaries: TeacherClassSummary[];
}

export function fetchAdminStats(token: string) {
  return requestJson<AdminStatsResponse>("/api/admin/stats", {
    token,
  });
}
