import { aiQuickPrompts } from "../data/aiQuickPrompts";
import { chatWithStudentAi } from "../services/student";
import type { AiQuickPrompt, AuthSource, LevelId } from "../types";

export interface AiChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

export function buildAiQuickPrompts(limit = 3): AiQuickPrompt[] {
  return aiQuickPrompts.slice(0, limit);
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
        text: "当前 AI 服务暂时不可用，请稍后重试，或先返回主题页继续学习。",
        notice: "AI 请求失败，本次没有切回本地示例回答。",
      };
    }
  }

  return {
    text: "当前会话不可用，请重新登录后再使用 AI。",
    notice: "未检测到有效登录会话。",
  };
}
