import { randomUUID } from "crypto";
import { getDb } from "../db/connection";
import {
  BASE_BADGES,
  EXAM_COMPLETION_POINTS,
  EXAM_HIGH_SCORE_POINTS,
  levelBadgeMap,
  levelBlueprints,
  LEVEL_COMPLETION_POINTS,
  levelResultTemplates,
  THEME_ID,
} from "../constants/content";
import {
  getExamQuestionsFromDb,
  getLevelBlueprintsFromDb,
  getThemeTitle,
} from "./courseContentService";
import {
  getStudentRewardProgress,
  logLearningRecord,
  syncProgressBasedGrowthEvents,
} from "./growthService";
import type {
  CompleteLevelResponse,
  ExamSubmissionRow,
  LevelId,
  LevelProgressRow,
  LevelResult,
  StudentExamAnswer,
  StudentProfile,
  StudentProfileRow,
  StudentProgress,
} from "../types/contracts";
import { HttpError } from "../utils/httpError";

function parseBadges(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : BASE_BADGES;
  } catch {
    return BASE_BADGES;
  }
}

function parseStringArray(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function parseStudentAnswers(value: string) {
  try {
    const parsed = JSON.parse(value) as Array<{
      questionId: string;
      selectedIndex: number;
    }>;

    return parsed.reduce<Partial<Record<string, number>>>((result, item) => {
      if (item && typeof item.questionId === "string" && typeof item.selectedIndex === "number") {
        result[item.questionId] = item.selectedIndex;
      }
      return result;
    }, {});
  } catch {
    return {};
  }
}

function isLevelId(value: string): value is LevelId {
  return value === "level-1" || value === "level-2" || value === "level-3";
}

export function parseLevelId(value: string) {
  if (!isLevelId(value)) {
    throw new HttpError(400, "鍏冲崱缂栧彿鏃犳晥銆?);
  }

  return value;
}

async function ensureStudentState(userId: string) {
  const db = await getDb();
  const profile = await db.get<{ user_id: string }>(
    "SELECT user_id FROM student_profiles WHERE user_id = ?",
    userId,
  );

  if (!profile) {
    const now = new Date().toISOString();

    await db.run(
      `
        INSERT INTO student_profiles (
          user_id, nickname, avatar_id, avatar_label, stage, class_name,
          base_points, starter_badges_json, last_visited_route, created_at, updated_at
        )
        VALUES (?, NULL, NULL, NULL, NULL, '涓夊勾绾э紙2锛夌彮', 120, '["瑙傚療鍛樻柊鏄?]', '/student/home', ?, ?)
      `,
      userId,
      now,
      now,
    );
  }

  for (const [index, level] of levelBlueprints.entries()) {
    const row = await db.get<{ user_id: string }>(
      "SELECT user_id FROM level_progress WHERE user_id = ? AND level_id = ?",
      userId,
      level.id,
    );

    if (!row) {
      await db.run(
        `
          INSERT INTO level_progress (
            user_id, level_id, status, score, stars, highlight, caution, ai_summary,
            started_at, completed_at, updated_at
          )
          VALUES (?, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ?)
        `,
        userId,
        level.id,
        index === 0 ? "available" : "locked",
        new Date().toISOString(),
      );
    }
  }
}

async function getStudentProfileRow(userId: string) {
  const db = await getDb();
  await ensureStudentState(userId);

  return db.get<StudentProfileRow>(
    `
      SELECT
        user_id, nickname, avatar_id, avatar_label, stage, class_name,
        base_points, starter_badges_json, last_visited_route, created_at, updated_at
      FROM student_profiles
      WHERE user_id = ?
    `,
    userId,
  );
}

async function getLevelRows(userId: string) {
  const db = await getDb();
  await ensureStudentState(userId);
  const rows = await db.all<LevelProgressRow[]>(
    `
      SELECT
        user_id, level_id, status, score, stars, highlight, caution, ai_summary,
        started_at, completed_at, updated_at
      FROM level_progress
      WHERE user_id = ?
    `,
    userId,
  );

  return [...rows].sort(
    (left, right) =>
      levelBlueprints.findIndex((item) => item.id === left.level_id) -
      levelBlueprints.findIndex((item) => item.id === right.level_id),
  );
}

async function getLatestExamSubmission(userId: string) {
  const db = await getDb();

  return db.get<ExamSubmissionRow>(
    `
      SELECT id, user_id, answers_json, score, wrong_question_ids_json, submitted_at
      FROM exam_submissions
      WHERE user_id = ?
      ORDER BY submitted_at DESC
      LIMIT 1
    `,
    userId,
  );
}

async function updateLastVisitedRoute(userId: string, route: string) {
  const db = await getDb();
  await db.run(
    `
      UPDATE student_profiles
      SET last_visited_route = ?, updated_at = ?
      WHERE user_id = ?
    `,
    route,
    new Date().toISOString(),
    userId,
  );
}

export async function getStudentProfile(userId: string): Promise<StudentProfile | null> {
  const row = await getStudentProfileRow(userId);

  if (!row?.nickname || !row.avatar_id || !row.avatar_label || !row.stage) {
    return null;
  }

  return {
    nickname: row.nickname,
    avatarId: row.avatar_id,
    avatarLabel: row.avatar_label,
    stage: row.stage,
  };
}

export async function saveStudentProfile(
  userId: string,
  input: StudentProfile,
): Promise<StudentProfile> {
  const db = await getDb();
  await ensureStudentState(userId);
  const now = new Date().toISOString();

  await db.run(
    `
      UPDATE student_profiles
      SET nickname = ?, avatar_id = ?, avatar_label = ?, stage = ?, updated_at = ?
      WHERE user_id = ?
    `,
    input.nickname.trim(),
    input.avatarId,
    input.avatarLabel,
    input.stage,
    now,
    userId,
  );

  const profile = await getStudentProfile(userId);

  if (!profile) {
    throw new HttpError(500, "瀛︾敓璧勬枡淇濆瓨澶辫触銆?);
  }

  await logLearningRecord({
    userId,
    type: "profile_updated",
    title: "瀹屾垚棣栨鍩虹淇℃伅琛ュ厖",
    description: "鏄电О銆佸ご鍍忓拰瀛︽淇℃伅宸蹭繚瀛橈紝鍙户缁繘鍏ラ亾璺畨鍏ㄤ富棰樺涔犮€?,
    route: "/student/profile-setup",
    dedupeKey: `record:profile:${userId}`,
  });

  return profile;
}

export async function buildStudentProgress(userId: string): Promise<StudentProgress> {
  const [profileRow, levelRows, submission, levelCatalog, themeTitle, examQuestions, rewardProgress] =
    await Promise.all([
      getStudentProfileRow(userId),
      getLevelRows(userId),
      getLatestExamSubmission(userId),
      getLevelBlueprintsFromDb(),
      getThemeTitle(),
      getExamQuestionsFromDb(),
      getStudentRewardProgress(userId),
    ]);

  if (!profileRow) {
    throw new HttpError(404, "鏈壘鍒板鐢熸。妗堛€?);
  }

  const completedLevels = levelRows.filter((row) => row.status === "completed");
  const allCompleted = completedLevels.length === levelBlueprints.length;
  const baseBadges = parseBadges(profileRow.starter_badges_json);
  const badges = Array.from(
    new Set([
      ...baseBadges,
      ...completedLevels.map((row) => levelBadgeMap[row.level_id]),
      ...(submission && submission.score >= 80 ? ["閬撹矾瀹夊叏灏忓崼澹?] : []),
    ]),
  );
  const points =
    profileRow.base_points +
    completedLevels.length * LEVEL_COMPLETION_POINTS +
    (submission
      ? submission.score >= 80
        ? EXAM_HIGH_SCORE_POINTS
        : EXAM_COMPLETION_POINTS
      : 0);

  const levelResults = completedLevels.reduce<Partial<Record<LevelId, LevelResult>>>(
    (resultMap, row) => {
      if (
        row.score === null ||
        row.stars === null ||
        !row.completed_at ||
        !row.highlight ||
        !row.caution ||
        !row.ai_summary
      ) {
        return resultMap;
      }

      resultMap[row.level_id] = {
        levelId: row.level_id,
        score: row.score,
        stars: row.stars,
        completedAt: row.completed_at,
        highlight: row.highlight,
        caution: row.caution,
        aiSummary: row.ai_summary,
      };
      return resultMap;
    },
    {},
  );

  return {
    themeId: THEME_ID,
    themeTitle,
    lastVisitedRoute: profileRow.last_visited_route,
    points,
    badges,
    levels: levelCatalog.map((level) => {
      const row = levelRows.find((item) => item.level_id === level.id);

      return {
        ...level,
        status: row?.status ?? "locked",
      };
    }),
    levelResults,
    exam: {
      status: submission ? "completed" : allCompleted ? "available" : "locked",
      totalQuestions: examQuestions.length,
      score: submission?.score ?? null,
      wrongQuestionIds: submission ? parseStringArray(submission.wrong_question_ids_json) : [],
      studentAnswers: submission ? parseStudentAnswers(submission.answers_json) : {},
    },
    rewardProgress,
  };
}

export async function startLevel(
  userId: string,
  levelId: LevelId,
): Promise<StudentProgress> {
  const db = await getDb();
  await ensureStudentState(userId);
  const row = await db.get<LevelProgressRow>(
    `
      SELECT
        user_id, level_id, status, score, stars, highlight, caution, ai_summary,
        started_at, completed_at, updated_at
      FROM level_progress
      WHERE user_id = ? AND level_id = ?
    `,
    userId,
    levelId,
  );

  if (!row) {
    throw new HttpError(404, "鏈壘鍒板叧鍗¤繘搴︺€?);
  }

  if (row.status === "locked") {
    throw new HttpError(409, "褰撳墠鍏冲崱灏氭湭瑙ｉ攣銆?);
  }

  if (row.status === "available") {
    const startedAt = new Date().toISOString();
    await db.run(
      `
        UPDATE level_progress
        SET status = 'in_progress', started_at = COALESCE(started_at, ?), updated_at = ?
        WHERE user_id = ? AND level_id = ?
      `,
      startedAt,
      startedAt,
      userId,
      levelId,
    );

    await logLearningRecord({
      userId,
      type: "level_started",
      title: `寮€濮?{levelBlueprints.find((item) => item.id === levelId)?.title ?? levelId}`,
      description: "绯荤粺宸茶褰曞綋鍓嶅叧鍗′綅缃紝绋嶅悗鍙€氳繃鈥滅户缁涔犫€濈洿鎺ヨ繑鍥炪€?,
      route: `/student/theme/${THEME_ID}/level/${levelId}`,
      createdAt: startedAt,
      dedupeKey: `record:start:${userId}:${levelId}`,
    });
  }

  await updateLastVisitedRoute(userId, `/student/theme/${THEME_ID}/level/${levelId}`);
  return buildStudentProgress(userId);
}

export async function completeLevel(
  userId: string,
  levelId: LevelId,
): Promise<CompleteLevelResponse> {
  const db = await getDb();
  await ensureStudentState(userId);
  const row = await db.get<LevelProgressRow>(
    `
      SELECT
        user_id, level_id, status, score, stars, highlight, caution, ai_summary,
        started_at, completed_at, updated_at
      FROM level_progress
      WHERE user_id = ? AND level_id = ?
    `,
    userId,
    levelId,
  );

  if (!row) {
    throw new HttpError(404, "鏈壘鍒板叧鍗¤繘搴︺€?);
  }

  if (row.status === "locked") {
    throw new HttpError(409, "璇峰厛瀹屾垚鍓嶄竴鍏冲悗鍐嶈繘鍏ュ綋鍓嶅叧鍗°€?);
  }

  const now = new Date().toISOString();
  const template = levelResultTemplates[levelId];

  if (row.status !== "completed") {
    await db.run(
      `
        UPDATE level_progress
        SET
          status = 'completed',
          score = ?,
          stars = ?,
          highlight = ?,
          caution = ?,
          ai_summary = ?,
          started_at = COALESCE(started_at, ?),
          completed_at = ?,
          updated_at = ?
        WHERE user_id = ? AND level_id = ?
      `,
      template.score,
      template.stars,
      template.highlight,
      template.caution,
      template.aiSummary,
      now,
      now,
      now,
      userId,
      levelId,
    );

    const currentIndex = levelBlueprints.findIndex((item) => item.id === levelId);
    const nextLevel = levelBlueprints[currentIndex + 1];

    if (nextLevel) {
      await db.run(
        `
          UPDATE level_progress
          SET status = 'available', updated_at = ?
          WHERE user_id = ? AND level_id = ? AND status = 'locked'
        `,
        now,
        userId,
        nextLevel.id,
      );
    }
  }

  await updateLastVisitedRoute(
    userId,
    `/student/theme/${THEME_ID}/level/${levelId}/result`,
  );
  await syncProgressBasedGrowthEvents(userId);

  const progress = await buildStudentProgress(userId);

  return {
    progress,
    result: progress.levelResults[levelId],
  };
}

export async function submitExam(
  userId: string,
  answers: StudentExamAnswer[],
): Promise<StudentProgress> {
  const progress = await buildStudentProgress(userId);
  const examQuestions = await getExamQuestionsFromDb();

  if (progress.exam.status === "locked") {
    throw new HttpError(409, "璇峰厛瀹屾垚涓夊叧闂叧瀛︿範鍚庡啀鍙傚姞涓婚鑰冭瘯銆?);
  }

  if (progress.exam.status === "completed") {
    throw new HttpError(409, "涓婚鑰冭瘯宸插畬鎴愶紝鏈疆涓嶆敮鎸侀噸澶嶆彁浜ゃ€?);
  }

  const db = await getDb();
  const answerMap = new Map<string, number>();

  for (const answer of answers) {
    answerMap.set(answer.questionId, answer.selectedIndex);
  }

  const wrongQuestionIds = examQuestions
    .filter((question) => answerMap.get(question.id) !== question.correctIndex)
    .map((question) => question.id);
  const score = Math.round(
    ((examQuestions.length - wrongQuestionIds.length) / examQuestions.length) * 100,
  );
  const now = new Date().toISOString();

  await db.run(
    `
      INSERT INTO exam_submissions (
        id, user_id, answers_json, score, wrong_question_ids_json, submitted_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    randomUUID(),
    userId,
    JSON.stringify(answers),
    score,
    JSON.stringify(wrongQuestionIds),
    now,
  );

  await updateLastVisitedRoute(userId, `/student/theme/${THEME_ID}/exam`);
  await syncProgressBasedGrowthEvents(userId);
  return buildStudentProgress(userId);
}




