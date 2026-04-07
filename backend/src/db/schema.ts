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
      status TEXT NOT NULL DEFAULT 'active',
      admin_note TEXT NOT NULL DEFAULT '',
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
      cover_accent TEXT NOT NULL DEFAULT 'sky',
      cover_illustration TEXT NOT NULL DEFAULT '',
      is_open INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_levels (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      focus TEXT NOT NULL,
      duration TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 1,
      scene_asset_label TEXT NOT NULL DEFAULT '',
      task_outline_json TEXT NOT NULL DEFAULT '[]',
      reward_label TEXT NOT NULL,
      feedback_style TEXT NOT NULL,
      feedback_copy TEXT NOT NULL DEFAULT '',
      hotspot_items_json TEXT NOT NULL DEFAULT '[]',
      prop_items_json TEXT NOT NULL DEFAULT '[]',
      target_area_notes_json TEXT NOT NULL DEFAULT '[]',
      scene_reference_label TEXT NOT NULL DEFAULT '',
      observation_scene_json TEXT NOT NULL DEFAULT '{}',
      task_steps_json TEXT NOT NULL DEFAULT '[]',
      midpoint_copy TEXT NOT NULL DEFAULT '',
      completion_copy TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS question_bank (
      id TEXT PRIMARY KEY,
      theme_id TEXT NOT NULL DEFAULT 'road-safety',
      theme_title TEXT NOT NULL DEFAULT '道路安全教育',
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

    CREATE TABLE IF NOT EXISTS learning_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      record_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      route TEXT NOT NULL,
      meta_json TEXT NOT NULL DEFAULT '{}',
      dedupe_key TEXT UNIQUE,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS student_growth_profiles (
      user_id TEXT PRIMARY KEY,
      total_points INTEGER NOT NULL DEFAULT 0,
      appearance_points INTEGER NOT NULL DEFAULT 0,
      safety_points INTEGER NOT NULL DEFAULT 0,
      scene_points INTEGER NOT NULL DEFAULT 0,
      streak_days INTEGER NOT NULL DEFAULT 0,
      last_learning_date TEXT,
      selected_appearance TEXT NOT NULL DEFAULT '基础形态',
      selected_scene TEXT NOT NULL DEFAULT '城市街道',
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS growth_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_ref TEXT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 0,
      appearance_points INTEGER NOT NULL DEFAULT 0,
      safety_points INTEGER NOT NULL DEFAULT 0,
      scene_points INTEGER NOT NULL DEFAULT 0,
      dedupe_key TEXT UNIQUE,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS question_review_progress (
      user_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      reviewed_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, question_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS teacher_classes (
      id TEXT PRIMARY KEY,
      teacher_user_id TEXT NOT NULL,
      name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (teacher_user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS growth_settings (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      config_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await ensureColumn(db, "users", "status", "TEXT NOT NULL DEFAULT 'active'");
  await ensureColumn(db, "users", "admin_note", "TEXT NOT NULL DEFAULT ''");

  await ensureColumn(db, "themes", "cover_accent", "TEXT NOT NULL DEFAULT 'sky'");
  await ensureColumn(db, "themes", "cover_illustration", "TEXT NOT NULL DEFAULT ''");

  await ensureColumn(db, "admin_levels", "display_order", "INTEGER NOT NULL DEFAULT 1");
  await ensureColumn(db, "admin_levels", "scene_asset_label", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn(db, "admin_levels", "task_outline_json", "TEXT NOT NULL DEFAULT '[]'");
  await ensureColumn(db, "admin_levels", "feedback_copy", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn(db, "admin_levels", "hotspot_items_json", "TEXT NOT NULL DEFAULT '[]'");
  await ensureColumn(db, "admin_levels", "prop_items_json", "TEXT NOT NULL DEFAULT '[]'");
  await ensureColumn(db, "admin_levels", "target_area_notes_json", "TEXT NOT NULL DEFAULT '[]'");
  await ensureColumn(
    db,
    "admin_levels",
    "scene_reference_label",
    "TEXT NOT NULL DEFAULT ''",
  );
  await ensureColumn(
    db,
    "admin_levels",
    "observation_scene_json",
    "TEXT NOT NULL DEFAULT '{}'",
  );
  await ensureColumn(
    db,
    "admin_levels",
    "task_steps_json",
    "TEXT NOT NULL DEFAULT '[]'",
  );
  await ensureColumn(
    db,
    "admin_levels",
    "midpoint_copy",
    "TEXT NOT NULL DEFAULT ''",
  );
  await ensureColumn(
    db,
    "admin_levels",
    "completion_copy",
    "TEXT NOT NULL DEFAULT ''",
  );

  await ensureColumn(db, "question_bank", "theme_id", "TEXT NOT NULL DEFAULT 'road-safety'");
  await ensureColumn(db, "question_bank", "theme_title", "TEXT NOT NULL DEFAULT '道路安全教育'");
  await ensureColumn(db, "question_bank", "options_json", "TEXT NOT NULL DEFAULT '[]'");
  await ensureColumn(db, "question_bank", "correct_index", "INTEGER NOT NULL DEFAULT 0");
  await ensureColumn(db, "question_bank", "review_label", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn(
    db,
    "question_bank",
    "review_suggestion",
    "TEXT NOT NULL DEFAULT ''",
  );

  await ensureColumn(
    db,
    "student_growth_profiles",
    "selected_appearance",
    "TEXT NOT NULL DEFAULT '基础形态'",
  );
  await ensureColumn(
    db,
    "student_growth_profiles",
    "selected_scene",
    "TEXT NOT NULL DEFAULT '城市街道'",
  );
}
