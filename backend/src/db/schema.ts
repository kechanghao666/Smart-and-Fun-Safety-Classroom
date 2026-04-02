import type { Database } from "sqlite";

async function ensureColumn(
  db: Database,
  tableName: string,
  columnName: string,
  definition: string,
) {
  const columns = await db.all<Array<{ name: string }>>(
    `PRAGMA table_info(${tableName})`,
  );
  const hasColumn = columns.some((column) => column.name === columnName);

  if (!hasColumn) {
    await db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition};`);
  }
}

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

    CREATE TABLE IF NOT EXISTS themes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      cover_label TEXT NOT NULL,
      is_open INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_levels (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      focus TEXT NOT NULL,
      duration TEXT NOT NULL,
      reward_label TEXT NOT NULL,
      feedback_style TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS question_bank (
      id TEXT PRIMARY KEY,
      prompt TEXT NOT NULL,
      options_json TEXT NOT NULL DEFAULT '[]',
      correct_index INTEGER NOT NULL DEFAULT 0,
      correct_label TEXT NOT NULL,
      explanation TEXT NOT NULL,
      review_level_id TEXT NOT NULL,
      review_label TEXT NOT NULL DEFAULT '',
      review_suggestion TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_copy_templates (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      scene TEXT NOT NULL,
      prompt_text TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await ensureColumn(db, "question_bank", "options_json", "TEXT NOT NULL DEFAULT '[]'");
  await ensureColumn(db, "question_bank", "correct_index", "INTEGER NOT NULL DEFAULT 0");
  await ensureColumn(db, "question_bank", "review_label", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn(
    db,
    "question_bank",
    "review_suggestion",
    "TEXT NOT NULL DEFAULT ''",
  );
}
