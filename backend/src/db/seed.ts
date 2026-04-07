import { randomBytes, randomUUID, scryptSync } from "crypto";
import type { Database } from "sqlite";
import {
  aiCopyTemplateItems,
  BASE_BADGES,
  BASE_POINTS,
  examQuestions,
  levelBlueprints,
  levelManagementItems,
  levelResultTemplates,
  questionBankManagementItems,
  themeManagementItems,
} from "../constants/content";
import { defaultGrowthConfig } from "../constants/growth";
import { levelOneManagementDefaults } from "../constants/levelOneObservation";
import type { LevelId, StudentStage } from "../types/contracts";
import {
  ensureUniqueClassCode,
  ensureUniqueStudentNo,
} from "../utils/identityCodes";

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}

async function seedUser(
  db: Database,
  input: {
    id: string;
    account: string;
    role: "student" | "teacher" | "admin";
    displayName: string;
    status?: "active" | "paused";
    adminNote?: string;
  },
) {
  const existing = await db.get<{ id: string }>(
    "SELECT id FROM users WHERE account = ?",
    input.account,
  );

  if (existing) {
    await db.run(
      `
        UPDATE users
        SET status = COALESCE(status, ?), admin_note = COALESCE(admin_note, '')
        WHERE account = ?
      `,
      input.status ?? "active",
      input.account,
    );
    return;
  }

  const salt = randomBytes(16).toString("hex");
  const passwordHash = hashPassword("123456", salt);
  const now = new Date().toISOString();

  await db.run(
    `
      INSERT INTO users (
        id, account, role, password_hash, password_salt, display_name,
        status, admin_note, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    input.id,
    input.account,
    input.role,
    passwordHash,
    salt,
    input.displayName,
    input.status ?? "active",
    input.adminNote ?? "",
    now,
    now,
  );
}

async function seedTeacherClass(
  db: Database,
  input: {
    id: string;
    teacherUserId: string;
    name: string;
    description: string;
  },
) {
  const existing = await db.get<{ id: string; class_code: string | null }>(
    "SELECT id, class_code FROM teacher_classes WHERE id = ?",
    input.id,
  );
  const classCode = await ensureUniqueClassCode(db, input.id, input.id);

  if (existing) {
    if (!existing.class_code) {
      await db.run(
        `
          UPDATE teacher_classes
          SET class_code = ?, updated_at = ?
          WHERE id = ?
        `,
        classCode,
        new Date().toISOString(),
        input.id,
      );
    }
    return;
  }

  const now = new Date().toISOString();
  await db.run(
    `
      INSERT INTO teacher_classes (
        id, teacher_user_id, name, description, class_code, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    input.id,
    input.teacherUserId,
    input.name,
    input.description,
    classCode,
    now,
    now,
  );
}

async function seedStudentProfile(
  db: Database,
  input: {
    userId: string;
    className: string;
    nickname?: string | null;
    avatarId?: string | null;
    avatarLabel?: string | null;
    stage?: StudentStage | null;
    lastVisitedRoute?: string;
  },
) {
  const existing = await db.get<{ user_id: string }>(
    "SELECT user_id FROM student_profiles WHERE user_id = ?",
    input.userId,
  );
  const now = new Date().toISOString();
  const classRow = await db.get<{ id: string }>(
    `
      SELECT id
      FROM teacher_classes
      WHERE name = ?
      LIMIT 1
    `,
    input.className,
  );
  const studentNo = await ensureUniqueStudentNo(db, input.userId, input.userId);

  if (!existing) {
    await db.run(
      `
        INSERT INTO student_profiles (
          user_id, nickname, avatar_id, avatar_label, stage, class_name,
          class_id, student_no, base_points, starter_badges_json, last_visited_route,
          created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      input.userId,
      input.nickname ?? null,
      input.avatarId ?? null,
      input.avatarLabel ?? null,
      input.stage ?? null,
      input.className,
      classRow?.id ?? null,
      studentNo,
      BASE_POINTS,
      JSON.stringify(BASE_BADGES),
      input.lastVisitedRoute ?? "/student/home",
      now,
      now,
    );
    return;
  }

  await db.run(
    `
      UPDATE student_profiles
      SET
        class_name = COALESCE(NULLIF(class_name, ''), ?),
        class_id = COALESCE(class_id, ?),
        student_no = COALESCE(student_no, ?)
      WHERE user_id = ?
    `,
    input.className,
    classRow?.id ?? null,
    studentNo,
    input.userId,
  );
}

async function ensureLevelRows(db: Database, userId: string) {
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
            result_payload_json, started_at, completed_at, updated_at
          )
          VALUES (?, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ?)
        `,
        userId,
        level.id,
        index === 0 ? "available" : "locked",
        new Date().toISOString(),
      );
    }
  }
}

