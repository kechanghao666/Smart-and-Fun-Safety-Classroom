import { aiKnowledgeBase } from "../data/mockData";

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

