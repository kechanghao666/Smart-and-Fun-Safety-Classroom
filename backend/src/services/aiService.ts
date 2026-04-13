import { randomUUID } from "crypto";
import { env } from "../config/env";
import { getDb } from "../db/connection";
import { getAiPromptByScene, getExamQuestionsFromDb } from "./courseContentService";
import type {
  AiChatRequest,
  AiChatResponse,
  AuthenticatedUser,
  ExamQuestion,
} from "../types/contracts";

interface SparkResponse {
  code?: number;
  message?: string;
  error?: {
    code?: string | number;
    message?: string;
  };
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface SparkCallOptions {
  recentReplies?: string[];
  forceDifferent?: boolean;
}

const PRODUCT_NAME = "智趣安全学堂";
const THEME_TITLE = "道路安全教育";

const welcomeSuggestions = [
  "进入道路安全主题",
  "查看当前学习进度",
  "继续上次学习",
];

const themeKeywords = [
  "道路安全",
  "交通",
  "斑马线",
  "红绿灯",
  "信号灯",
  "过马路",
  "路口",
  "公交车",
  "私家车",
  "电动车",
  "头盔",
  "安全带",
  "盲区",
  "候车",
  "上车",
  "下车",
  "放学",
  "路线",
  "闯红灯",
  "护栏",
];

const hintSuggestionMap: Record<NonNullable<AiChatRequest["levelId"]>, string[]> = {
  "level-1": ["先找斑马线", "先看信号灯", "先识别危险行为"],
  "level-2": ["先看路线节点", "先避开车辆盲区", "先做安全选择"],
  "level-3": ["先做好防护准备", "先检查上车位置", "先纠正危险动作"],
};

const identitySuggestions = [
  "这个系统能做什么？",
  "我接下来学哪一关？",
  "帮我解释一道题",
];

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s,，。！？；:：“”"'‘’（）()【】\[\]<>《》—\-_/\\?？]+/g, "");
}

function toBigrams(value: string) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return new Set<string>();
  }

  if (normalized.length === 1) {
    return new Set([normalized]);
  }

  const result = new Set<string>();

  for (let index = 0; index < normalized.length - 1; index += 1) {
    result.add(normalized.slice(index, index + 2));
  }

  return result;
}

function computeQuestionMatchScore(message: string, prompt: string) {
  const normalizedMessage = normalizeText(message);
  const normalizedPrompt = normalizeText(prompt);

  if (!normalizedMessage || !normalizedPrompt) {
    return 0;
  }

  if (normalizedMessage === normalizedPrompt) {
    return 1;
  }

  if (
    (normalizedMessage.length >= 6 && normalizedPrompt.includes(normalizedMessage)) ||
    (normalizedPrompt.length >= 6 && normalizedMessage.includes(normalizedPrompt))
  ) {
    return 0.94;
  }

  const messageBigrams = toBigrams(normalizedMessage);
  const promptBigrams = toBigrams(normalizedPrompt);

  if (!messageBigrams.size || !promptBigrams.size) {
    return 0;
  }

  let overlap = 0;

  for (const item of messageBigrams) {
    if (promptBigrams.has(item)) {
      overlap += 1;
    }
  }

  return overlap / Math.max(messageBigrams.size, promptBigrams.size);
}

function normalizeReplyForCompare(value: string) {
  return normalizeText(value);
}

function isRepeatedReply(reply: string, recentReplies: string[]) {
  const normalizedReply = normalizeReplyForCompare(reply);

  if (!normalizedReply) {
    return false;
  }

  return recentReplies.some(
    (item) => normalizeReplyForCompare(item) === normalizedReply,
  );
}

function matchesIdentityQuestion(message: string) {
  const normalized = normalizeText(message);

  if (!normalized) {
    return false;
  }

  return [
    "你是谁",
    "你叫什么",
    "你是做什么的",
    "这是个什么软件",
    "这个系统是什么",
    "介绍一下你自己",
  ].some((pattern) => normalized.includes(normalizeText(pattern)));
}

function isRoadSafetyQuestion(message: string) {
  const normalized = normalizeText(message);

  if (!normalized) {
    return false;
  }

  return themeKeywords.some((keyword) =>
    normalized.includes(normalizeText(keyword)),
  );
}

function buildIdentityReply(): AiChatResponse {
  return {
    reply:
      `${PRODUCT_NAME}的 AI 学习助手。` +
      `我会在这个系统里陪你学习、答疑、做题复盘，还会根据你的学习进度给出提示和总结。` +
      `目前系统以${THEME_TITLE}为首发主题，你也可以把我当成课堂里的智能小伙伴。`,
    suggestions: identitySuggestions,
  };
}

