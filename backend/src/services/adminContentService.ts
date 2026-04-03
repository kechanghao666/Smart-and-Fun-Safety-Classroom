import { defaultGrowthConfig } from "../constants/growth";
import { examQuestions } from "../constants/content";
import { getDb } from "../db/connection";
import type {
  AiCopyTemplateItem,
  ExamQuestion,
  GrowthConfigItem,
  LevelId,
  LevelManagementItem,
  QuestionBankManagementItem,
  ThemeManagementItem,
} from "../types/contracts";
import { HttpError } from "../utils/httpError";

type ThemeAccent = "sky" | "mint" | "orange";

type ThemeRow = {
  id: string;
  title: string;
  description: string;
  cover_label: string;
  cover_accent: string;
  cover_illustration: string;
  is_open: number;
  sort_order: number;
  updated_at: string;
};

type LevelRow = {
  id: LevelId;
  title: string;
  focus: string;
  duration: string;
  display_order: number;
  scene_asset_label: string;
  task_outline_json: string;
  reward_label: string;
  feedback_style: string;
  feedback_copy: string;
  hotspot_items_json: string;
  prop_items_json: string;
  target_area_notes_json: string;
  updated_at: string;
};

type QuestionRow = {
  id: string;
  theme_id: string;
  theme_title: string;
  prompt: string;
  options_json: string;
  correct_index: number;
  correct_label: string;
  explanation: string;
  review_level_id: LevelId;
  review_label: string;
  review_suggestion: string;
  status: "enabled" | "draft";
  updated_at: string;
};

type AiCopyRow = {
  id: string;
  category: string;
  title: string;
  scene: string;
  prompt_text: string;
  updated_at: string;
};

type GrowthConfigRow = {
  id: string;
  title: string;
  config_json: string;
  updated_at: string;
};

type ThemePayload = Partial<ThemeManagementItem> & {
  coverAccent?: ThemeAccent;
  coverIllustration?: string;
};

type LevelPayload = Partial<LevelManagementItem> & {
  displayOrder?: number;
  sceneAssetLabel?: string;
  taskOutline?: string[];
  feedbackCopy?: string;
  hotspotItems?: string[];
  propItems?: string[];
  targetAreaNotes?: string[];
};

type QuestionPayload = Partial<QuestionBankManagementItem> &
  Partial<ExamQuestion> & {
    themeId?: string;
    themeTitle?: string;
    correctOptionIndex?: number;
  };

const themeVisualFallbacks: Record<string, { coverAccent: ThemeAccent; coverIllustration: string }> = {
  "road-safety": {
    coverAccent: "sky",
    coverIllustration: "斑马线与信号灯主题插画",
  },
  "campus-safety": {
    coverAccent: "mint",
    coverIllustration: "校园操场与教学楼插画",
  },
};

const levelFieldFallbacks: Record<
  LevelId,
  {
    displayOrder: number;
    sceneAssetLabel: string;
    taskOutline: string[];
    feedbackCopy: string;
    hotspotItems: string[];
    propItems: string[];
    targetAreaNotes: string[];
  }
> = {
  "level-1": {
    displayOrder: 1,
    sceneAssetLabel: "城市路口主场景插画 A",
    taskOutline: [
      "找出安全通行位置",
      "识别当前信号灯状态",
      "圈出错误过马路行为",
      "找到人行横道交通标志",
    ],
    feedbackCopy: "完成观察任务后，高亮正确热点并提醒先看灯、再看车、最后行动。",
    hotspotItems: ["斑马线热点", "信号灯热点", "翻越护栏危险行为标点", "人行横道标志标点"],
    propItems: [],
    targetAreaNotes: ["场景中错误点击只出现轻提示气泡，不中断当前任务。"],
  },
  "level-2": {
    displayOrder: 2,
    sceneAssetLabel: "放学路线地图插画 B",
    taskOutline: ["校门口是否抄近路", "十字路口是否立即通过", "公交站是否避开盲区"],
    feedbackCopy: "节点选择后展示事件卡结果，错误选择仅扣减安全值并说明风险后果。",
    hotspotItems: ["校门口近路节点", "十字路口观察节点", "公交站候车节点"],
    propItems: [],
    targetAreaNotes: ["路线图上每个节点都要给出风险说明与安全建议。"],
  },
  "level-3": {
    displayOrder: 3,
    sceneAssetLabel: "安全出行守护插画 C",
    taskOutline: ["出发前佩戴头盔", "上车后系好安全带", "候车时保持安全距离"],
    feedbackCopy: "完成每一步后即时反馈原因，把防护动作和实际出行场景关联起来。",
    hotspotItems: ["头盔佩戴区域", "安全带卡扣区域", "候车安全线区域"],
    propItems: ["儿童安全头盔", "安全带插扣", "候车安全线提示牌"],
    targetAreaNotes: ["拖拽道具需要吸附到目标区域，并在成功后给出鼓励反馈。"],
  },
};

