import { adminModules } from "../constants/content";
import { getDb } from "../db/connection";
import type {
  AdminStatMetric,
  AdminUserStatus,
  AdminUserSummary,
  TeacherClassManagementItem,
  TeacherClassRow,
  TeacherStudentDetail,
  TeacherStudentSummary,
  UserRole,
} from "../types/contracts";
import { HttpError } from "../utils/httpError";
import { getLatestLearningRecordTime, getGrowthProfile } from "./growthService";
import {
  getStudentExamReview,
  getStudentGrowth,
} from "./studentInsightsService";
import { buildStudentProgress } from "./studentService";

interface StudentContext {
  id: string;
  name: string;
  className: string;
  progress: Awaited<ReturnType<typeof buildStudentProgress>>;
  lastActiveAt: string;
  weakSpot: string;
}

function formatExamStatus(status: "locked" | "available" | "in_progress" | "completed") {
  if (status === "completed") {
    return "已完成考试";
  }

  if (status === "available" || status === "in_progress") {
    return "已解锁未考试";
  }

  return "未解锁考试";
}

function formatDateTimeLabel(value: string | null) {
  if (!value) {
    return "暂无记录";
  }

  const date = new Date(value);
  const now = new Date();
  const diffDays = Math.floor(
    (new Date(now.toDateString()).getTime() - new Date(date.toDateString()).getTime()) /
      (24 * 60 * 60 * 1000),
  );
  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");

  if (diffDays === 0) {
    return `今天 ${hour}:${minute}`;
  }

  if (diffDays === 1) {
    return `昨天 ${hour}:${minute}`;
  }

  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day} ${hour}:${minute}`;
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

  return "基础安全观察仍需通过关卡练习持续巩固。";
}

function matchesCompletionFilter(
  completedLevels: number,
  filter: string | undefined,
) {
  if (!filter || filter === "all") {
    return true;
  }

  const normalized = filter.trim().toLowerCase();

  if (["completed", "all-completed", "已完成"].includes(normalized)) {
    return completedLevels === 3;
  }

  if (["partial", "in-progress", "进行中", "未完成"].includes(normalized)) {
    return completedLevels > 0 && completedLevels < 3;
  }

  if (["not_started", "locked", "未开始"].includes(normalized)) {
    return completedLevels === 0;
  }

  return true;
}

function matchesExamFilter(
  examStatus: Awaited<ReturnType<typeof buildStudentProgress>>["exam"]["status"],
  filter: string | undefined,
) {
  if (!filter || filter === "all") {
    return true;
  }

  const normalized = filter.trim().toLowerCase();

  if (["completed", "已完成考试"].includes(normalized)) {
    return examStatus === "completed";
  }

  if (["available", "unlocked", "已解锁未考试"].includes(normalized)) {
    return examStatus === "available" || examStatus === "in_progress";
  }

  if (["locked", "未解锁考试"].includes(normalized)) {
    return examStatus === "locked";
  }

  return true;
}

function pickFocusLabel(students: StudentContext[]) {
  if (!students.length) {
    return "暂无学生数据";
  }

  const counter = new Map<string, number>();

  for (const student of students) {
    counter.set(student.weakSpot, (counter.get(student.weakSpot) ?? 0) + 1);
  }

  return [...counter.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? "暂无学生数据";
}

async function getStudentRoster() {
  const db = await getDb();

  return db.all<
    Array<{
      id: string;
      account: string;
      display_name: string;
      class_name: string;
      profile_updated_at: string;
    }>
  >(
    `
      SELECT
        users.id,
        users.account,
        users.display_name,
        student_profiles.class_name,
        student_profiles.updated_at AS profile_updated_at
      FROM users
      INNER JOIN student_profiles ON student_profiles.user_id = users.id
      WHERE users.role = 'student'
      ORDER BY student_profiles.class_name ASC, users.account ASC
    `,
  );
}

async function buildStudentContext(
  user: Awaited<ReturnType<typeof getStudentRoster>>[number],
): Promise<StudentContext> {
  const progress = await buildStudentProgress(user.id);
  const lastActive =
    (await getLatestLearningRecordTime(user.id)) ?? user.profile_updated_at;

  return {
    id: user.id,
    name: user.display_name,
    className: user.class_name,
    progress,
    lastActiveAt: formatDateTimeLabel(lastActive),
    weakSpot: inferWeakSpot(progress),
  };
}

function toTeacherStudentSummary(student: StudentContext): TeacherStudentSummary {
  return {
    id: student.id,
    name: student.name,
    className: student.className,
    completedLevels: student.progress.levels.filter((level) => level.status === "completed")
      .length,
    examStatus: formatExamStatus(student.progress.exam.status),
    score: student.progress.exam.score,
    lastActiveAt: student.lastActiveAt,
    weakSpot: student.weakSpot,
  };
}

async function buildTeacherClassSummaries(teacherUserId?: string) {
  const db = await getDb();
  const roster = await Promise.all((await getStudentRoster()).map(buildStudentContext));
  const classRows = await db.all<TeacherClassRow[]>(
    `
      SELECT id, teacher_user_id, name, description, created_at, updated_at
      FROM teacher_classes
      ${teacherUserId ? "WHERE teacher_user_id = ?" : ""}
      ORDER BY created_at ASC
    `,
    ...(teacherUserId ? [teacherUserId] : []),
  );

  const classMap = new Map<string, TeacherClassManagementItem>();

  for (const row of classRows) {
    const students = roster.filter((student) => student.className === row.name);
    const completed = students.filter(
      (student) =>
        student.progress.levels.filter((level) => level.status === "completed").length === 3,
    ).length;
    const examCompleted = students.filter(
      (student) => student.progress.exam.status === "completed",
    ).length;

    classMap.set(row.name, {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
      studentCount: students.length,
      completedRate: students.length ? Math.round((completed / students.length) * 100) : 0,
      examCompletionRate: students.length
        ? Math.round((examCompleted / students.length) * 100)
        : 0,
      focusLabel: pickFocusLabel(students),
    });
  }

  for (const student of roster) {
    if (!classMap.has(student.className)) {
      const students = roster.filter((item) => item.className === student.className);
      const completed = students.filter(
        (item) => item.progress.levels.filter((level) => level.status === "completed").length === 3,
      ).length;
      const examCompleted = students.filter(
        (item) => item.progress.exam.status === "completed",
      ).length;

      classMap.set(student.className, {
        id: `auto-${student.className}`,
        name: student.className,
        description: "根据学生档案自动识别的班级信息",
        createdAt: new Date().toISOString(),
        studentCount: students.length,
        completedRate: students.length ? Math.round((completed / students.length) * 100) : 0,
        examCompletionRate: students.length
          ? Math.round((examCompleted / students.length) * 100)
          : 0,
        focusLabel: pickFocusLabel(students),
      });
    }
  }

  return [...classMap.values()].sort((left, right) => left.name.localeCompare(right.name, "zh-CN"));
}

export async function getTeacherDashboard(teacherUserId: string) {
  const [classSummaries, roster] = await Promise.all([
    buildTeacherClassSummaries(teacherUserId),
    Promise.all((await getStudentRoster()).map(buildStudentContext)),
  ]);
  const students = roster.map(toTeacherStudentSummary);
  const alerts = students
    .filter(
      (student) => student.completedLevels < 3 || student.examStatus !== "已完成考试",
    )
    .slice(0, 5)
    .map((student) => `${student.name}：${student.weakSpot}`);

  return {
    classSummaries,
    students,
    alerts,
  };
}

export async function getTeacherClasses(teacherUserId: string) {
  return buildTeacherClassSummaries(teacherUserId);
}

export async function createTeacherClass(
  teacherUserId: string,
  input: { id?: string; name?: string; description?: string },
) {
  const name = String(input.name ?? "").trim();
  const description = String(input.description ?? "").trim();

  if (!name) {
    throw new HttpError(400, "班级名称不能为空。");
  }

  const db = await getDb();
  const existing = await db.get<{ id: string }>(
    "SELECT id FROM teacher_classes WHERE name = ?",
    name,
  );

  if (existing) {
    throw new HttpError(409, "该班级名称已存在。");
  }

  const now = new Date().toISOString();
  const classId = String(input.id ?? `class-${Date.now()}`);
  await db.run(
    `
      INSERT INTO teacher_classes (id, teacher_user_id, name, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    classId,
    teacherUserId,
    name,
    description,
    now,
    now,
  );

  return (await getTeacherClasses(teacherUserId)).find((item) => item.id === classId) ?? null;
}

