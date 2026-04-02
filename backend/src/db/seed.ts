import { randomBytes, scryptSync } from "crypto";
import type { Database } from "sqlite";
import {
  aiCopyTemplateItems,
  BASE_BADGES,
  BASE_POINTS,
  examQuestions,
  levelBlueprints,
  levelManagementItems,
  questionBankManagementItems,
  themeManagementItems,
} from "../constants/content";

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
  },
) {
  const existing = await db.get<{ id: string }>(
    "SELECT id FROM users WHERE account = ?",
    input.account,
  );

  if (existing) {
    return;
  }

  const salt = randomBytes(16).toString("hex");
  const passwordHash = hashPassword("123456", salt);
  const now = new Date().toISOString();

  await db.run(
    `
      INSERT INTO users (id, account, role, password_hash, password_salt, display_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    input.id,
    input.account,
    input.role,
    passwordHash,
    salt,
    input.displayName,
    now,
    now,
  );
}

async function seedStudentProfile(db: Database, userId: string) {
  const existing = await db.get<{ user_id: string }>(
    "SELECT user_id FROM student_profiles WHERE user_id = ?",
    userId,
  );

  if (!existing) {
    const now = new Date().toISOString();

    await db.run(
      `
        INSERT INTO student_profiles (
          user_id, nickname, avatar_id, avatar_label, stage, class_name,
          base_points, starter_badges_json, last_visited_route, created_at, updated_at
        )
        VALUES (?, NULL, NULL, NULL, NULL, ?, ?, ?, ?, ?, ?)
      `,
      userId,
      "三年级（2）班",
      BASE_POINTS,
      JSON.stringify(BASE_BADGES),
      "/student/home",
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
    const existing = await db.get<{ id: string }>(
      "SELECT id FROM admin_levels WHERE id = ?",
      item.id,
    );

    if (!existing) {
      await db.run(
        `
          INSERT INTO admin_levels (id, title, focus, duration, reward_label, feedback_style, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        item.id,
        item.title,
        item.focus,
        item.duration,
        item.rewardLabel,
        item.feedbackStyle,
        new Date().toISOString(),
      );
    }
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

export async function seedDatabase(db: Database) {
  await seedUser(db, {
    id: "stu-1",
    account: "student001",
    role: "student",
    displayName: "学生示例账号",
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

  await seedStudentProfile(db, "stu-1");
  await seedThemes(db);
  await seedAdminLevels(db);
  await seedQuestionBank(db);
  await seedAiCopyTemplates(db);
}