const questionFallbacks = new Map(
  examQuestions.map((question) => [question.id, question]),
);

function parseStringArray(value: string | null | undefined, fallback: string[] = []) {
  if (!value) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string")
      ? parsed
      : fallback;
  } catch {
    return fallback;
  }
}

function parseThemeAccent(value: unknown, fallback: ThemeAccent = "sky"): ThemeAccent {
  return value === "mint" || value === "orange" || value === "sky" ? value : fallback;
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

function parseDisplayOrder(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  throw new HttpError(400, "关卡展示顺序必须为正整数。");
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

function mapThemeRow(row: ThemeRow) {
  const fallback = themeVisualFallbacks[row.id] ?? themeVisualFallbacks["road-safety"];

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    coverLabel: row.cover_label,
    coverAccent: parseThemeAccent(row.cover_accent, fallback.coverAccent),
    coverIllustration: row.cover_illustration || fallback.coverIllustration,
    isOpen: Boolean(row.is_open),
    sortOrder: row.sort_order,
  };
}

function mapLevelRow(row: LevelRow) {
  const fallback = levelFieldFallbacks[row.id];

  return {
    id: row.id,
    title: row.title,
    focus: row.focus,
    duration: row.duration,
    displayOrder: row.display_order || fallback.displayOrder,
    sceneAssetLabel: row.scene_asset_label || fallback.sceneAssetLabel,
    taskOutline: parseStringArray(row.task_outline_json, fallback.taskOutline),
    rewardLabel: row.reward_label,
    feedbackStyle: row.feedback_style,
    feedbackCopy: row.feedback_copy || fallback.feedbackCopy,
    hotspotItems: parseStringArray(row.hotspot_items_json, fallback.hotspotItems),
    propItems: parseStringArray(row.prop_items_json, fallback.propItems),
    targetAreaNotes: parseStringArray(
      row.target_area_notes_json,
      fallback.targetAreaNotes,
    ),
  };
}

function mapQuestionBankRow(row: QuestionRow) {
  const fallback = questionFallbacks.get(row.id);

  return {
    id: row.id,
    themeId: row.theme_id || "road-safety",
    themeTitle: row.theme_title || "道路安全教育",
    prompt: row.prompt,
    options: parseStringArray(row.options_json, fallback?.options ?? []),
    correctOptionIndex:
      typeof row.correct_index === "number"
        ? row.correct_index
        : fallback?.correctIndex ?? 0,
    correctLabel: row.correct_label,
    explanation: row.explanation,
    reviewLevelId: row.review_level_id,
    status: row.status,
  };
}

function mapAiCopyRow(row: AiCopyRow): AiCopyTemplateItem {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    scene: row.scene,
    promptText: row.prompt_text,
  };
}

function parseLevelStringArray(value: unknown, fieldLabel: string) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item.trim())) {
    throw new HttpError(400, `${fieldLabel} 必须为字符串数组。`);
  }

  return value.map((item) => item.trim());
}

