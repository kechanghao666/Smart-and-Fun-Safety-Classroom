import { randomUUID } from "crypto";
import { levelBlueprints } from "../constants/content";
import { defaultGrowthConfig } from "../constants/growth";
import { getDb } from "../db/connection";
import type {
  ExamSubmissionRow,
  GrowthConfigItem,
  GrowthConfigRow,
  GrowthDimensionSummary,
  GrowthEventRow,
  GrowthEventSourceType,
  GrowthHistoryItem,
  LearningRecordItem,
  LearningRecordRow,
  LearningRecordType,
  LevelId,
  LevelProgressRow,
  StudentGrowthProfileRow,
} from "../types/contracts";

interface UnlockTier {
  threshold: number;
  label: string;
}

interface GrowthAward {
  points: number;
  appearancePoints: number;
  safetyPoints: number;
  scenePoints: number;
}

interface LearningRecordInput {
  userId: string;
  type: LearningRecordType;
  title: string;
  description: string;
  route: string;
  meta?: Record<string, unknown>;
  createdAt?: string;
  dedupeKey?: string;
}

interface GrowthEventInput {
  userId: string;
  sourceType: GrowthEventSourceType;
  sourceRef?: string | null;
  title: string;
  description: string;
  award: GrowthAward;
  createdAt?: string;
  dedupeKey?: string;
}

const appearanceUnlocks: UnlockTier[] = [
  ...defaultGrowthConfig.appearanceThresholds,
];

const sceneUnlocks: UnlockTier[] = [...defaultGrowthConfig.sceneThresholds];

function normalizeGrowthConfig(config?: Partial<GrowthConfigItem> | null): GrowthConfigItem {
  if (!config) {
    return defaultGrowthConfig;
  }

  return {
    ...defaultGrowthConfig,
    ...config,
    levelAwards: {
      ...defaultGrowthConfig.levelAwards,
      ...config.levelAwards,
    },
    wrongQuestionReviewAward: {
      ...defaultGrowthConfig.wrongQuestionReviewAward,
      ...config.wrongQuestionReviewAward,
    },
    streakAwards: {
      ...defaultGrowthConfig.streakAwards,
      ...config.streakAwards,
    },
    appearanceThresholds:
      Array.isArray(config.appearanceThresholds) && config.appearanceThresholds.length
        ? config.appearanceThresholds
        : defaultGrowthConfig.appearanceThresholds,
    safetyThresholds:
      Array.isArray(config.safetyThresholds) && config.safetyThresholds.length
        ? config.safetyThresholds
        : defaultGrowthConfig.safetyThresholds,
    sceneThresholds:
      Array.isArray(config.sceneThresholds) && config.sceneThresholds.length
        ? config.sceneThresholds
        : defaultGrowthConfig.sceneThresholds,
    stageThresholds:
      Array.isArray(config.stageThresholds) && config.stageThresholds.length
        ? config.stageThresholds
        : defaultGrowthConfig.stageThresholds,
  };
}

export async function getGrowthConfig() {
  const db = await getDb();
  const row = await db.get<GrowthConfigRow>(
    `
      SELECT id, title, config_json, updated_at
      FROM growth_settings
      WHERE id = ?
    `,
    defaultGrowthConfig.id,
  );

  if (!row) {
    return defaultGrowthConfig;
  }

  try {
    return normalizeGrowthConfig(JSON.parse(row.config_json) as Partial<GrowthConfigItem>);
  } catch {
    return defaultGrowthConfig;
  }
}

function toDateOnly(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}

function resolveUnlocks(points: number, tiers: UnlockTier[]) {
  return tiers.filter((tier) => points >= tier.threshold);
}

function resolveNextUnlock(points: number, tiers: UnlockTier[]) {
  return tiers.find((tier) => points < tier.threshold) ?? null;
}

function resolveStage(totalPoints: number, config: GrowthConfigItem) {
  const stages = [...config.stageThresholds].sort(
    (left, right) => left.threshold - right.threshold,
  );
  const current =
    stages.filter((stage) => totalPoints >= stage.threshold).pop() ?? stages[0];

  return {
    stageLabel: current.label,
    growthSummary: current.summary,
  };
}

