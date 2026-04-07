import {
  aiCopyTemplateItems,
  examQuestions as fallbackExamQuestions,
  levelBlueprints as fallbackLevelBlueprints,
  THEME_ID,
  THEME_TITLE,
} from "../constants/content";
import { levelOneObservationConfig } from "../constants/levelOneObservation";
import { getDb } from "../db/connection";
import type {
  AiCopyTemplateRow,
  ExamQuestion,
  LevelBlueprint,
  LevelManagementRow,
  ObservationLevelConfig,
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

function parseObservationConfigFromRow(row: LevelManagementRow): ObservationLevelConfig | null {
  if (row.id !== "level-1") {
    return null;
  }

  try {
    const rawObservationScene = row.observation_scene_json
      ? JSON.parse(row.observation_scene_json)
      : levelOneObservationConfig.observationScene;
    const rawTaskSteps = row.task_steps_json
      ? JSON.parse(row.task_steps_json)
      : levelOneObservationConfig.taskSteps;
    const observationScene =
      rawObservationScene && typeof rawObservationScene === "object"
        ? rawObservationScene
        : levelOneObservationConfig.observationScene;
    const taskSteps =
      Array.isArray(rawTaskSteps) && rawTaskSteps.length > 0
        ? rawTaskSteps
        : levelOneObservationConfig.taskSteps;

    return {
      observationScene: {
        ...levelOneObservationConfig.observationScene,
        ...observationScene,
        targets:
          Array.isArray(observationScene.targets) && observationScene.targets.length > 0
            ? observationScene.targets
            : levelOneObservationConfig.observationScene.targets,
        dangerMarkers:
          Array.isArray(observationScene.dangerMarkers) &&
          observationScene.dangerMarkers.length > 0
            ? observationScene.dangerMarkers
            : levelOneObservationConfig.observationScene.dangerMarkers,
        dragMarkers:
          Array.isArray(observationScene.dragMarkers) &&
          observationScene.dragMarkers.length > 0
            ? observationScene.dragMarkers
            : levelOneObservationConfig.observationScene.dragMarkers,
      },
      taskSteps,
      midpointCopy: row.midpoint_copy || levelOneObservationConfig.midpointCopy,
      completionCopy: row.completion_copy || levelOneObservationConfig.completionCopy,
    };
  } catch {
    return levelOneObservationConfig;
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
      SELECT
        id, title, focus, duration, reward_label, feedback_style,
        scene_reference_label, observation_scene_json, task_steps_json,
        midpoint_copy, completion_copy, updated_at
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
      observationConfig:
        override.id === "level-1"
          ? parseObservationConfigFromRow(override)
          : level.observationConfig ?? null,
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
