import { aiKnowledgeBase } from "../data/mockData";
import { chatWithStudentAi } from "../services/student";
import type { AuthSource, LevelId } from "../types";

export interface AiChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

export function getAiReply(input: string) {
  const normalized = input.trim().toLowerCase();
  const hit = aiKnowledgeBase.find((item) =>
    item.keywords.some((keyword) => normalized.includes(keyword.toLowerCase())),
  );

  if (hit) {
    return hit.answer;
  }

  return "我当前只回答道路安全主题相关的问题。你可以试试问我“为什么要走斑马线”或“公交车盲区是什么”。";
}

export function buildAiQuickPrompts(limit = 3) {
  return aiKnowledgeBase.slice(0, limit);
}

interface ResolveAiReplyOptions {
  authSource: AuthSource;
  authToken?: string | null;
  scene?: "welcome" | "hint" | "qa";
  levelId?: LevelId;
}

interface ResolveAiReplyResult {
  text: string;
  notice?: string;
}

function buildAiReplyText(reply: string, suggestions?: string[]) {
  if (!suggestions?.length) {
    return reply;
  }

  return `${reply}\n\n你还可以继续问：${suggestions.join("、")}`;
}

export async function resolveAiReply(
  input: string,
  options: ResolveAiReplyOptions,
): Promise<ResolveAiReplyResult> {
  if (options.authSource === "api" && options.authToken) {
    try {
      const response = await chatWithStudentAi(options.authToken, {
        scene: options.scene ?? "qa",
        levelId: options.levelId,
        message: input,
      });

      return {
        text: buildAiReplyText(response.reply, response.suggestions),
      };
    } catch {
      return {
        text: getAiReply(input),
        notice: "后端 AI 暂时不可用，当前已回退为本地提示。",
      };
    }
  }

  return {
    text: getAiReply(input),
  };
}
