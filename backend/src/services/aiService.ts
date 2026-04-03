import { randomUUID } from "crypto";
import { env } from "../config/env";
import { getDb } from "../db/connection";
import {
  hintSuggestionMap,
  THEME_TITLE,
  themeKeywords,
  welcomeSuggestions,
} from "../constants/content";
import { getAiPromptByScene } from "./courseContentService";
import type {
  AiChatRequest,
  AiChatResponse,
  AuthenticatedUser,
} from "../types/contracts";

interface SparkResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

function buildQaFallback(message: string) {
  if (message.includes("斑马线")) {
    return "斑马线是行人更容易被司机看到、也更容易被礼让的安全通行区域，所以过马路要优先选择斑马线。";
  }

  if (message.includes("红绿灯") || message.includes("信号灯")) {
    return "看信号灯时不能只看颜色，还要同时看车辆有没有停稳，再决定能不能通过。";
  }

  if (message.includes("头盔") || message.includes("电动车")) {
    return "乘坐电动车时戴好头盔能保护头部，是最关键的安全准备之一。";
  }

  if (message.includes("安全带") || message.includes("私家车")) {
    return "乘坐私家车前先系安全带，这是车内出行最基础也最重要的保护动作。";
  }

  if (message.includes("盲区") || message.includes("公交车")) {
    return "公交车和其他大型车辆前方、侧方都可能有盲区，最安全的做法是先避开盲区，再确认是否能够通行。";
  }

  return "道路安全问题可以从“看灯、看车、看路”和“先准备好再行动”这两个方向理解。";
}

function isRoadSafetyTopic(message: string) {
  return themeKeywords.some((keyword) => message.includes(keyword));
}

async function buildFallbackReply(input: AiChatRequest): Promise<AiChatResponse> {
  const managedPrompt = await getAiPromptByScene(input.scene);

  if (input.scene === "welcome") {
    return {
      reply:
        managedPrompt ??
        "欢迎回来，我们继续完成道路安全教育主题。今天也记住先观察、再判断、再行动。",
      suggestions: welcomeSuggestions,
    };
  }

  if (input.scene === "hint") {
    const baseReply =
      input.levelId === "level-1"
        ? "先把注意力放在斑马线、信号灯和危险行为上，按任务顺序一个个确认。"
        : input.levelId === "level-2"
          ? "先看关键节点有没有车流、盲区和抄近路诱惑，再决定往哪走。"
          : input.levelId === "level-3"
            ? "先检查有没有做好安全准备，再纠正不安全动作，不要急着直接提交。"
            : "先找到这一关最重要的安全原则，再按“观察环境、判断风险、做出安全选择”的顺序试一次。";

    return {
      reply: managedPrompt ? `${managedPrompt} ${baseReply}` : baseReply,
      suggestions: input.levelId
        ? hintSuggestionMap[input.levelId]
        : ["先看环境", "先找风险", "先做安全选择"],
    };
  }

  const message = input.message?.trim() ?? "";

  if (!message || !isRoadSafetyTopic(message)) {
    return {
      reply: "我只回答道路安全教育主题的问题。你可以继续问我斑马线、红绿灯、公交车盲区、安全带或头盔这些内容。",
      suggestions: ["为什么要走斑马线？", "公交车盲区是什么？", "为什么乘车要系安全带？"],
    };
  }

  return {
    reply: buildQaFallback(message),
    suggestions: ["再问一个道路安全问题", "回到当前关卡继续练习"],
  };
}

async function callSpark(input: AiChatRequest, user: AuthenticatedUser) {
  if (!env.sparkApiPassword) {
    throw new Error("SPARK_API_PASSWORD is missing");
  }

  const systemPrompt = [
    "你是“安全小助手”，服务对象是小学生。",
    `你只回答“${THEME_TITLE}”主题问题，禁止扩展到其他学科、娱乐或无关内容。`,
    "如果用户问题与道路安全无关，直接拒答并把话题引导回道路安全主题。",
    "如果 scene=hint，只能提供方向、观察步骤和提醒，不能直接给出完整答案。",
    "回复要简短、友好、适合儿童阅读。",
  ].join("");

  const userPrompt = JSON.stringify({
    scene: input.scene,
    levelId: input.levelId ?? null,
    message: input.message ?? "",
    scope: "道路安全教育主题内答疑",
  });

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
      temperature: 0.3,
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    throw new Error(`Spark request failed with status ${response.status}`);
  }

  const data = (await response.json()) as SparkResponse;
  const reply = data.choices?.[0]?.message?.content?.trim();

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

  if (input.scene === "qa") {
    const message = input.message?.trim() ?? "";

    if (!message || !isRoadSafetyTopic(message)) {
      await logAiReply(user.id, input, fallback.reply, "fallback");
      return fallback;
    }
  }

  try {
    const reply = await callSpark(input, user);
    const response = {
      reply,
      suggestions:
        input.scene === "welcome"
          ? welcomeSuggestions
          : input.scene === "hint" && input.levelId
            ? hintSuggestionMap[input.levelId]
            : ["继续围绕道路安全提问", "回到当前学习任务"],
    };
    await logAiReply(user.id, input, response.reply, "spark");
    return response;
  } catch (error) {
    if (!env.aiFallbackEnabled) {
      throw error;
    }

    await logAiReply(user.id, input, fallback.reply, "fallback");
    return fallback;
  }
}