export async function updateTeacherClass(
  teacherUserId: string,
  classId: string,
  input: { name?: string; description?: string },
) {
  const db = await getDb();
  const existing = await db.get<TeacherClassRow>(
    `
      SELECT id, teacher_user_id, name, description, created_at, updated_at
      FROM teacher_classes
      WHERE id = ? AND teacher_user_id = ?
    `,
    classId,
    teacherUserId,
  );

  if (!existing) {
    throw new HttpError(404, "未找到对应班级。");
  }

  const nextName =
    typeof input.name === "string" && input.name.trim() ? input.name.trim() : existing.name;
  const nextDescription =
    typeof input.description === "string" ? input.description.trim() : existing.description;

  const duplicate = await db.get<{ id: string }>(
    "SELECT id FROM teacher_classes WHERE name = ? AND id != ?",
    nextName,
    classId,
  );

  if (duplicate) {
    throw new HttpError(409, "新的班级名称已被占用。");
  }

  await db.run(
    `
      UPDATE teacher_classes
      SET name = ?, description = ?, updated_at = ?
      WHERE id = ?
    `,
    nextName,
    nextDescription,
    new Date().toISOString(),
    classId,
  );

  if (existing.name !== nextName) {
    await db.run(
      `
        UPDATE student_profiles
        SET class_name = ?, updated_at = ?
        WHERE class_name = ?
      `,
      nextName,
      new Date().toISOString(),
      existing.name,
    );
  }

  return (await getTeacherClasses(teacherUserId)).find((item) => item.id === classId) ?? null;
}