function parseQuestionPayload(input: QuestionPayload, fallback?: QuestionRow) {
  const fallbackQuestion = fallback ? questionFallbacks.get(fallback.id) : undefined;
  const prompt =
    typeof input.prompt === "string" && input.prompt.trim()
      ? input.prompt.trim()
      : fallback?.prompt;
  const explanation =
    typeof input.explanation === "string" && input.explanation.trim()
      ? input.explanation.trim()
      : fallback?.explanation;
  const themeId =
    typeof input.themeId === "string" && input.themeId.trim()
      ? input.themeId.trim()
      : fallback?.theme_id ?? "road-safety";
  const themeTitle =
    typeof input.themeTitle === "string" && input.themeTitle.trim()
      ? input.themeTitle.trim()
      : fallback?.theme_title ?? "道路安全教育";
  const reviewLevelId =
    input.reviewLevelId !== undefined
      ? parseReviewLevelId(input.reviewLevelId)
      : fallback?.review_level_id;
  const status =
    input.status !== undefined
      ? parseQuestionStatus(input.status)
      : fallback?.status ?? "enabled";
  const options =
    Array.isArray(input.options) && input.options.every((item) => typeof item === "string")
      ? input.options.map((item) => item.trim())
      : fallback
        ? parseStringArray(fallback.options_json, fallbackQuestion?.options ?? [])
        : fallbackQuestion?.options;
  const correctIndexRaw =
    typeof input.correctOptionIndex === "number"
      ? input.correctOptionIndex
      : typeof input.correctIndex === "number"
        ? input.correctIndex
        : fallback?.correct_index ?? fallbackQuestion?.correctIndex;
  const correctLabel =
    typeof input.correctLabel === "string" && input.correctLabel.trim()
      ? input.correctLabel.trim()
      : options && typeof correctIndexRaw === "number"
        ? options[correctIndexRaw] ?? fallback?.correct_label
        : fallback?.correct_label;
  const reviewLabel =
    typeof input.reviewLabel === "string" && input.reviewLabel.trim()
      ? input.reviewLabel.trim()
      : fallback?.review_label ?? fallbackQuestion?.reviewLabel;
  const reviewSuggestion =
    typeof input.reviewSuggestion === "string" && input.reviewSuggestion.trim()
      ? input.reviewSuggestion.trim()
      : fallback?.review_suggestion ?? fallbackQuestion?.reviewSuggestion;

  if (!prompt || !explanation || !correctLabel || !reviewLevelId || !themeId || !themeTitle) {
    throw new HttpError(400, "题库字段不完整。");
  }

  if (!options || !options.length || options.some((item) => !item)) {
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
    themeId,
    themeTitle,
    prompt,
    options,
    correctIndex: correctIndexRaw,
    correctLabel,
    explanation,
    reviewLevelId,
    reviewLabel,
    reviewSuggestion,
    status,
  };
}

export async function getAdminThemesFromDb() {
  const db = await getDb();
  const rows = await db.all<ThemeRow[]>(`
    SELECT
      id,
      title,
      description,
      cover_label,
      cover_accent,
      cover_illustration,
      is_open,
      sort_order,
      updated_at
    FROM themes
    ORDER BY sort_order ASC, id ASC
  `);

  return rows.map(mapThemeRow);
}

