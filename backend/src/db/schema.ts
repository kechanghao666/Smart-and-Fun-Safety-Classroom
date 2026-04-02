import type { Database } from "sqlite";

export async function createSchema(db: Database) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      account TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      display_name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS student_profiles (
      user_id TEXT PRIMARY KEY,
      nickname TEXT,
      avatar_id TEXT,
      avatar_label TEXT,
      stage TEXT,
      class_name TEXT NOT NULL DEFAULT '三年级（2）班',
      base_points INTEGER NOT NULL DEFAULT 120,
      starter_badges_json TEXT NOT NULL DEFAULT '["观察员新星"]',
      last_visited_route TEXT NOT NULL DEFAULT '/student/home',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS level_progress (
      user_id TEXT NOT NULL,
      level_id TEXT NOT NULL,
      status TEXT NOT NULL,
      score INTEGER,
      stars INTEGER,
      highlight TEXT,
      caution TEXT,
      ai_summary TEXT,
      started_at TEXT,
      completed_at TEXT,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (user_id, level_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS exam_submissions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      answers_json TEXT NOT NULL,
      score INTEGER NOT NULL,
      wrong_question_ids_json TEXT NOT NULL,
      submitted_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      scene TEXT NOT NULL,
      level_id TEXT,
      message TEXT,
      reply TEXT NOT NULL,
      provider TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);
}
