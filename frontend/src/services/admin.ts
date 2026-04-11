import type {
  AdminModuleCard,
  PaginatedResponse,
  AdminStatMetric,
  AdminUserSummary,
  AiCopyTemplateItem,
  GrowthConfigItem,
  LevelManagementItem,
  QuestionBankManagementItem,
  TeacherClassSummary,
  ThemeManagementItem,
} from "../types";
import { requestJson } from "./http";

export function fetchAdminModules(token: string) {
  return requestJson<AdminModuleCard[]>("/admin/modules", {
    token,
  });
}

export function fetchAdminThemes(token: string) {
  return fetchAdminThemesPage(token, { page: 1, pageSize: 500 }).then((result) => result.items);
}

export function fetchAdminThemesPage(
  token: string,
  filters?: {
    query?: string;
    page?: number;
    pageSize?: number;
  },
) {
  return requestJson<PaginatedResponse<ThemeManagementItem>>(
    `/admin/themes${buildQueryString({
      query: filters?.query,
      page: filters?.page,
      pageSize: filters?.pageSize,
    })}`,
    {
      token,
    },
  );
}

export function createAdminTheme(token: string, payload: ThemeManagementItem) {
  return requestJson<ThemeManagementItem[]>("/admin/themes", {
    method: "POST",
    token,
    body: payload,
  });
}