export async function getTeacherStudents(
  _teacherUserId: string,
  filters?: {
    className?: string;
    completionStatus?: string;
    examStatus?: string;
  },
) {
  const roster = await Promise.all((await getStudentRoster()).map(buildStudentContext));

  return roster
    .filter((student) =>
      !filters?.className || filters.className === "all"
        ? true
        : student.className === filters.className,
    )
    .filter((student) =>
      matchesCompletionFilter(
        student.progress.levels.filter((level) => level.status === "completed").length,
        filters?.completionStatus,
      ),
    )
    .filter((student) => matchesExamFilter(student.progress.exam.status, filters?.examStatus))
    .map(toTeacherStudentSummary);
}

export async function getTeacherStudentDetail(studentId: string): Promise<TeacherStudentDetail> {
  const user = (await getStudentRoster()).find((item) => item.id === studentId);

  if (!user) {
    throw new HttpError(404, "未找到该学生的学习结果。");
  }

  const [context, review, growth] = await Promise.all([
    buildStudentContext(user),
    getStudentExamReview(studentId),
    getStudentGrowth(studentId),
  ]);
  const summary = toTeacherStudentSummary(context);

  return {
    ...summary,
    growthStage: growth.stageLabel,
    growthSummary: growth.growthSummary,
    motivationLabel:
      growth.stageLabel === "安全守护期"
        ? "适合承担课堂示范任务"
        : growth.stageLabel === "守护进阶期"
          ? "需要鼓励完成完整闭环"
          : "需要分段鼓励和即时反馈",
    levelStatuses: context.progress.levels.map((level) => ({
      levelId: level.id,
      title: level.title.replace(" · ", "："),
      status: level.status,
      score: context.progress.levelResults[level.id]?.score ?? null,
      note:
        context.progress.levelResults[level.id]?.aiSummary ??
        (level.status === "completed"
          ? "已完成本关学习，可继续查看结算反馈。"
          : level.status === "available"
            ? "已解锁，可继续进入当前关卡。"
            : "需按顺序完成前置关卡后自动解锁。"),
    })),
    wrongTopics:
      review.items.length > 0
        ? review.items.map((item) => item.reviewLabel)
        : [context.progress.exam.status === "completed" ? "本次无错题" : "考试尚未完成"],
    recommendations:
      review.items.length > 0
        ? [
            "先引导学生查看错题解析，再回到对应关卡完成重学。",
            "结合成长档案中的能力标签，提醒学生聚焦薄弱知识点。",
          ]
        : context.progress.exam.status === "completed"
          ? [
              "可作为课堂示范学生分享安全观察与判断方法。",
              "继续维持稳定节奏，巩固乘车礼仪与盲区判断。",
            ]
          : [
              "按顺序完成剩余关卡，三关完成后及时进入主题考试。",
              "课后可结合 AI 助手继续围绕道路安全主题做针对性提问。",
            ],
    growthPoints: growth.totalGrowthPoints,
    unlockedScenes: growth.unlockedScenes,
  };
}

