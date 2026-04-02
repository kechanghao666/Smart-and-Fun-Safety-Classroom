import { randomBytes, scryptSync } from "crypto";
import type { Database } from "sqlite";
import {
  BASE_BADGES,
  BASE_POINTS,
  levelBlueprints,
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
}
