import { getDb } from "../db/connection";
import type {
  AiCopyTemplateItem,
  AiCopyTemplateRow,
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

function mapAiCopyRow(row: AiCopyTemplateRow): AiCopyTemplateItem {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    scene: row.scene,
    promptText: row.prompt_text,
  };
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

export async function updateAdminQuestionBank(
  id: string,
  input: Partial<QuestionBankManagementItem>,
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

  const next = {
    prompt:
      typeof input.prompt === "string" && input.prompt.trim()
        ? input.prompt.trim()
        : existing.prompt,
    correctLabel:
      typeof input.correctLabel === "string" && input.correctLabel.trim()
        ? input.correctLabel.trim()
        : existing.correct_label,
    explanation:
      typeof input.explanation === "string" && input.explanation.trim()
        ? input.explanation.trim()
        : existing.explanation,
    reviewLevelId:
      input.reviewLevelId === undefined
        ? existing.review_level_id
        : parseReviewLevelId(input.reviewLevelId),
    status:
      input.status === undefined ? existing.status : parseQuestionStatus(input.status),
  };

  await db.run(
    `
      UPDATE question_bank
      SET prompt = ?, correct_label = ?, explanation = ?, review_level_id = ?, status = ?, updated_at = ?
      WHERE id = ?
    `,
    next.prompt,
    next.correctLabel,
    next.explanation,
    next.reviewLevelId,
    next.status,
    new Date().toISOString(),
    id,
  );

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