export async function getAdminModules() {
  return adminModules;
}

function normalizeRoleFilter(value: string | undefined): UserRole | null {
  if (value === "student" || value === "teacher" || value === "admin") {
    return value;
  }

  return null;
}

function normalizeStatusFilter(value: string | undefined): AdminUserStatus | null {
  if (value === "active" || value === "paused") {
    return value;
  }

  return null;
}

async function getUserLastActiveLabel(userId: string, fallback: string) {
  return formatDateTimeLabel((await getLatestLearningRecordTime(userId)) ?? fallback);
}

export async function getAdminUsers(filters?: {
  query?: string;
  status?: string;
  role?: string;
}): Promise<AdminUserSummary[]> {
  const db = await getDb();
  const users = await db.all<
    Array<{
      id: string;
      account: string;
      role: UserRole;
      status: AdminUserStatus;
      admin_note: string;
      created_at: string;
      updated_at: string;
      display_name: string;
    }>
  >(
    `
      SELECT id, account, role, status, admin_note, created_at, updated_at, display_name
      FROM users
      ORDER BY created_at ASC, account ASC
    `,
  );

  const query = String(filters?.query ?? "").trim().toLowerCase();
  const roleFilter = normalizeRoleFilter(filters?.role);
  const statusFilter = normalizeStatusFilter(filters?.status);

  const filtered = users.filter((user) => {
    if (roleFilter && user.role !== roleFilter) {
      return false;
    }

    if (statusFilter && user.status !== statusFilter) {
      return false;
    }

    if (!query) {
      return true;
    }

    return (
      user.account.toLowerCase().includes(query) ||
      user.display_name.toLowerCase().includes(query) ||
      user.admin_note.toLowerCase().includes(query)
    );
  });

  return Promise.all(
    filtered.map(async (user) => ({
      id: user.id,
      name: user.account,
      role: user.role,
      status: user.status,
      lastActiveAt: await getUserLastActiveLabel(user.id, user.updated_at),
      note: user.admin_note || `${user.role} 账号`,
      createdAt: formatDateTimeLabel(user.created_at),
    })),
  );
}

export async function updateAdminUser(
  userId: string,
  input: { status?: AdminUserStatus; note?: string },
) {
  const db = await getDb();
  const existing = await db.get<{
    id: string;
    status: AdminUserStatus;
    admin_note: string;
  }>(
    `
      SELECT id, status, admin_note
      FROM users
      WHERE id = ?
    `,
    userId,
  );

  if (!existing) {
    throw new HttpError(404, "未找到对应用户。");
  }

  const nextStatus =
    input.status === "active" || input.status === "paused" ? input.status : existing.status;
  const nextNote =
    typeof input.note === "string" ? input.note.trim() : existing.admin_note;

  await db.run(
    `
      UPDATE users
      SET status = ?, admin_note = ?, updated_at = ?
      WHERE id = ?
    `,
    nextStatus,
    nextNote,
    new Date().toISOString(),
    userId,
  );

  if (nextStatus === "paused") {
    await db.run("DELETE FROM sessions WHERE user_id = ?", userId);
  }

  return (await getAdminUsers()).find((user) => user.id === userId) ?? null;
}

function buildMetric(
  id: string,
  label: string,
  value: string,
  trend: string,
  accent: AdminStatMetric["accent"],
): AdminStatMetric {
  return { id, label, value, trend, accent };
}