function buildRecordedQuestionReply(question: ExamQuestion): AiChatResponse {
  return {
    reply: question.reviewSuggestion
      ? `${question.explanation} ${question.reviewSuggestion}`
      : question.explanation,
    suggestions: [
      `回看${question.reviewLabel}`,
      "继续问我相关问题",
      "回到当前学习任务",
    ],
  };
}

function buildOffTopicReply(): AiChatResponse {
  return {
    reply:
      "我主要回答道路安全教育相关问题，比如过马路、看红绿灯、乘车安全、头盔和安全带这些内容。你可以把问题换成道路安全主题，我会继续帮你。",
    suggestions: ["过马路前要注意什么？", "为什么乘车要系安全带？", "公交车盲区为什么危险？"],
  };
}

async function resolveRecordedQaReply(message: string): Promise<AiChatResponse | null> {
  if (matchesIdentityQuestion(message)) {
    return buildIdentityReply();
  }

  const questions = await getExamQuestionsFromDb();
  let bestMatch: ExamQuestion | null = null;
  let bestScore = 0;

  for (const question of questions) {
    const score = computeQuestionMatchScore(message, question.prompt);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = question;
    }
  }

  if (bestMatch && bestScore >= 0.62) {
    return buildRecordedQuestionReply(bestMatch);
  }

  return null;
}

async function getRecentSceneReplies(
  userId: string,
  scene: AiChatRequest["scene"],
  levelId?: AiChatRequest["levelId"],
): Promise<string[]> {
  const db = await getDb();
  const rows = await db.all<Array<{ reply: string }>>(
    `
      SELECT reply
      FROM ai_logs
      WHERE user_id = ?
        AND scene = ?
        AND ((? IS NULL AND level_id IS NULL) OR level_id = ?)
      ORDER BY created_at DESC
      LIMIT 4
    `,
    userId,
    scene,
    levelId ?? null,
    levelId ?? null,
  );

  return rows
    .map((row) => row.reply?.trim())
    .filter((item): item is string => Boolean(item));
}

async function buildFallbackReply(input: AiChatRequest): Promise<AiChatResponse> {
  const managedPrompt = await getAiPromptByScene(input.scene);

  if (input.scene === "welcome") {
    return {
      reply:
        managedPrompt ??
        "欢迎回来，我们继续在智趣安全学堂里完成今天的学习任务吧。",
      suggestions: welcomeSuggestions,
    };
  }

  if (input.scene === "hint") {
    const baseReply =
      input.levelId === "level-1"
        ? "先观察图里的安全区域、交通标志和危险行为，再一步一步完成任务。"
        : input.levelId === "level-2"
          ? "先看清路线节点和周围车辆，再决定下一步往哪里走。"
          : input.levelId === "level-3"
            ? "先做好安全准备，再检查有没有危险动作需要纠正。"
            : "先观察环境，再判断，再行动。";

    return {
      reply: managedPrompt ? `${managedPrompt} ${baseReply}` : baseReply,
      suggestions: input.levelId
        ? hintSuggestionMap[input.levelId]
        : ["先看环境", "先找风险", "先做安全选择"],
    };
  }

  if (!input.message?.trim()) {
    return {
      reply: "你可以直接问我道路安全相关问题，我会先查系统里的现有答案，命中不了再帮你调用智能问答服务。",
      suggestions: ["我接下来学哪一关？", "过马路前要注意什么？", "这个系统能做什么？"],
    };
  }

  const recordedReply = await resolveRecordedQaReply(input.message);

  if (recordedReply) {
    return recordedReply;
  }

  if (input.scene === "qa" && !isRoadSafetyQuestion(input.message)) {
    return buildOffTopicReply();
  }

  return {
    reply: "我现在暂时没有连上智能问答服务，请稍后再试一次。",
    suggestions: ["换个问题再试", "回到当前学习任务", "查看学习记录"],
  };
}

