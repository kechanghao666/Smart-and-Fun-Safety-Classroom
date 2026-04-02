import {
  aiCopyTemplateItems,
  examQuestions as fallbackExamQuestions,
  levelBlueprints as fallbackLevelBlueprints,
  THEME_ID,
  THEME_TITLE,
} from "../constants/content";
import { getDb } from "../db/connection";
import type {
  AiCopyTemplateRow,
  ExamQuestion,
  LevelBlueprint,
  LevelManagementRow,
  QuestionBankRow,
  ThemeManagementRow,
} from "../types/contracts";

function parseJsonArray(value: string, fallback: string[]) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : fallback;
  } catch {
    return fallback;
  }
}

export async function getThemeTitle() {
  const db = await getDb();
  const row = await db.get<ThemeManagementRow>(
    `
      SELECT id, title, description, cover_label, is_open, sort_order, updated_at
      FROM themes
      WHERE id = ?
    `,
    THEME_ID,
  );

  return row?.title ?? THEME_TITLE;
}

export async function getLevelBlueprintsFromDb(): Promise<LevelBlueprint[]> {
  const db = await getDb();
  const rows = await db.all<LevelManagementRow[]>(
    `
      SELECT id, title, focus, duration, reward_label, feedback_style, updated_at
      FROM admin_levels
      ORDER BY id ASC
    `,
  );
  const rowMap = new Map(rows.map((row) => [row.id, row]));

  return fallbackLevelBlueprints.map((level) => {
    const override = rowMap.get(level.id);

    if (!override) {
      return level;
    }

    return {
      ...level,
      title: override.title,
      focus: override.focus,
      duration: override.duration,
    };
  });
}

export async function getExamQuestionsFromDb(): Promise<ExamQuestion[]> {
  const db = await getDb();
  const rows = await db.all<QuestionBankRow[]>(
    `
      SELECT
        id, prompt, options_json, correct_index, correct_label, explanation,
        review_level_id, review_label, review_suggestion, status, updated_at
      FROM question_bank
      WHERE status = 'enabled'
      ORDER BY id ASC
    `,
  );

  if (!rows.length) {
    return fallbackExamQuestions;
  }

  return rows.map((row) => {
    const fallback = fallbackExamQuestions.find((item) => item.id === row.id);

    return {
      id: row.id,
      prompt: row.prompt,
      options: parseJsonArray(row.options_json, fallback?.options ?? []),
      correctIndex: row.correct_index,
      explanation: row.explanation,
      reviewLevelId: row.review_level_id,
      reviewLabel: row.review_label || fallback?.reviewLabel || "",
      reviewSuggestion: row.review_suggestion || fallback?.reviewSuggestion || "",
    };
  });
}

export async function getAiPromptByScene(scene: string) {
  const db = await getDb();
  const row = await db.get<AiCopyTemplateRow>(
    `
      SELECT id, category, title, scene, prompt_text, updated_at
      FROM ai_copy_templates
      WHERE scene = ?
      ORDER BY id ASC
      LIMIT 1
    `,
    scene,
  );

  return (
    row?.prompt_text ??
    aiCopyTemplateItems.find((item) => item.scene === scene)?.promptText ??
    null
  );
}
