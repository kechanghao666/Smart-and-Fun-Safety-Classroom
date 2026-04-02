import { getDb } from "../db/connection";
import {
  adminModules,
  adminStatMetrics,
  adminUserSeedSummaries,
  aiCopyTemplateItems,
  examQuestions,
  levelBlueprints,
  levelManagementItems,
  questionBankManagementItems,
  teacherClassSummaries,
  teacherStaticDetails,
  teacherStaticStudents,
  themeManagementItems,
} from "../constants/content";
import type {
  AdminUserSummary,
  TeacherStudentDetail,
  TeacherStudentSummary,
} from "../types/contracts";
import { HttpError } from "../utils/httpError";
import { buildStudentProgress } from "./studentService";

function formatExamStatus(status: "locked" | "available" | "in_progress" | "completed") {
  if (status === "completed") {
    return "已完成考试";
  }

  if (status === "available") {
    return "已解锁未考试";
  }

  return "未解锁考试";
}

function inferWeakSpot(progress: Awaited<ReturnType<typeof buildStudentProgress>>) {
  if (progress.exam.status === "completed" && progress.exam.wrongQuestionIds.length === 0) {
    return "整体表现稳定，可继续强化乘车礼仪。";
  }

  if (progress.exam.wrongQuestionIds.includes("q-3")) {
    return "对公交车盲区理解还不稳定。";
  }

  if (progress.levels.filter((item) => item.status === "completed").length >= 2) {
    return "路线判断易受同伴影响，需要加强独立安全选择。";
  }

  return "基础安全观察还需要继续巩固。";
}

function buildGrowthStage(progress: Awaited<ReturnType<typeof buildStudentProgress>>) {
  if (progress.exam.status === "completed") {
    return {
      growthStage: "安全守护期",
      growthSummary: "已经完成三关与考试，成长阶段和学习节奏都比较稳定。",
      motivationLabel: "适合承担课堂示范任务",
    };
  }

  if (progress.levels.filter((item) => item.status === "completed").length >= 2) {
    return {
      growthStage: "守护进阶期",
      growthSummary: "前两关推进较快，但还缺最后一关和考试收口。",
      motivationLabel: "需要鼓励完成完整闭环",
    };
  }

  return {
    growthStage: "安全萌芽期",
    growthSummary: "仍在建立基础观察习惯，需要从关卡复习里持续巩固。",
    motivationLabel: "需要分段鼓励和即时反馈",
  };
}

async function buildDynamicStudentSummary(): Promise<TeacherStudentSummary> {
  const db = await getDb();
  const user = await db.get<{
    id: string;
    display_name: string;
    class_name: string;
    updated_at: string;
  }>(
    `
      SELECT users.id, users.display_name, student_profiles.class_name, student_profiles.updated_at
      FROM users
      INNER JOIN student_profiles ON student_profiles.user_id = users.id
      WHERE users.account = 'student001'
    `,
  );

  if (!user) {
    throw new HttpError(404, "未找到学生演示数据。");
  }

  const progress = await buildStudentProgress(user.id);

  return {
    id: user.id,
    name: user.display_name,
    className: user.class_name,
    completedLevels: progress.levels.filter((item) => item.status === "completed").length,
    examStatus: formatExamStatus(progress.exam.status),
    score: progress.exam.score,
    lastActiveAt: user.updated_at,
    weakSpot: inferWeakSpot(progress),
  };
}

export async function getTeacherDashboard() {
  return {
    classSummaries: teacherClassSummaries,
    students: [await buildDynamicStudentSummary(), ...teacherStaticStudents],
  };
}

export async function getTeacherStudents() {
  return [await buildDynamicStudentSummary(), ...teacherStaticStudents];
}

export async function getTeacherStudentDetail(studentId: string): Promise<TeacherStudentDetail> {
  if (studentId !== "stu-1") {
    const detail = teacherStaticDetails.find((item) => item.id === studentId);

    if (!detail) {
      throw new HttpError(404, "未找到该学生的学习结果。");
    }

    return detail;
  }

  const summary = await buildDynamicStudentSummary();
  const progress = await buildStudentProgress(studentId);
  const growth = buildGrowthStage(progress);
  const wrongTopics =
    progress.exam.status === "completed"
      ? examQuestions
          .filter((question) => progress.exam.wrongQuestionIds.includes(question.id))
          .map((question) => question.reviewLabel)
      : [progress.exam.status === "available" ? "尚未进入主题考试" : "考试尚未解锁"];

  return {
    ...summary,
    ...growth,
    levelStatuses: levelBlueprints.map((level) => ({
      levelId: level.id,
      title: level.title.replace("·", ":"),
      status: progress.levels.find((item) => item.id === level.id)?.status ?? "locked",
      score: progress.levelResults[level.id]?.score ?? null,
      note:
        progress.levelResults[level.id]?.aiSummary ??
        (level.id === "level-1"
          ? "建议继续巩固基础观察力。"
          : level.id === "level-2"
            ? "建议继续完成路线判断训练。"
            : "完成第二关后自动解锁。"),
    })),
    wrongTopics,
    recommendations:
      progress.exam.status === "completed"
        ? progress.exam.wrongQuestionIds.length
          ? ["先回看错题对应关卡", "再完成一次重点知识点复习"]
          : ["维持当前节奏", "可作为课堂示范学生分享安全观察方法"]
        : ["按顺序完成剩余关卡", "完成三关后及时进入主题考试"],
  };
}

export async function getAdminModules() {
  return adminModules;
}

export async function getAdminThemes() {
  return themeManagementItems;
}

export async function getAdminLevels() {
  return levelManagementItems;
}

export async function getAdminQuestionBank() {
  return questionBankManagementItems;
}

export async function getAdminAiCopy() {
  return aiCopyTemplateItems;
}

export async function getAdminUsers(): Promise<AdminUserSummary[]> {
  const db = await getDb();
  const users = await db.all<{
    id: string;
    account: string;
    role: "student" | "teacher" | "admin";
    updated_at: string;
  }[]>("SELECT id, account, role, updated_at FROM users ORDER BY account ASC");

  if (!users.length) {
    return adminUserSeedSummaries;
  }

  return users.map((user) => ({
    id: `user-${user.id}`,
    name: user.account,
    role: user.role,
    status: "active",
    lastActiveAt: user.updated_at,
    note: "系统 seed 账号",
  }));
}

export async function getAdminStats() {
  return {
    metrics: adminStatMetrics,
    classSummaries: teacherClassSummaries,
  };
}