async function seedStudentScenario(
  db: Database,
  input: {
    userId: string;
    completedLevels: Array<{
      levelId: LevelId;
      scoreOverride?: number;
      starsOverride?: number;
      completedAt: string;
    }>;
    nextRoute: string;
    exam?: {
      score: number;
      answers: Array<{ questionId: string; selectedIndex: number }>;
      wrongQuestionIds: string[];
      submittedAt: string;
    };
  },
) {
  await ensureLevelRows(db, input.userId);

  const completedSet = new Set(input.completedLevels.map((item) => item.levelId));

  for (const level of input.completedLevels) {
    const template = levelResultTemplates[level.levelId];
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
          result_payload_json = ?,
          started_at = COALESCE(started_at, ?),
          completed_at = COALESCE(completed_at, ?),
          updated_at = ?
        WHERE user_id = ? AND level_id = ?
      `,
      level.scoreOverride ?? template.score,
      level.starsOverride ?? template.stars,
      template.highlight,
      template.caution,
      template.aiSummary,
      JSON.stringify(template),
      level.completedAt,
      level.completedAt,
      level.completedAt,
      input.userId,
      level.levelId,
    );
  }

  const firstPendingIndex = levelBlueprints.findIndex((level) => !completedSet.has(level.id));

  if (firstPendingIndex >= 0) {
    await db.run(
      `
        UPDATE level_progress
        SET status = 'available', updated_at = ?
        WHERE user_id = ? AND level_id = ? AND status = 'locked'
      `,
      new Date().toISOString(),
      input.userId,
      levelBlueprints[firstPendingIndex].id,
    );
  }

  await db.run(
    `
      UPDATE student_profiles
      SET last_visited_route = ?, updated_at = ?
      WHERE user_id = ?
    `,
    input.nextRoute,
    new Date().toISOString(),
    input.userId,
  );

  if (input.exam) {
    const existing = await db.get<{ id: string }>(
      "SELECT id FROM exam_submissions WHERE user_id = ?",
      input.userId,
    );

    if (!existing) {
      await db.run(
        `
          INSERT INTO exam_submissions (
            id, user_id, answers_json, score, wrong_question_ids_json, submitted_at
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        randomUUID(),
        input.userId,
        JSON.stringify(input.exam.answers),
        input.exam.score,
        JSON.stringify(input.exam.wrongQuestionIds),
        input.exam.submittedAt,
      );
    }
  }
}

