import { getDb } from "../db/connection";
import { defaultGrowthConfig } from "../constants/growth";
import type {
  AiCopyTemplateItem,
  AiCopyTemplateRow,
  ExamQuestion,
  GrowthConfigItem,
  GrowthConfigRow,
  LevelId,
  LevelManagementItem,
  LevelManagementRow,
  QuestionBankManagementItem,
  QuestionBankRow,
  ThemeManagementItem,
  ThemeManagementRow,
} from "../types/contracts";
import { HttpError } from "../utils/httpError";

function mapThemeRow(row: ThemeManagementRow): ThemeManagementItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    coverLabel: row.cover_label,
    isOpen: Boolean(row.is_open),
    sortOrder: row.sort_order,
  };
}

function mapLevelRow(row: LevelManagementRow): LevelManagementItem {
  return {
    id: row.id,
    title: row.title,
    focus: row.focus,
    duration: row.duration,
    rewardLabel: row.reward_label,
    feedbackStyle: row.feedback_style,
  };
}

function mapQuestionBankRow(row: QuestionBankRow): QuestionBankManagementItem {
  return {
    id: row.id,
    prompt: row.prompt,
    correctLabel: row.correct_label,
    explanation: row.explanation,
    reviewLevelId: row.review_level_id,
    status: row.status,
  };
}

function parseStoredOptions(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string")
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function mapAiCopyRow(row: AiCopyTemplateRow): AiCopyTemplateItem {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    scene: row.scene,
    promptText: row.prompt_text,
  };
}

function parseGrowthConfig(value: string): GrowthConfigItem {
  try {
    const parsed = JSON.parse(value) as GrowthConfigItem;
    return {
      ...defaultGrowthConfig,
      ...parsed,
      levelAwards: {
        ...defaultGrowthConfig.levelAwards,
        ...parsed.levelAwards,
      },
      wrongQuestionReviewAward: {
        ...defaultGrowthConfig.wrongQuestionReviewAward,
        ...parsed.wrongQuestionReviewAward,
      },
      streakAwards: {
        ...defaultGrowthConfig.streakAwards,
        ...parsed.streakAwards,
      },
      appearanceThresholds:
        Array.isArray(parsed.appearanceThresholds) && parsed.appearanceThresholds.length
          ? parsed.appearanceThresholds
          : defaultGrowthConfig.appearanceThresholds,
      safetyThresholds:
        Array.isArray(parsed.safetyThresholds) && parsed.safetyThresholds.length
          ? parsed.safetyThresholds
          : defaultGrowthConfig.safetyThresholds,
      sceneThresholds:
        Array.isArray(parsed.sceneThresholds) && parsed.sceneThresholds.length
          ? parsed.sceneThresholds
          : defaultGrowthConfig.sceneThresholds,
      stageThresholds:
        Array.isArray(parsed.stageThresholds) && parsed.stageThresholds.length
          ? parsed.stageThresholds
          : defaultGrowthConfig.stageThresholds,
    };
  } catch {
    return defaultGrowthConfig;
  }
}

function parseOpenFlag(value: unknown) {
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  throw new HttpError(400, "主题开放状态必须为布尔值。");
}

function parseSortOrder(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  throw new HttpError(400, "主题排序必须为整数。");
}

function parseReviewLevelId(value: unknown): LevelId {
  if (value === "level-1" || value === "level-2" || value === "level-3") {
    return value;
  }

  throw new HttpError(400, "题目复习关联关卡不合法。");
}

function parseQuestionStatus(value: unknown): "enabled" | "draft" {
  if (value === "enabled" || value === "draft") {
    return value;
  }

  throw new HttpError(400, "题库状态必须为 enabled 或 draft。");
}

export async function getAdminThemesFromDb() {
  const db = await getDb();
  const rows = await db.all<ThemeManagementRow[]>(
    `
      SELECT id, title, description, cover_label, is_open, sort_order, updated_at
      FROM themes
      ORDER BY sort_order ASC, id ASC
    `,
  );

  return rows.map(mapThemeRow);
}