async function callSpark(
  input: AiChatRequest,
  user: AuthenticatedUser,
  options: SparkCallOptions = {},
) {
  if (!env.sparkApiPassword) {
    throw new Error("SPARK_API_PASSWORD is missing");
  }

  const managedPrompt = await getAiPromptByScene(input.scene);
  const recentReplyBlock =
    options.recentReplies && options.recentReplies.length > 0
      ? `最近几次已经说过这些提醒，请换一种新的说法，不要重复：${options.recentReplies.join(" | ")}`
      : "";

  const systemPrompt = [
    `你是${PRODUCT_NAME}里的 AI 学习助手。`,
    "请始终使用自然、清晰、友好的中文回答。",
    "你只能回答道路安全教育主题相关内容；如果问题明显无关，请礼貌拒答并把话题引回道路安全学习。",
    "面对学生提问时，优先用短句说明重点，再补一个简单提醒或例子。",
    "如果用户问你是谁或这个系统是什么，请说明你是智趣安全学堂里的 AI 学习助手，负责学习陪伴、答疑和总结。",
    input.scene === "hint"
      ? "当前是关卡提示场景，只给方向、观察点和思考步骤，不要直接把完整答案说出来。"
      : "",
    input.scene === "welcome" || input.scene === "hint"
      ? "欢迎语和提示语必须自然、有变化，不要每次都重复同一句。"
      : "",
    options.forceDifferent
      ? "这一次必须明显换一种说法，语气和措辞都不要与最近一次回答相同。"
      : "",
    recentReplyBlock,
    managedPrompt ? `补充要求：${managedPrompt}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const userPrompt =
    input.scene === "welcome"
      ? input.message?.trim() || "请给学生一句新的欢迎提醒。"
      : input.scene === "hint"
        ? [
            `当前关卡：${input.levelId ?? "unknown"}`,
            `学生当前卡点：${input.message?.trim() || "我需要一点方向提示。"}`,
            "请只给下一步观察方向或思考步骤，不要直接给完整答案。",
          ].join("；")
        : input.message?.trim() ?? "";

  const response = await fetch(env.sparkApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.sparkApiPassword}`,
    },
    body: JSON.stringify({
      model: env.sparkModel,
      user: user.id,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: input.scene === "qa" ? 0.4 : 0.92,
      max_tokens: 768,
    }),
    signal: AbortSignal.timeout(20_000),
  });

  const responseText = await response.text();
  let data: SparkResponse | null = null;

  try {
    data = responseText ? (JSON.parse(responseText) as SparkResponse) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const remoteMessage =
      data?.error?.message ||
      data?.message ||
      `Spark request failed with status ${response.status}`;
    throw new Error(remoteMessage);
  }

  if (data?.code && data.code !== 0) {
    throw new Error(
      data.error?.message ||
        data.message ||
        `Spark request failed with code ${data.code}`,
    );
  }

  const reply = data?.choices?.[0]?.message?.content?.trim();

  if (!reply) {
    throw new Error("Spark reply is empty");
  }

  return reply;
}

async function logAiReply(
  userId: string,
  input: AiChatRequest,
  reply: string,
  provider: string,
) {
  const db = await getDb();

  await db.run(
    `
      INSERT INTO ai_logs (id, user_id, scene, level_id, message, reply, provider, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    randomUUID(),
    userId,
    input.scene,
    input.levelId ?? null,
    input.message ?? null,
    reply,
    provider,
    new Date().toISOString(),
  );
}

export async function chatWithAi(
  user: AuthenticatedUser,
  input: AiChatRequest,
): Promise<AiChatResponse> {
  const fallback = await buildFallbackReply(input);
  const recentReplies =
    input.scene === "welcome" || input.scene === "hint"
      ? await getRecentSceneReplies(user.id, input.scene, input.levelId)
      : [];

  if (input.scene === "qa") {
    const recordedReply = await resolveRecordedQaReply(input.message?.trim() ?? "");

    if (recordedReply) {
      await logAiReply(user.id, input, recordedReply.reply, "template");
      return recordedReply;
    }

    if (!isRoadSafetyQuestion(input.message?.trim() ?? "")) {
      const offTopicReply = buildOffTopicReply();
      await logAiReply(user.id, input, offTopicReply.reply, "fallback");
      return offTopicReply;
    }
  }

  try {
    let reply = await callSpark(input, user, { recentReplies });

    if (
      (input.scene === "welcome" || input.scene === "hint") &&
      recentReplies.length > 0 &&
      isRepeatedReply(reply, recentReplies)
    ) {
      reply = await callSpark(input, user, {
        recentReplies,
        forceDifferent: true,
      });
    }

    const response = {
      reply,
      suggestions:
        input.scene === "welcome"
          ? welcomeSuggestions
          : input.scene === "hint" && input.levelId
            ? hintSuggestionMap[input.levelId]
            : ["继续提问", "回到当前学习任务", "查看学习记录"],
    };

    await logAiReply(user.id, input, response.reply, "spark-http");
    return response;
  } catch (error) {
    if (!env.aiFallbackEnabled) {
      throw error;
    }

    await logAiReply(user.id, input, fallback.reply, "fallback");
    return fallback;
  }
}