async function seedThemes(db: Database) {
  for (const item of themeManagementItems) {
    const existing = await db.get<{ id: string }>(
      "SELECT id FROM themes WHERE id = ?",
      item.id,
    );

    if (!existing) {
      await db.run(
        `
          INSERT INTO themes (id, title, description, cover_label, is_open, sort_order, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        item.id,
        item.title,
        item.description,
        item.coverLabel,
        item.isOpen ? 1 : 0,
        item.sortOrder,
        new Date().toISOString(),
      );
    }
  }
}

async function seedAdminLevels(db: Database) {
  for (const item of levelManagementItems) {
    const enrichedItem =
      item.id === "level-1"
        ? {
            ...item,
            ...levelOneManagementDefaults,
          }
        : item;
    const existing = await db.get<{
      id: string;
      gameplay_mode: string | null;
      route_challenge_json: string | null;
      guardian_challenge_json: string | null;
    }>(
      `
        SELECT id, gameplay_mode, route_challenge_json, guardian_challenge_json
        FROM admin_levels
        WHERE id = ?
      `,
      enrichedItem.id,
    );

    if (!existing) {
      await db.run(
        `
          INSERT INTO admin_levels (
            id, title, focus, duration, display_order, scene_asset_label,
            gameplay_mode,
            task_outline_json, reward_label, feedback_style, feedback_copy,
            hotspot_items_json, prop_items_json, target_area_notes_json,
            scene_reference_label, observation_scene_json, task_steps_json,
            route_challenge_json, guardian_challenge_json,
            midpoint_copy, completion_copy, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        enrichedItem.id,
        enrichedItem.title,
        enrichedItem.focus,
        enrichedItem.duration,
        enrichedItem.displayOrder ?? 1,
        enrichedItem.sceneAssetLabel ?? "",
        enrichedItem.gameplayMode ?? "observation",
        JSON.stringify(enrichedItem.taskOutline ?? []),
        enrichedItem.rewardLabel,
        enrichedItem.feedbackStyle,
        enrichedItem.feedbackCopy ?? "",
        JSON.stringify(enrichedItem.hotspotItems ?? []),
        JSON.stringify(enrichedItem.propItems ?? []),
        JSON.stringify(enrichedItem.targetAreaNotes ?? []),
        enrichedItem.observationScene?.referenceLabel ?? "",
        JSON.stringify(enrichedItem.observationScene ?? {}),
        JSON.stringify(enrichedItem.taskSteps ?? []),
        JSON.stringify(enrichedItem.routeChallengeConfig ?? {}),
        JSON.stringify(enrichedItem.guardianChallengeConfig ?? {}),
        enrichedItem.midpointCopy ?? "",
        enrichedItem.completionCopy ?? "",
        new Date().toISOString(),
      );
      continue;
    }

    const expectedGameplayMode = enrichedItem.gameplayMode ?? "observation";
    const shouldBackfillGameplayMode =
      !existing.gameplay_mode ||
      (enrichedItem.id !== "level-1" && existing.gameplay_mode !== expectedGameplayMode);

    await db.run(
      `
        UPDATE admin_levels
        SET
          gameplay_mode = ?,
          route_challenge_json = CASE
            WHEN route_challenge_json IS NULL OR route_challenge_json = '' OR route_challenge_json = '{}'
            THEN ?
            ELSE route_challenge_json
          END,
          guardian_challenge_json = CASE
            WHEN guardian_challenge_json IS NULL OR guardian_challenge_json = '' OR guardian_challenge_json = '{}'
            THEN ?
            ELSE guardian_challenge_json
          END,
          updated_at = updated_at
        WHERE id = ?
      `,
      shouldBackfillGameplayMode ? expectedGameplayMode : existing.gameplay_mode,
      JSON.stringify(enrichedItem.routeChallengeConfig ?? {}),
      JSON.stringify(enrichedItem.guardianChallengeConfig ?? {}),
      enrichedItem.id,
    );
  }
}

async function seedQuestionBank(db: Database) {
  for (const item of questionBankManagementItems) {
    const fallbackQuestion = examQuestions.find((question) => question.id === item.id);
    const existing = await db.get<{
      id: string;
      options_json?: string;
      correct_index?: number;
      review_label?: string;
      review_suggestion?: string;
    }>(
      `
        SELECT id, options_json, correct_index, review_label, review_suggestion
        FROM question_bank
        WHERE id = ?
      `,
      item.id,
    );

    if (!existing) {
      await db.run(
        `
          INSERT INTO question_bank (
            id, prompt, options_json, correct_index, correct_label, explanation,
            review_level_id, review_label, review_suggestion, status, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        item.id,
        item.prompt,
        JSON.stringify(fallbackQuestion?.options ?? []),
        fallbackQuestion?.correctIndex ?? 0,
        item.correctLabel,
        item.explanation,
        item.reviewLevelId,
        fallbackQuestion?.reviewLabel ?? "",
        fallbackQuestion?.reviewSuggestion ?? "",
        item.status,
        new Date().toISOString(),
      );
      continue;
    }

    const shouldBackfill =
      !existing.options_json ||
      existing.options_json === "[]" ||
      existing.review_label === "" ||
      existing.review_suggestion === "";

    if (shouldBackfill) {
      await db.run(
        `
          UPDATE question_bank
          SET
            options_json = ?,
            correct_index = ?,
            review_label = ?,
            review_suggestion = ?,
            updated_at = CASE
              WHEN updated_at IS NULL OR updated_at = ''
              THEN ?
              ELSE updated_at
            END
          WHERE id = ?
        `,
        JSON.stringify(fallbackQuestion?.options ?? []),
        fallbackQuestion?.correctIndex ?? 0,
        fallbackQuestion?.reviewLabel ?? "",
        fallbackQuestion?.reviewSuggestion ?? "",
        new Date().toISOString(),
        item.id,
      );
    }
  }
}

async function seedAiCopyTemplates(db: Database) {
  for (const item of aiCopyTemplateItems) {
    const existing = await db.get<{ id: string }>(
      "SELECT id FROM ai_copy_templates WHERE id = ?",
      item.id,
    );

    if (!existing) {
      await db.run(
        `
          INSERT INTO ai_copy_templates (id, category, title, scene, prompt_text, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        item.id,
        item.category,
        item.title,
        item.scene,
        item.promptText,
        new Date().toISOString(),
      );
    }
  }
}

async function seedGrowthSettings(db: Database) {
  const existing = await db.get<{ id: string }>(
    "SELECT id FROM growth_settings WHERE id = ?",
    defaultGrowthConfig.id,
  );

  if (!existing) {
    await db.run(
      `
        INSERT INTO growth_settings (id, title, config_json, updated_at)
        VALUES (?, ?, ?, ?)
      `,
      defaultGrowthConfig.id,
      defaultGrowthConfig.title,
      JSON.stringify(defaultGrowthConfig),
      new Date().toISOString(),
    );
  }
}

export async function seedDatabase(db: Database) {
  await seedUser(db, {
    id: "stu-1",
    account: "student001",
    role: "student",
    displayName: "学生示例账号",
  });
  await seedUser(db, {
    id: "stu-2",
    account: "student002",
    role: "student",
    displayName: "周乐乐",
    adminNote: "教师端统计 seed 学生",
  });
  await seedUser(db, {
    id: "stu-3",
    account: "student003",
    role: "student",
    displayName: "陈晓雨",
    adminNote: "教师端统计 seed 学生",
  });
  await seedUser(db, {
    id: "stu-4",
    account: "student004",
    role: "student",
    displayName: "李小安",
    adminNote: "教师端统计 seed 学生",
  });
  await seedUser(db, {
    id: "teacher-1",
    account: "teacher001",
    role: "teacher",
    displayName: "教师示例账号",
  });
  await seedUser(db, {
    id: "admin-1",
    account: "admin001",
    role: "admin",
    displayName: "管理员示例账号",
  });

  await seedTeacherClass(db, {
    id: "class-3-2",
    teacherUserId: "teacher-1",
    name: "三年级（2）班",
    description: "道路安全教育课堂示范班级",
  });
  await seedTeacherClass(db, {
    id: "class-3-3",
    teacherUserId: "teacher-1",
    name: "三年级（3）班",
    description: "道路安全教育平行班级",
  });

  await seedStudentProfile(db, {
    userId: "stu-1",
    className: "三年级（2）班",
    nickname: null,
    avatarId: null,
    avatarLabel: null,
    stage: null,
    lastVisitedRoute: "/student/home",
  });
  await seedStudentProfile(db, {
    userId: "stu-2",
    className: "三年级（2）班",
    nickname: "周乐乐",
    avatarId: "smart-scout",
    avatarLabel: "机智观察员",
    stage: "小学中段",
    lastVisitedRoute: "/student/theme/road-safety/level/level-3",
  });
  await seedStudentProfile(db, {
    userId: "stu-3",
    className: "三年级（3）班",
    nickname: "陈晓雨",
    avatarId: "sunny-guard",
    avatarLabel: "阳光小卫士",
    stage: "小学中段",
    lastVisitedRoute: "/student/theme/road-safety/level/level-2",
  });
  await seedStudentProfile(db, {
    userId: "stu-4",
    className: "三年级（3）班",
    nickname: "李小安",
    avatarId: "brave-captain",
    avatarLabel: "勇敢守护队长",
    stage: "小学高段",
    lastVisitedRoute: "/student/ai-report",
  });

  await ensureLevelRows(db, "stu-1");
  await seedStudentScenario(db, {
    userId: "stu-2",
    completedLevels: [
      {
        levelId: "level-1",
        scoreOverride: 96,
        completedAt: "2026-04-01T09:20:00.000Z",
      },
      {
        levelId: "level-2",
        scoreOverride: 82,
        completedAt: "2026-04-01T09:38:00.000Z",
      },
    ],
    nextRoute: "/student/theme/road-safety/level/level-3",
  });
  await seedStudentScenario(db, {
    userId: "stu-3",
    completedLevels: [
      {
        levelId: "level-1",
        scoreOverride: 88,
        completedAt: "2026-03-31T08:50:00.000Z",
      },
    ],
    nextRoute: "/student/theme/road-safety/level/level-2",
  });
  await seedStudentScenario(db, {
    userId: "stu-4",
    completedLevels: [
      {
        levelId: "level-1",
        scoreOverride: 100,
        completedAt: "2026-04-01T08:50:00.000Z",
      },
      {
        levelId: "level-2",
        scoreOverride: 100,
        completedAt: "2026-04-01T09:15:00.000Z",
      },
      {
        levelId: "level-3",
        scoreOverride: 100,
        completedAt: "2026-04-01T09:36:00.000Z",
      },
    ],
    nextRoute: "/student/ai-report",
    exam: {
      score: 100,
      answers: examQuestions.map((question) => ({
        questionId: question.id,
        selectedIndex: question.correctIndex,
      })),
      wrongQuestionIds: [],
      submittedAt: "2026-04-01T10:05:00.000Z",
    },
  });

  await seedThemes(db);
  await seedAdminLevels(db);
  await seedQuestionBank(db);
  await seedAiCopyTemplates(db);
  await seedGrowthSettings(db);
}