function computeDimensionLevel(points: number, tiers: UnlockTier[]) {
  const unlocked = resolveUnlocks(points, tiers);
  return unlocked.length;
}

function computeDimensionProgress(points: number, tiers: UnlockTier[]) {
  const current = [...resolveUnlocks(points, tiers)].pop() ?? tiers[0];
  const next = resolveNextUnlock(points, tiers);

  if (!next) {
    return 100;
  }

  const span = next.threshold - current.threshold;
  if (span <= 0) {
    return 100;
  }

  return Math.max(
    0,
    Math.min(100, Math.round(((points - current.threshold) / span) * 100)),
  );
}

function buildDimension(
  id: GrowthDimensionSummary["id"],
  label: string,
  points: number,
  tiers: UnlockTier[],
): GrowthDimensionSummary {
  const unlocked = resolveUnlocks(points, tiers);
  const currentUnlock = unlocked[unlocked.length - 1] ?? tiers[0];
  const nextUnlock = resolveNextUnlock(points, tiers);

  return {
    id,
    label,
    points,
    level: computeDimensionLevel(points, tiers),
    progressPercent: computeDimensionProgress(points, tiers),
    currentUnlockLabel: currentUnlock.label,
    nextUnlockLabel: nextUnlock?.label ?? null,
  };
}

function buildLevelAward(
  config: GrowthConfigItem,
  levelId: LevelId,
  stars: number | null,
): GrowthAward {
  const base = config.levelAwards[levelId];
  const multiplier = stars === 3 ? 1 + config.levelThreeStarBonusRate : 1;
  const appearancePoints = Math.round(base.appearancePoints * multiplier);
  const safetyPoints = Math.round(base.safetyPoints * multiplier);
  const scenePoints = Math.round(base.scenePoints * multiplier);

  return {
    appearancePoints,
    safetyPoints,
    scenePoints,
    points: appearancePoints + safetyPoints + scenePoints,
  };
}

function buildExamAward(config: GrowthConfigItem, score: number): GrowthAward {
  const total =
    score >= 90
      ? config.examBasePoints + config.examBonus90
      : score >= 80
        ? config.examBasePoints + config.examBonus80
        : config.examBasePoints;
  const appearancePoints = Math.round(total * config.examAppearanceRatio);
  const safetyPoints = Math.round(total * config.examSafetyRatio);
  const scenePoints = total - appearancePoints - safetyPoints;

  return {
    points: total,
    appearancePoints,
    safetyPoints,
    scenePoints,
  };
}

function buildWrongQuestionReviewAward(config: GrowthConfigItem): GrowthAward {
  return {
    points:
      config.wrongQuestionReviewAward.appearancePoints +
      config.wrongQuestionReviewAward.safetyPoints +
      config.wrongQuestionReviewAward.scenePoints,
    appearancePoints: config.wrongQuestionReviewAward.appearancePoints,
    safetyPoints: config.wrongQuestionReviewAward.safetyPoints,
    scenePoints: config.wrongQuestionReviewAward.scenePoints,
  };
}

function buildStreakAward(config: GrowthConfigItem, days: 3 | 7): GrowthAward {
  const base = days === 7 ? config.streakAwards.sevenDay : config.streakAwards.threeDay;

  return {
    points: base.appearancePoints + base.safetyPoints + base.scenePoints,
    appearancePoints: base.appearancePoints,
    safetyPoints: base.safetyPoints,
    scenePoints: base.scenePoints,
  };
}