export async function createAdminTheme(input: ThemePayload) {
  const db = await getDb();
  const id = String(input.id ?? "").trim();
  const title = String(input.title ?? "").trim();
  const description = String(input.description ?? "").trim();
  const coverLabel = String(input.coverLabel ?? "").trim();
  const coverAccent = parseThemeAccent(input.coverAccent, themeVisualFallbacks[id]?.coverAccent ?? "sky");
  const coverIllustration = String(input.coverIllustration ?? themeVisualFallbacks[id]?.coverIllustration ?? "").trim();

  if (!id || !title || !description || !coverLabel) {
    throw new HttpError(400, "主题新增字段不完整。");
  }

  const existing = await db.get<{ id: string }>("SELECT id FROM themes WHERE id = ?", id);
  if (existing) {
    throw new HttpError(409, "该主题标识已存在。");
  }

  await db.run(
    `
      INSERT INTO themes (
        id, title, description, cover_label, cover_accent, cover_illustration,
        is_open, sort_order, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    title,
    description,
    coverLabel,
    coverAccent,
    coverIllustration,
    parseOpenFlag(input.isOpen),
    parseSortOrder(input.sortOrder),
    new Date().toISOString(),
  );

  return getAdminThemesFromDb();
}

export async function updateAdminTheme(id: string, input: ThemePayload) {
  const db = await getDb();
  const existing = await db.get<ThemeRow>(
    `
      SELECT
        id,
        title,
        description,
        cover_label,
        cover_accent,
        cover_illustration,
        is_open,
        sort_order,
        updated_at
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
    coverAccent:
      input.coverAccent !== undefined
        ? parseThemeAccent(input.coverAccent, parseThemeAccent(existing.cover_accent))
        : parseThemeAccent(existing.cover_accent),
    coverIllustration:
      typeof input.coverIllustration === "string" && input.coverIllustration.trim()
        ? input.coverIllustration.trim()
        : existing.cover_illustration,
    isOpen: input.isOpen === undefined ? existing.is_open : parseOpenFlag(input.isOpen),
    sortOrder:
      input.sortOrder === undefined ? existing.sort_order : parseSortOrder(input.sortOrder),
  };

  await db.run(
    `
      UPDATE themes
      SET
        title = ?,
        description = ?,
        cover_label = ?,
        cover_accent = ?,
        cover_illustration = ?,
        is_open = ?,
        sort_order = ?,
        updated_at = ?
      WHERE id = ?
    `,
    next.title,
    next.description,
    next.coverLabel,
    next.coverAccent,
    next.coverIllustration,
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
  const existing = await db.get<{ id: string }>("SELECT id FROM themes WHERE id = ?", id);
  if (!existing) {
    throw new HttpError(404, "未找到对应主题。");
  }

  await db.run("DELETE FROM themes WHERE id = ?", id);
  return getAdminThemesFromDb();
}

export async function getAdminLevelsFromDb() {
  const db = await getDb();
  const rows = await db.all<LevelRow[]>(`
    SELECT
      id,
      title,
      focus,
      duration,
      display_order,
      scene_asset_label,
      task_outline_json,
      reward_label,
      feedback_style,
      feedback_copy,
      hotspot_items_json,
      prop_items_json,
      target_area_notes_json,
      updated_at
    FROM admin_levels
    ORDER BY display_order ASC, id ASC
  `);

  return rows.map(mapLevelRow);
}

export async function updateAdminLevel(id: string, input: LevelPayload) {
  const db = await getDb();
  const existing = await db.get<LevelRow>(
    `
      SELECT
        id,
        title,
        focus,
        duration,
        display_order,
        scene_asset_label,
        task_outline_json,
        reward_label,
        feedback_style,
        feedback_copy,
        hotspot_items_json,
        prop_items_json,
        target_area_notes_json,
        updated_at
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
    displayOrder:
      input.displayOrder === undefined
        ? existing.display_order
        : parseDisplayOrder(input.displayOrder),
    sceneAssetLabel:
      typeof input.sceneAssetLabel === "string" && input.sceneAssetLabel.trim()
        ? input.sceneAssetLabel.trim()
        : existing.scene_asset_label,
    taskOutline:
      input.taskOutline !== undefined
        ? parseLevelStringArray(input.taskOutline, "任务内容")
        : parseStringArray(existing.task_outline_json),
    rewardLabel:
      typeof input.rewardLabel === "string" && input.rewardLabel.trim()
        ? input.rewardLabel.trim()
        : existing.reward_label,
    feedbackStyle:
      typeof input.feedbackStyle === "string" && input.feedbackStyle.trim()
        ? input.feedbackStyle.trim()
        : existing.feedback_style,
    feedbackCopy:
      typeof input.feedbackCopy === "string" && input.feedbackCopy.trim()
        ? input.feedbackCopy.trim()
        : existing.feedback_copy,
    hotspotItems:
      input.hotspotItems !== undefined
        ? parseLevelStringArray(input.hotspotItems, "热点配置")
        : parseStringArray(existing.hotspot_items_json),
    propItems:
      input.propItems !== undefined
        ? parseLevelStringArray(input.propItems, "道具列表")
        : parseStringArray(existing.prop_items_json),
    targetAreaNotes:
      input.targetAreaNotes !== undefined
        ? parseLevelStringArray(input.targetAreaNotes, "目标区域说明")
        : parseStringArray(existing.target_area_notes_json),
  };

  await db.run(
    `
      UPDATE admin_levels
      SET
        title = ?,
        focus = ?,
        duration = ?,
        display_order = ?,
        scene_asset_label = ?,
        task_outline_json = ?,
        reward_label = ?,
        feedback_style = ?,
        feedback_copy = ?,
        hotspot_items_json = ?,
        prop_items_json = ?,
        target_area_notes_json = ?,
        updated_at = ?
      WHERE id = ?
    `,
    next.title,
    next.focus,
    next.duration,
    next.displayOrder,
    next.sceneAssetLabel,
    JSON.stringify(next.taskOutline),
    next.rewardLabel,
    next.feedbackStyle,
    next.feedbackCopy,
    JSON.stringify(next.hotspotItems),
    JSON.stringify(next.propItems),
    JSON.stringify(next.targetAreaNotes),
    new Date().toISOString(),
    id,
  );

  return getAdminLevelsFromDb();
}

export async function getAdminQuestionBankFromDb() {
  const db = await getDb();
  const rows = await db.all<QuestionRow[]>(`
    SELECT
      id,
      theme_id,
      theme_title,
      prompt,
      options_json,
      correct_index,
      correct_label,
      explanation,
      review_level_id,
      review_label,
      review_suggestion,
      status,
      updated_at
    FROM question_bank
    ORDER BY id ASC
  `);

  return rows.map(mapQuestionBankRow);
}

export async function createAdminQuestionBank(input: QuestionPayload) {
  const db = await getDb();
  const id = String(input.id ?? "").trim();

  if (!id) {
    throw new HttpError(400, "题目编号不能为空。");
  }

  const existing = await db.get<{ id: string }>("SELECT id FROM question_bank WHERE id = ?", id);
  if (existing) {
    throw new HttpError(409, "该题目编号已存在。");
  }

  const parsed = parseQuestionPayload({ ...input, id });

  await db.run(
    `
      INSERT INTO question_bank (
        id,
        theme_id,
        theme_title,
        prompt,
        options_json,
        correct_index,
        correct_label,
        explanation,
        review_level_id,
        review_label,
        review_suggestion,
        status,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    parsed.themeId,
    parsed.themeTitle,
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

export async function updateAdminQuestionBank(id: string, input: QuestionPayload) {
  const db = await getDb();
  const existing = await db.get<QuestionRow>(
    `
      SELECT
        id,
        theme_id,
        theme_title,
        prompt,
        options_json,
        correct_index,
        correct_label,
        explanation,
        review_level_id,
        review_label,
        review_suggestion,
        status,
        updated_at
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
        theme_id = ?,
        theme_title = ?,
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
    next.themeId,
    next.themeTitle,
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
  const existing = await db.get<{ id: string }>("SELECT id FROM question_bank WHERE id = ?", id);
  if (!existing) {
    throw new HttpError(404, "未找到对应题目。");
  }

  await db.run("DELETE FROM question_bank WHERE id = ?", id);
  return getAdminQuestionBankFromDb();
}

export async function getAdminAiCopyFromDb() {
  const db = await getDb();
  const rows = await db.all<AiCopyRow[]>(`
    SELECT id, category, title, scene, prompt_text, updated_at
    FROM ai_copy_templates
    ORDER BY id ASC
  `);

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

export async function updateGrowthConfig(input: Partial<GrowthConfigItem>) {
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

  const existing = await db.get<{ id: string }>("SELECT id FROM ai_copy_templates WHERE id = ?", id);
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

export async function updateAdminAiCopy(id: string, input: Partial<AiCopyTemplateItem>) {
  const db = await getDb();
  const existing = await db.get<AiCopyRow>(
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
  const existing = await db.get<{ id: string }>("SELECT id FROM ai_copy_templates WHERE id = ?", id);
  if (!existing) {
    throw new HttpError(404, "未找到对应 AI 文案模板。");
  }

  await db.run("DELETE FROM ai_copy_templates WHERE id = ?", id);
  return getAdminAiCopyFromDb();
}