export function updateAdminTheme(token: string, themeId: string, payload: ThemeManagementItem) {
  return requestJson<ThemeManagementItem[]>(`/admin/themes/${themeId}`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export function deleteAdminTheme(token: string, themeId: string) {
  return requestJson<ThemeManagementItem[]>(`/admin/themes/${themeId}`, {
    method: "DELETE",
    token,
  });
}

export function fetchAdminLevels(token: string) {
  return requestJson<LevelManagementItem[]>("/admin/levels", {
    token,
  });
}

export function updateAdminLevel(token: string, levelId: string, payload: LevelManagementItem) {
  return requestJson<LevelManagementItem[]>(`/admin/levels/${levelId}`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export function fetchAdminQuestionBank(token: string) {
  return fetchAdminQuestionBankPage(token, { page: 1, pageSize: 500 }).then(
    (result) => result.items,
  );
}

export function fetchAdminQuestionBankPage(
  token: string,
  filters?: {
    query?: string;
    themeId?: string;
    page?: number;
    pageSize?: number;
  },
) {
  return requestJson<PaginatedResponse<QuestionBankManagementItem>>(
    `/admin/question-bank${buildQueryString({
      query: filters?.query,
      themeId: filters?.themeId,
      page: filters?.page,
      pageSize: filters?.pageSize,
    })}`,
    {
      token,
    },
  );
}

export function createAdminQuestionBank(token: string, payload: QuestionBankManagementItem) {
  return requestJson<QuestionBankManagementItem[]>("/admin/question-bank", {
    method: "POST",
    token,
    body: payload,
  });
}

export function updateAdminQuestionBank(
  token: string,
  questionId: string,
  payload: QuestionBankManagementItem,
) {
  return requestJson<QuestionBankManagementItem[]>(`/admin/question-bank/${questionId}`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export function deleteAdminQuestionBank(token: string, questionId: string) {
  return requestJson<QuestionBankManagementItem[]>(`/admin/question-bank/${questionId}`, {
    method: "DELETE",
    token,
  });
}

export function fetchAdminAiCopy(token: string) {
  return fetchAdminAiCopyPage(token, { page: 1, pageSize: 500 }).then((result) => result.items);
}

export function fetchAdminAiCopyPage(
  token: string,
  filters?: {
    query?: string;
    category?: string;
    page?: number;
    pageSize?: number;
  },
) {
  return requestJson<PaginatedResponse<AiCopyTemplateItem>>(
    `/admin/ai-copy${buildQueryString({
      query: filters?.query,
      category: filters?.category,
      page: filters?.page,
      pageSize: filters?.pageSize,
    })}`,
    {
      token,
    },
  );
}

export function createAdminAiCopy(token: string, payload: AiCopyTemplateItem) {
  return requestJson<AiCopyTemplateItem[]>("/admin/ai-copy", {
    method: "POST",
    token,
    body: payload,
  });
}

export function updateAdminAiCopy(token: string, templateId: string, payload: AiCopyTemplateItem) {
  return requestJson<AiCopyTemplateItem[]>(`/admin/ai-copy/${templateId}`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export function deleteAdminAiCopy(token: string, templateId: string) {
  return requestJson<AiCopyTemplateItem[]>(`/admin/ai-copy/${templateId}`, {
    method: "DELETE",
    token,
  });
}

function buildQueryString(filters: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (typeof value === "string" && value.trim()) {
      params.set(key, value.trim());
      return;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function fetchAdminUsers(
  token: string,
  filters?: {
    query?: string;
    status?: string;
    role?: string;
    page?: number;
    pageSize?: number;
  },
) {
  return requestJson<PaginatedResponse<AdminUserSummary>>(
    `/admin/users${buildQueryString({
      query: filters?.query,
      status: filters?.status,
      role: filters?.role,
      page: filters?.page,
      pageSize: filters?.pageSize,
    })}`,
    {
      token,
    },
  );
}

export function updateAdminUser(
  token: string,
  userId: string,
  payload: { status?: AdminUserSummary["status"]; note?: string },
) {
  return requestJson<AdminUserSummary | null>(`/admin/users/${userId}`, {
    method: "PATCH",
    token,
    body: payload,
  });
}

export interface AdminStatsResponse {
  metrics: AdminStatMetric[];
  classSummaries: TeacherClassSummary[];
}

export function fetchAdminStats(token: string) {
  return requestJson<AdminStatsResponse>("/admin/stats", {
    token,
  });
}

export function fetchAdminGrowthConfig(token: string) {
  return requestJson<GrowthConfigItem>("/admin/growth-config", {
    token,
  });
}

export function updateAdminGrowthConfig(token: string, payload: GrowthConfigItem) {
  return requestJson<GrowthConfigItem>("/admin/growth-config", {
    method: "PUT",
    token,
    body: payload,
  });
}

function isSameValue<T>(left: T, right: T) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export async function saveAdminThemes(
  token: string,
  draftThemes: ThemeManagementItem[],
  savedThemes: ThemeManagementItem[],
) {
  const savedMap = new Map(savedThemes.map((item) => [item.id, item]));
  const draftMap = new Map(draftThemes.map((item) => [item.id, item]));

  for (const theme of draftThemes) {
    const previous = savedMap.get(theme.id);

    if (!previous) {
      await createAdminTheme(token, theme);
      continue;
    }

    if (!isSameValue(previous, theme)) {
      await updateAdminTheme(token, theme.id, theme);
    }
  }

  for (const previous of savedThemes) {
    if (!draftMap.has(previous.id)) {
      await deleteAdminTheme(token, previous.id);
    }
  }

  return fetchAdminThemes(token);
}

export async function saveAdminLevels(
  token: string,
  draftLevels: LevelManagementItem[],
  savedLevels: LevelManagementItem[],
) {
  const savedMap = new Map(savedLevels.map((item) => [item.id, item]));

  for (const level of draftLevels) {
    const previous = savedMap.get(level.id);

    if (!previous || !isSameValue(previous, level)) {
      await updateAdminLevel(token, level.id, level);
    }
  }

  return fetchAdminLevels(token);
}

export async function saveAdminQuestionBank(
  token: string,
  draftQuestions: QuestionBankManagementItem[],
  savedQuestions: QuestionBankManagementItem[],
) {
  const savedMap = new Map(savedQuestions.map((item) => [item.id, item]));

  for (const question of draftQuestions) {
    const previous = savedMap.get(question.id);

    if (!previous || !isSameValue(previous, question)) {
      await updateAdminQuestionBank(token, question.id, question);
    }
  }

  return fetchAdminQuestionBank(token);
}

export async function saveAdminAiCopy(
  token: string,
  draftTemplates: AiCopyTemplateItem[],
  savedTemplates: AiCopyTemplateItem[],
) {
  const savedMap = new Map(savedTemplates.map((item) => [item.id, item]));

  for (const template of draftTemplates) {
    const previous = savedMap.get(template.id);

    if (!previous || !isSameValue(previous, template)) {
      await updateAdminAiCopy(token, template.id, template);
    }
  }

  return fetchAdminAiCopy(token);
}

export const adminGrowthConfigFallback: GrowthConfigItem = {
  id: "default-growth",
  title: "虚拟人物成长规则",
  levelAwards: {
    "level-1": { appearancePoints: 8, safetyPoints: 16, scenePoints: 6 },
    "level-2": { appearancePoints: 6, safetyPoints: 14, scenePoints: 10 },
    "level-3": { appearancePoints: 10, safetyPoints: 12, scenePoints: 8 },
  },
  levelThreeStarBonusRate: 0.2,
  examBasePoints: 50,
  examBonus80: 15,
  examBonus90: 25,
  examAppearanceRatio: 0.2,
  examSafetyRatio: 0.46,
  wrongQuestionReviewAward: { appearancePoints: 2, safetyPoints: 7, scenePoints: 3 },
  streakAwards: {
    threeDay: { appearancePoints: 6, safetyPoints: 8, scenePoints: 4 },
    sevenDay: { appearancePoints: 10, safetyPoints: 12, scenePoints: 8 },
  },
  appearanceThresholds: [
    { threshold: 0, label: "基础形态" },
    { threshold: 80, label: "安全头盔" },
    { threshold: 180, label: "反光背心" },
    { threshold: 320, label: "守护披风" },
  ],
  safetyThresholds: [
    { threshold: 0, label: "基础观察" },
    { threshold: 80, label: "识别进阶" },
    { threshold: 180, label: "判断熟练" },
    { threshold: 320, label: "综合守护" },
  ],
  sceneThresholds: [
    { threshold: 0, label: "城市街道" },
    { threshold: 160, label: "校园周边" },
    { threshold: 320, label: "出行路上" },
  ],
  stageThresholds: [
    {
      threshold: 0,
      label: "安全萌芽期",
      summary: "正在建立基础安全习惯，继续完成关卡和复学任务会有明显成长。",
    },
    {
      threshold: 120,
      label: "守护进阶期",
      summary: "已经完成核心能力积累，适合通过考试和错题回看继续冲刺升级。",
    },
    {
      threshold: 260,
      label: "安全守护期",
      summary: "已经形成比较稳定的道路安全学习闭环，可持续强化迁移应用。",
    },
  ],
};
