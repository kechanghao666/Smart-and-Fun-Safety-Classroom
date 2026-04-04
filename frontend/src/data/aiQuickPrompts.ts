import type { AiQuickPrompt } from "../types";

export const aiQuickPrompts: AiQuickPrompt[] = [
  {
    id: "crossing-observation",
    label: "过马路前先看什么？",
    question: "过马路前要先观察什么？",
    topic: "斑马线与路口观察",
  },
  {
    id: "traffic-light-choice",
    label: "绿灯亮了就一定能走吗？",
    question: "为什么绿灯亮了也要继续看车再过马路？",
    topic: "信号灯与来车判断",
  },
  {
    id: "bus-blind-zone",
    label: "公交车盲区为什么危险？",
    question: "公交车盲区为什么危险？",
    topic: "大车盲区",
  },
  {
    id: "seatbelt-importance",
    label: "为什么一定要系安全带？",
    question: "为什么乘车一定要系安全带？",
    topic: "乘车防护",
  },
  {
    id: "helmet-importance",
    label: "为什么要戴头盔？",
    question: "乘坐电动车为什么要戴头盔？",
    topic: "电动车防护",
  },
  {
    id: "safe-waiting-distance",
    label: "候车时要站多远？",
    question: "在公交站候车时，应该和车门、道路边缘保持什么距离？",
    topic: "候车安全",
  },
];