export async function getAdminStats() {
  const db = await getDb();
  const roster = await Promise.all((await getStudentRoster()).map(buildStudentContext));
  const classSummaries = await buildTeacherClassSummaries();
  const studentCount = roster.length;
  const completedAll = roster.filter(
    (student) =>
      student.progress.levels.filter((level) => level.status === "completed").length === 3,
  ).length;
  const examCompleted = roster.filter(
    (student) => student.progress.exam.status === "completed",
  );
  const averageScore =
    examCompleted.length > 0
      ? Math.round(
          examCompleted.reduce(
            (sum, student) => sum + (student.progress.exam.score ?? 0),
            0,
          ) / examCompleted.length,
        )
      : 0;
  const completionRate = studentCount
    ? Math.round((completedAll / studentCount) * 100)
    : 0;
  const examCompletionRate = studentCount
    ? Math.round((examCompleted.length / studentCount) * 100)
    : 0;
  const interactionCounts = await db.get<{
    level_started: number;
    level_completed: number;
    exam_completed: number;
    review_completed: number;
  }>(`
      SELECT
        SUM(CASE WHEN started_at IS NOT NULL THEN 1 ELSE 0 END) AS level_started,
        SUM(CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END) AS level_completed,
        (SELECT COUNT(*) FROM exam_submissions) AS exam_completed,
        (SELECT COUNT(*) FROM question_review_progress) AS review_completed
      FROM level_progress
    `);
  const pausedUsers = await db.get<{ count: number }>(
    "SELECT COUNT(*) AS count FROM users WHERE status = 'paused'",
  );
  const growthProfiles = await Promise.all(roster.map((student) => getGrowthProfile(student.id)));
  const validGrowthProfiles = growthProfiles.filter(
    (item): item is NonNullable<typeof item> => Boolean(item),
  );
  const averageGrowthPoints = validGrowthProfiles.length
    ? Math.round(
        validGrowthProfiles.reduce(
          (sum, item) => sum + item.profile.total_points,
          0,
        ) / validGrowthProfiles.length,
      )
    : 0;
  const appearanceUnlockRate = validGrowthProfiles.length
    ? Math.round(
        (validGrowthProfiles.filter((item) => item.profile.appearance_points >= 80).length /
          validGrowthProfiles.length) *
          100,
      )
    : 0;
  const sceneUnlockRate = validGrowthProfiles.length
    ? Math.round(
        (validGrowthProfiles.filter((item) => item.profile.scene_points >= 160).length /
          validGrowthProfiles.length) *
          100,
      )
    : 0;
  const themeVisits =
    (interactionCounts?.level_started ?? 0) +
    (interactionCounts?.level_completed ?? 0) +
    (interactionCounts?.exam_completed ?? 0) +
    (interactionCounts?.review_completed ?? 0);

  return {
    metrics: [
      buildMetric(
        "visits",
        "主题访问量",
        `${themeVisits}`,
        `来自 ${studentCount} 名学生的实时学习行为`,
        "sky",
      ),
      buildMetric(
        "completion",
        "三关完成率",
        `${completionRate}%`,
        `已完成学生 ${completedAll}/${studentCount}`,
        "mint",
      ),
      buildMetric(
        "exam-completion",
        "考试完成率",
        `${examCompletionRate}%`,
        `已完成考试 ${examCompleted.length}/${studentCount}`,
        "orange",
      ),
      buildMetric(
        "exam-average",
        "考试平均分",
        `${averageScore}`,
        examCompleted.length ? "基于最新考试结果实时计算" : "暂无考试成绩",
        "sky",
      ),
    ],
    classSummaries,
    alerts: [
      pausedUsers?.count
        ? `当前有 ${pausedUsers.count} 个已暂停账号需要关注。`
        : "当前没有已暂停账号。",
      studentCount - completedAll > 0
        ? `还有 ${studentCount - completedAll} 名学生尚未完成三关学习。`
        : "所有学生都已完成三关学习。",
      examCompleted.filter((student) => (student.progress.exam.score ?? 0) < 80).length
        ? `有 ${
            examCompleted.filter((student) => (student.progress.exam.score ?? 0) < 80).length
          } 名学生考试成绩低于 80 分。`
        : "当前考试成绩整体稳定。",
    ],
    growthOverview: {
      averageGrowthPoints,
      appearanceUnlockRate,
      sceneUnlockRate,
    },
  };
}