export async function createAdminTheme(input: ThemeManagementItem) {
  const db = await getDb();
  const id = String(input.id ?? "").trim();
  const title = String(input.title ?? "").trim();
  const description = String(input.description ?? "").trim();
  const coverLabel = String(input.coverLabel ?? "").trim();

  if (!id || !title || !description || !coverLabel) {
    throw new HttpError(400, "主题新增字段不完整。");
  }

  const existing = await db.get<{ id: string }>(
    "SELECT id FROM themes WHERE id = ?",
    id,
  );

  if (existing) {
    throw new HttpError(409, "该主题标识已存在。");
  }

  await db.run(
    `
      INSERT INTO themes (id, title, description, cover_label, is_open, sort_order, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    title,
    description,
    coverLabel,
    parseOpenFlag(input.isOpen),
    parseSortOrder(input.sortOrder),
    new Date().toISOString(),
  );

  return getAdminThemesFromDb();
}

export async function updateAdminTheme(
  id: string,
  input: Partial<ThemeManagementItem>,
) {
  const db = await getDb();
  const existing = await db.get<ThemeManagementRow>(
    `
      SELECT id, title, description, cover_label, is_open, sort_order, updated_at
      FROM themes
      WHERE id = ?
    `,
    id,
  );

  if (!existing) {
    throw new HttpError(404, "未找到对应主题。");
  }

  const next = {
    title:
      typeof input.title === "string" && input.title.trim()
        ? input.title.trim()
        : existing.title,
    description:
      typeof input.description === "string" && input.description.trim()
        ? input.description.trim()
        : existing.description,
    coverLabel:
      typeof input.coverLabel === "string" && input.coverLabel.trim()
        ? input.coverLabel.trim()
        : existing.cover_label,
    isOpen:
      input.isOpen === undefined ? existing.is_open : parseOpenFlag(input.isOpen),
    sortOrder:
      input.sortOrder === undefined
        ? existing.sort_order
        : parseSortOrder(input.sortOrder),
  };

  await db.run(
    `
      UPDATE themes
      SET title = ?, description = ?, cover_label = ?, is_open = ?, sort_order = ?, updated_at = ?
      WHERE id = ?
    `,
    next.title,
    next.description,
    next.coverLabel,
    next.isOpen,
    next.sortOrder,
    new Date().toISOString(),
    id,
  );

  return getAdminThemesFromDb();
}

export async function deleteAdminTheme(id: string) {
  if (id === "road-safety") {
    throw new HttpError(409, "道路安全教育是当前首发主题，不能删除。");
  }

  const db = await getDb();
  const existing = await db.get<{ id: string }>(
    "SELECT id FROM themes WHERE id = ?",
    id,
  );

  if (!existing) {
    throw new HttpError(404, "未找到对应主题。");
  }

  await db.run("DELETE FROM themes WHERE id = ?", id);
  return getAdminThemesFromDb();
}

export async function getAdminLevelsFromDb() {
  const db = await getDb();
  const rows = await db.all<LevelManagementRow[]>(
    `
      SELECT id, title, focus, duration, reward_label, feedback_style, updated_at
      FROM admin_levels
      ORDER BY id ASC
    `,
  );

  return rows.map(mapLevelRow);
}

export async function updateAdminLevel(
  id: string,
  input: Partial<LevelManagementItem>,
) {
  const db = await getDb();
  const existing = await db.get<LevelManagementRow>(
    `
      SELECT id, title, focus, duration, reward_label, feedback_style, updated_at
      FROM admin_levels
      WHERE id = ?
    `,
    id,
  );

  if (!existing) {
    throw new HttpError(404, "未找到对应关卡配置。");
  }

  const next = {
    title:
      typeof input.title === "string" && input.title.trim()
        ? input.title.trim()
        : existing.title,
    focus:
      typeof input.focus === "string" && input.focus.trim()
        ? input.focus.trim()
        : existing.focus,
    duration:
      typeof input.duration === "string" && input.duration.trim()
        ? input.duration.trim()
        : existing.duration,
    rewardLabel:
      typeof input.rewardLabel === "string" && input.rewardLabel.trim()
        ? input.rewardLabel.trim()
        : existing.reward_label,
    feedbackStyle:
      typeof input.feedbackStyle === "string" && input.feedbackStyle.trim()
        ? input.feedbackStyle.trim()
        : existing.feedback_style,
  };

  await db.run(
    `
      UPDATE admin_levels
      SET title = ?, focus = ?, duration = ?, reward_label = ?, feedback_style = ?, updated_at = ?
      WHERE id = ?
    `,
    next.title,
    next.focus,
    next.duration,
    next.rewardLabel,
    next.feedbackStyle,
    new Date().toISOString(),
    id,
  );

  return getAdminLevelsFromDb();
}

function parseQuestionPayload(
  input: Partial<QuestionBankManagementItem> & Partial<ExamQuestion>,
  fallback?: QuestionBankRow,
) {
  const inputReviewLabel = (input as Partial<ExamQuestion>).reviewLabel;
  const inputReviewSuggestion = (input as Partial<ExamQuestion>).reviewSuggestion;
  const inputOptions = (input as Partial<ExamQuestion>).options;
  const inputCorrectIndex = (input as Partial<ExamQuestion>).correctIndex;
  const prompt =
    typeof input.prompt === "string" && input.prompt.trim()
      ? input.prompt.trim()
      : fallback?.prompt;
  const explanation =
    typeof input.explanation === "string" && input.explanation.trim()
      ? input.explanation.trim()
      : fallback?.explanation;
  const correctLabel =
    typeof input.correctLabel === "string" && input.correctLabel.trim()
      ? input.correctLabel.trim()
      : fallback?.correct_label;
  const reviewLevelId =
    input.reviewLevelId !== undefined
      ? parseReviewLevelId(input.reviewLevelId)
      : fallback?.review_level_id;
  const status =
    input.status !== undefined
      ? parseQuestionStatus(input.status)
      : fallback?.status ?? "enabled";
  const options =
    Array.isArray(inputOptions) && inputOptions.every((item) => typeof item === "string")
      ? inputOptions
      : fallback
        ? parseStoredOptions(fallback.options_json)
        : undefined;
  const correctIndexRaw =
    typeof inputCorrectIndex === "number"
      ? inputCorrectIndex
      : fallback?.correct_index;
  const reviewLabel =
    typeof inputReviewLabel === "string" && inputReviewLabel.trim()
      ? inputReviewLabel.trim()
      : fallback?.review_label;
  const reviewSuggestion =
    typeof inputReviewSuggestion === "string" && inputReviewSuggestion.trim()
      ? inputReviewSuggestion.trim()
      : fallback?.review_suggestion;

  if (!prompt || !explanation || !correctLabel || !reviewLevelId) {
    throw new HttpError(400, "题库字段不完整。");
  }

  if (!options || !options.length || options.some((item) => !item.trim())) {
    throw new HttpError(400, "题目选项不能为空。");
  }

  if (
    typeof correctIndexRaw !== "number" ||
    !Number.isInteger(correctIndexRaw) ||
    correctIndexRaw < 0 ||
    correctIndexRaw >= options.length
  ) {
    throw new HttpError(400, "正确答案索引不合法。");
  }

  if (!reviewLabel || !reviewSuggestion) {
    throw new HttpError(400, "错题回看字段不完整。");
  }

  return {
    prompt,
    explanation,
    correctLabel,
    reviewLevelId,
    status,
    options,
    correctIndex: correctIndexRaw,
    reviewLabel,
    reviewSuggestion,
  };
}

export async function getAdminQuestionBankFromDb() {
  const db = await getDb();
  const rows = await db.all<QuestionBankRow[]>(
    `
      SELECT
        id, prompt, options_json, correct_index, correct_label, explanation,
        review_level_id, review_label, review_suggestion, status, updated_at
      FROM question_bank
      ORDER BY id ASC
    `,
  );

  return rows.map(mapQuestionBankRow);
}

export async function createAdminQuestionBank(
  input: Partial<QuestionBankManagementItem> & Partial<ExamQuestion>,
) {
  const db = await getDb();
  const id = String(input.id ?? "").trim();

  if (!id) {
    throw new HttpError(400, "题目编号不能为空。");
  }

  const existing = await db.get<{ id: string }>(
    "SELECT id FROM question_bank WHERE id = ?",
    id,
  );

  if (existing) {
    throw new HttpError(409, "该题目编号已存在。");
  }

  const parsed = parseQuestionPayload(input);

  await db.run(
    `
      INSERT INTO question_bank (
        id, prompt, options_json, correct_index, correct_label, explanation,
        review_level_id, review_label, review_suggestion, status, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    parsed.prompt,
    JSON.stringify(parsed.options),
    parsed.correctIndex,
    parsed.correctLabel,
    parsed.explanation,
    parsed.reviewLevelId,
    parsed.reviewLabel,
    parsed.reviewSuggestion,
    parsed.status,
    new Date().toISOString(),
  );

  return getAdminQuestionBankFromDb();
}

export async function updateAdminQuestionBank(
  id: string,
  input: Partial<QuestionBankManagementItem> & Partial<ExamQuestion>,
) {
  const db = await getDb();
  const existing = await db.get<QuestionBankRow>(
    `
      SELECT
        id, prompt, options_json, correct_index, correct_label, explanation,
        review_level_id, review_label, review_suggestion, status, updated_at
      FROM question_bank
      WHERE id = ?
    `,
    id,
  );

  if (!existing) {
    throw new HttpError(404, "未找到对应题目。");
  }

  const next = parseQuestionPayload(input, existing);

  await db.run(
    `
      UPDATE question_bank
      SET
        prompt = ?,
        options_json = ?,
        correct_index = ?,
        correct_label = ?,
        explanation = ?,
        review_level_id = ?,
        review_label = ?,
        review_suggestion = ?,
        status = ?,
        updated_at = ?
      WHERE id = ?
    `,
    next.prompt,
    JSON.stringify(next.options),
    next.correctIndex,
    next.correctLabel,
    next.explanation,
    next.reviewLevelId,
    next.reviewLabel,
    next.reviewSuggestion,
    next.status,
    new Date().toISOString(),
    id,
  );

  return getAdminQuestionBankFromDb();
}

export async function deleteAdminQuestionBank(id: string) {
  const db = await getDb();
  const existing = await db.get<{ id: string }>(
    "SELECT id FROM question_bank WHERE id = ?",
    id,
  );

  if (!existing) {
    throw new HttpError(404, "未找到对应题目。");
  }

  await db.run("DELETE FROM question_bank WHERE id = ?", id);
  return getAdminQuestionBankFromDb();
}

export async function getAdminAiCopyFromDb() {
  const db = await getDb();
  const rows = await db.all<AiCopyTemplateRow[]>(
    `
      SELECT id, category, title, scene, prompt_text, updated_at
      FROM ai_copy_templates
      ORDER BY id ASC
    `,
  );

  return rows.map(mapAiCopyRow);
}

export async function getGrowthConfigFromDb() {
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

  return parseGrowthConfig(row.config_json);
}

export async function updateGrowthConfig(
  input: Partial<GrowthConfigItem>,
) {
  const db = await getDb();
  const current = await getGrowthConfigFromDb();
  const next: GrowthConfigItem = {
    ...current,
    ...input,
    id: current.id,
    title:
      typeof input.title === "string" && input.title.trim()
        ? input.title.trim()
        : current.title,
    levelAwards: {
      ...current.levelAwards,
      ...input.levelAwards,
    },
    wrongQuestionReviewAward: {
      ...current.wrongQuestionReviewAward,
      ...input.wrongQuestionReviewAward,
    },
    streakAwards: {
      ...current.streakAwards,
      ...input.streakAwards,
    },
    appearanceThresholds:
      Array.isArray(input.appearanceThresholds) && input.appearanceThresholds.length
        ? input.appearanceThresholds
        : current.appearanceThresholds,
    safetyThresholds:
      Array.isArray(input.safetyThresholds) && input.safetyThresholds.length
        ? input.safetyThresholds
        : current.safetyThresholds,
    sceneThresholds:
      Array.isArray(input.sceneThresholds) && input.sceneThresholds.length
        ? input.sceneThresholds
        : current.sceneThresholds,
    stageThresholds:
      Array.isArray(input.stageThresholds) && input.stageThresholds.length
        ? input.stageThresholds
        : current.stageThresholds,
  };

  await db.run(
    `
      INSERT INTO growth_settings (id, title, config_json, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        config_json = excluded.config_json,
        updated_at = excluded.updated_at
    `,
    current.id,
    next.title,
    JSON.stringify(next),
    new Date().toISOString(),
  );

  return getGrowthConfigFromDb();
}

export async function createAdminAiCopy(input: AiCopyTemplateItem) {
  const db = await getDb();
  const id = String(input.id ?? "").trim();
  const category = String(input.category ?? "").trim();
  const title = String(input.title ?? "").trim();
  const scene = String(input.scene ?? "").trim();
  const promptText = String(input.promptText ?? "").trim();

  if (!id || !category || !title || !scene || !promptText) {
    throw new HttpError(400, "AI 文案模板字段不完整。");
  }

  const existing = await db.get<{ id: string }>(
    "SELECT id FROM ai_copy_templates WHERE id = ?",
    id,
  );

  if (existing) {
    throw new HttpError(409, "该 AI 文案模板标识已存在。");
  }

  await db.run(
    `
      INSERT INTO ai_copy_templates (id, category, title, scene, prompt_text, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    id,
    category,
    title,
    scene,
    promptText,
    new Date().toISOString(),
  );

  return getAdminAiCopyFromDb();
}

export async function updateAdminAiCopy(
  id: string,
  input: Partial<AiCopyTemplateItem>,
) {
  const db = await getDb();
  const existing = await db.get<AiCopyTemplateRow>(
    `
      SELECT id, category, title, scene, prompt_text, updated_at
      FROM ai_copy_templates
      WHERE id = ?
    `,
    id,
  );

  if (!existing) {
    throw new HttpError(404, "未找到对应 AI 文案模板。");
  }

  const next = {
    category:
      typeof input.category === "string" && input.category.trim()
        ? input.category.trim()
        : existing.category,
    title:
      typeof input.title === "string" && input.title.trim()
        ? input.title.trim()
        : existing.title,
    scene:
      typeof input.scene === "string" && input.scene.trim()
        ? input.scene.trim()
        : existing.scene,
    promptText:
      typeof input.promptText === "string" && input.promptText.trim()
        ? input.promptText.trim()
        : existing.prompt_text,
  };

  await db.run(
    `
      UPDATE ai_copy_templates
      SET category = ?, title = ?, scene = ?, prompt_text = ?, updated_at = ?
      WHERE id = ?
    `,
    next.category,
    next.title,
    next.scene,
    next.promptText,
    new Date().toISOString(),
    id,
  );

  return getAdminAiCopyFromDb();
}

export async function deleteAdminAiCopy(id: string) {
  const db = await getDb();
  const existing = await db.get<{ id: string }>(
    "SELECT id FROM ai_copy_templates WHERE id = ?",
    id,
  );

  if (!existing) {
    throw new HttpError(404, "未找到对应 AI 文案模板。");
  }

  await db.run("DELETE FROM ai_copy_templates WHERE id = ?", id);
  return getAdminAiCopyFromDb();
}