function parseMetaJson(value: string) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export async function ensureStudentGrowthProfile(userId: string) {
  const db = await getDb();
  const existing = await db.get<{ user_id: string }>(
    "SELECT user_id FROM student_growth_profiles WHERE user_id = ?",
    userId,
  );

  if (!existing) {
    await db.run(
      `
        INSERT INTO student_growth_profiles (
          user_id, total_points, appearance_points, safety_points, scene_points,
          streak_days, last_learning_date, selected_appearance, selected_scene, updated_at
        )
        VALUES (?, 0, 0, 0, 0, 0, NULL, ?, ?, ?)
      `,
      userId,
      defaultGrowthConfig.appearanceThresholds[0].label,
      defaultGrowthConfig.sceneThresholds[0].label,
      new Date().toISOString(),
    );
  }
}

export async function logLearningRecord(input: LearningRecordInput) {
  const db = await getDb();

  const result = await db.run(
    `
      INSERT OR IGNORE INTO learning_records (
        id, user_id, record_type, title, description, route, meta_json, dedupe_key, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    randomUUID(),
    input.userId,
    input.type,
    input.title,
    input.description,
    input.route,
    JSON.stringify(input.meta ?? {}),
    input.dedupeKey ?? null,
    input.createdAt ?? new Date().toISOString(),
  );

  return (result.changes ?? 0) > 0;
}

export async function registerGrowthEvent(input: GrowthEventInput) {
  await ensureStudentGrowthProfile(input.userId);
  const db = await getDb();

  const result = await db.run(
    `
      INSERT OR IGNORE INTO growth_events (
        id, user_id, source_type, source_ref, title, description,
        points, appearance_points, safety_points, scene_points, dedupe_key, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    randomUUID(),
    input.userId,
    input.sourceType,
    input.sourceRef ?? null,
    input.title,
    input.description,
    input.award.points,
    input.award.appearancePoints,
    input.award.safetyPoints,
    input.award.scenePoints,
    input.dedupeKey ?? null,
    input.createdAt ?? new Date().toISOString(),
  );

  return (result.changes ?? 0) > 0;
}

export async function syncStudentGrowthProfile(userId: string) {
  await ensureStudentGrowthProfile(userId);
  const config = await getGrowthConfig();
  const db = await getDb();
  const totals = await db.get<{
    total_points: number;
    appearance_points: number;
    safety_points: number;
    scene_points: number;
  }>(
    `
      SELECT
        COALESCE(SUM(points), 0) AS total_points,
        COALESCE(SUM(appearance_points), 0) AS appearance_points,
        COALESCE(SUM(safety_points), 0) AS safety_points,
        COALESCE(SUM(scene_points), 0) AS scene_points
      FROM growth_events
      WHERE user_id = ?
    `,
    userId,
  );

  const current = await db.get<StudentGrowthProfileRow>(
    `
      SELECT
        user_id, total_points, appearance_points, safety_points, scene_points,
        streak_days, last_learning_date, selected_appearance, selected_scene, updated_at
      FROM student_growth_profiles
      WHERE user_id = ?
    `,
    userId,
  );

  const unlockedAppearances = resolveUnlocks(
    totals?.appearance_points ?? 0,
    config.appearanceThresholds,
  );
  const unlockedScenes = resolveUnlocks(
    totals?.scene_points ?? 0,
    config.sceneThresholds,
  );
  const selectedAppearance =
    current && unlockedAppearances.some((tier) => tier.label === current.selected_appearance)
      ? current.selected_appearance
      : unlockedAppearances[unlockedAppearances.length - 1]?.label ??
        config.appearanceThresholds[0].label;
  const selectedScene =
    current && unlockedScenes.some((tier) => tier.label === current.selected_scene)
      ? current.selected_scene
      : unlockedScenes[unlockedScenes.length - 1]?.label ??
        config.sceneThresholds[0].label;

  await db.run(
    `
      UPDATE student_growth_profiles
      SET
        total_points = ?,
        appearance_points = ?,
        safety_points = ?,
        scene_points = ?,
        selected_appearance = ?,
        selected_scene = ?,
        updated_at = ?
      WHERE user_id = ?
    `,
    totals?.total_points ?? 0,
    totals?.appearance_points ?? 0,
    totals?.safety_points ?? 0,
    totals?.scene_points ?? 0,
    selectedAppearance,
    selectedScene,
    new Date().toISOString(),
    userId,
  );

  return db.get<StudentGrowthProfileRow>(
    `
      SELECT
        user_id, total_points, appearance_points, safety_points, scene_points,
        streak_days, last_learning_date, selected_appearance, selected_scene, updated_at
      FROM student_growth_profiles
      WHERE user_id = ?
    `,
    userId,
  );
}

export async function syncProgressBasedGrowthEvents(userId: string) {
  const config = await getGrowthConfig();
  const db = await getDb();
  const completedLevels = await db.all<LevelProgressRow[]>(
    `
      SELECT
        user_id, level_id, status, score, stars, highlight, caution, ai_summary,
        started_at, completed_at, updated_at
      FROM level_progress
      WHERE user_id = ? AND status = 'completed'
      ORDER BY completed_at ASC, level_id ASC
    `,
    userId,
  );

  for (const row of completedLevels) {
    await registerGrowthEvent({
      userId,
      sourceType: "level_completed",
      sourceRef: row.level_id,
      title: `完成${levelBlueprints.find((item) => item.id === row.level_id)?.title ?? row.level_id}`,
      description: "完成关卡后，虚拟人物获得了新的成长值奖励。",
      award: buildLevelAward(config, row.level_id, row.stars),
      createdAt: row.completed_at ?? row.updated_at,
      dedupeKey: `growth:level:${userId}:${row.level_id}`,
    });

    await logLearningRecord({
      userId,
      type: "level_completed",
      title: `完成${levelBlueprints.find((item) => item.id === row.level_id)?.title ?? row.level_id}`,
      description: "已记录本关得分、星级和成长奖励。",
      route: `/student/theme/road-safety/level/${row.level_id}/result`,
      createdAt: row.completed_at ?? row.updated_at,
      dedupeKey: `record:level:${userId}:${row.level_id}`,
    });
  }

  const latestExam = await db.get<ExamSubmissionRow>(
    `
      SELECT id, user_id, answers_json, score, wrong_question_ids_json, submitted_at
      FROM exam_submissions
      WHERE user_id = ?
      ORDER BY submitted_at DESC
      LIMIT 1
    `,
    userId,
  );

  if (latestExam) {
    await registerGrowthEvent({
      userId,
      sourceType: "exam_completed",
      sourceRef: latestExam.id,
      title: "完成道路安全主题考试",
      description: `考试成绩 ${latestExam.score} 分，已计入人物成长值。`,
      award: buildExamAward(config, latestExam.score),
      createdAt: latestExam.submitted_at,
      dedupeKey: `growth:exam:${userId}:${latestExam.id}`,
    });

    await logLearningRecord({
      userId,
      type: "exam_completed",
      title: "完成道路安全主题考试",
      description: `本次考试得分 ${latestExam.score} 分。`,
      route: "/student/theme/road-safety/exam",
      createdAt: latestExam.submitted_at,
      dedupeKey: `record:exam:${userId}:${latestExam.id}`,
    });
  }

  if (completedLevels.length === levelBlueprints.length) {
    const createdAt =
      completedLevels[completedLevels.length - 1]?.completed_at ??
      completedLevels[completedLevels.length - 1]?.updated_at ??
      new Date().toISOString();

    await logLearningRecord({
      userId,
      type: "exam_unlocked",
      title: "已解锁道路安全主题考试",
      description: "三关闯关学习已全部完成，可以进入主题考试。",
      route: "/student/theme/road-safety",
      createdAt,
      dedupeKey: `record:exam-unlock:${userId}`,
    });
  }

  return syncStudentGrowthProfile(userId);
}

export async function recordStudentLogin(userId: string) {
  await ensureStudentGrowthProfile(userId);
  const db = await getDb();
  const profile = await db.get<StudentGrowthProfileRow>(
    `
      SELECT
        user_id, total_points, appearance_points, safety_points, scene_points,
        streak_days, last_learning_date, selected_appearance, selected_scene, updated_at
      FROM student_growth_profiles
      WHERE user_id = ?
    `,
    userId,
  );

  const today = toDateOnly(new Date());
  const lastDate = profile?.last_learning_date;
  let nextStreak = profile?.streak_days ?? 0;

  if (!lastDate) {
    nextStreak = 1;
  } else if (lastDate === today) {
    nextStreak = profile?.streak_days ?? 1;
  } else {
    const diffDays = Math.round(
      (new Date(today).getTime() - new Date(lastDate).getTime()) / (24 * 60 * 60 * 1000),
    );
    nextStreak = diffDays === 1 ? (profile?.streak_days ?? 0) + 1 : 1;
  }

  await db.run(
    `
      UPDATE student_growth_profiles
      SET streak_days = ?, last_learning_date = ?, updated_at = ?
      WHERE user_id = ?
    `,
    nextStreak,
    today,
    new Date().toISOString(),
    userId,
  );

  await logLearningRecord({
    userId,
    type: "login",
    title: "进入学习系统",
    description: `今天是连续学习第 ${nextStreak} 天。`,
    route: "/student/home",
    dedupeKey: `record:login:${userId}:${today}`,
  });

  if (nextStreak === 3 || nextStreak === 7) {
    const award = buildStreakAward(await getGrowthConfig(), nextStreak);
    const inserted = await registerGrowthEvent({
      userId,
      sourceType: "streak_bonus",
      sourceRef: `${nextStreak}-day:${today}`,
      title: `连续 ${nextStreak} 天学习奖励`,
      description: `已领取连续 ${nextStreak} 天登录学习的成长值礼包。`,
      award,
      dedupeKey: `growth:streak:${userId}:${nextStreak}:${today}`,
    });

    if (inserted) {
      await logLearningRecord({
        userId,
        type: "growth_reward",
        title: `获得连续 ${nextStreak} 天学习奖励`,
        description: `已追加 ${award.points} 点成长值。`,
        route: "/student/growth",
        dedupeKey: `record:streak:${userId}:${nextStreak}:${today}`,
      });
    }
  }

  return syncStudentGrowthProfile(userId);
}

export async function completeWrongQuestionReview(userId: string, questionId: string) {
  const db = await getDb();
  const config = await getGrowthConfig();
  const existing = await db.get<{ question_id: string }>(
    `
      SELECT question_id
      FROM question_review_progress
      WHERE user_id = ? AND question_id = ?
    `,
    userId,
    questionId,
  );
  const now = new Date().toISOString();

  if (!existing) {
    await db.run(
      `
        INSERT INTO question_review_progress (user_id, question_id, reviewed_at, created_at)
        VALUES (?, ?, ?, ?)
      `,
      userId,
      questionId,
      now,
      now,
    );

    const award = buildWrongQuestionReviewAward(config);
    await registerGrowthEvent({
      userId,
      sourceType: "wrong_question_review",
      sourceRef: questionId,
      title: "完成错题重学",
      description: "已完成一道错题对应知识点的回顾任务。",
      award,
      createdAt: now,
      dedupeKey: `growth:review:${userId}:${questionId}`,
    });

    await logLearningRecord({
      userId,
      type: "wrong_question_reviewed",
      title: "完成错题对应知识点重学",
      description: `已追加 ${award.points} 点成长值，并建议继续巩固同类知识点。`,
      route: "/student/records",
      createdAt: now,
      dedupeKey: `record:review:${userId}:${questionId}`,
    });
  }

  await syncProgressBasedGrowthEvents(userId);

  return db.get<{ reviewed_at: string }>(
    `
      SELECT reviewed_at
      FROM question_review_progress
      WHERE user_id = ? AND question_id = ?
    `,
    userId,
    questionId,
  );
}

export async function getLearningRecords(userId: string, limit = 20): Promise<LearningRecordItem[]> {
  const db = await getDb();
  const rows = await db.all<LearningRecordRow[]>(
    `
      SELECT
        id, user_id, record_type, title, description, route, meta_json, dedupe_key, created_at
      FROM learning_records
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `,
    userId,
    limit,
  );

  return rows.map((row) => ({
    id: row.id,
    type: row.record_type,
    title: row.title,
    description: row.description,
    route: row.route,
    createdAt: row.created_at,
  }));
}

export async function getLatestLearningRecordTime(userId: string) {
  const db = await getDb();
  const row = await db.get<{ created_at: string }>(
    `
      SELECT created_at
      FROM learning_records
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `,
    userId,
  );

  return row?.created_at ?? null;
}

export async function getGrowthProfile(userId: string) {
  await syncProgressBasedGrowthEvents(userId);
  const config = await getGrowthConfig();
  const db = await getDb();
  const profile = await db.get<StudentGrowthProfileRow>(
    `
      SELECT
        user_id, total_points, appearance_points, safety_points, scene_points,
        streak_days, last_learning_date, selected_appearance, selected_scene, updated_at
      FROM student_growth_profiles
      WHERE user_id = ?
    `,
    userId,
  );

  if (!profile) {
    return null;
  }

  const events = await db.all<GrowthEventRow[]>(
    `
      SELECT
        id, user_id, source_type, source_ref, title, description,
        points, appearance_points, safety_points, scene_points, dedupe_key, created_at
      FROM growth_events
      WHERE user_id = ?
      ORDER BY created_at DESC
    `,
    userId,
  );

  const appearanceDimension = buildDimension(
    "appearance",
    "形象外观",
    profile.appearance_points,
    config.appearanceThresholds,
  );
  const safetyDimension = buildDimension(
    "safety",
    "安全能力",
    profile.safety_points,
    config.safetyThresholds,
  );
  const sceneDimension = buildDimension(
    "scene",
    "专属场景",
    profile.scene_points,
    config.sceneThresholds,
  );
  const stage = resolveStage(profile.total_points, config);
  const nextStage = [...config.stageThresholds]
    .sort((left, right) => left.threshold - right.threshold)
    .find((threshold) => threshold.threshold > profile.total_points);

  return {
    profile,
    dimensions: [appearanceDimension, safetyDimension, sceneDimension],
    unlockedAppearances: resolveUnlocks(
      profile.appearance_points,
      config.appearanceThresholds,
    ).map((item) => item.label),
    unlockedScenes: resolveUnlocks(profile.scene_points, config.sceneThresholds).map(
      (item) => item.label,
    ),
    nextLevelTarget: nextStage?.threshold ?? null,
    nextLevelRemaining: nextStage ? nextStage.threshold - profile.total_points : null,
    nextLevelLabel: nextStage?.label ?? null,
    stage,
    history: events.map<GrowthHistoryItem>((event) => ({
      id: event.id,
      sourceType: event.source_type,
      title: event.title,
      description: event.description,
      points: event.points,
      createdAt: event.created_at,
    })),
  };
}

export async function getReviewedQuestionIds(userId: string) {
  const db = await getDb();
  const rows = await db.all<Array<{ question_id: string }>>(
    `
      SELECT question_id
      FROM question_review_progress
      WHERE user_id = ?
    `,
    userId,
  );

  return rows.map((row) => row.question_id);
}

export async function getReviewedQuestionMap(userId: string) {
  const db = await getDb();
  const rows = await db.all<Array<{ question_id: string; reviewed_at: string }>>(
    `
      SELECT question_id, reviewed_at
      FROM question_review_progress
      WHERE user_id = ?
    `,
    userId,
  );

  return new Map(rows.map((row) => [row.question_id, row.reviewed_at]));
}

export async function getUserLearningRecordMeta(userId: string) {
  const db = await getDb();
  const rows = await db.all<LearningRecordRow[]>(
    `
      SELECT
        id, user_id, record_type, title, description, route, meta_json, dedupe_key, created_at
      FROM learning_records
      WHERE user_id = ?
      ORDER BY created_at DESC
    `,
    userId,
  );

  return rows.map((row) => ({
    ...row,
    meta: parseMetaJson(row.meta_json),
  }));
}
