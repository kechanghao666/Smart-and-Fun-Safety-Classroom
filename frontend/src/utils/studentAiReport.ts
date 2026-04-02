import { examQuestions } from "../data/mockData";
import type { AppState, LevelId } from "../types";
import { buildGrowthSnapshot } from "./studentGrowth";

interface ReportFocusArea {
  id: string;
  title: string;
  suggestion: string;
  prompts: string[];
  href: string;
  ctaLabel: string;
}

interface ReportAction {
  id: string;
  title: string;
  detail: string;
  href: string;
  ctaLabel: string;
}

interface ReportMilestone {
  id: string;
  label: string;
  value: string;
  note: string;
}

export interface StudentAiReportSnapshot {
  headline: string;
  summary: string;
  scoreLabel: string;
  scoreCaption: string;
  progressLabel: string;
  growthLabel: string;
  encouragement: string;
  strengths: string[];
  focusAreas: ReportFocusArea[];
  actions: ReportAction[];
  milestones: ReportMilestone[];
  badges: string[];
}

const fallbackSuggestionByLevel: Record<LevelId, string> = {
  "level-1": "回到第一关，继续练习斑马线、信号灯和危险行为识别。",
  "level-2": "回到第二关，继续练习路线判断和关键节点风险选择。",
  "level-3": "回到第三关，继续强化安全带、头盔和候车距离。",
};

function buildHeadline(state: AppState, wrongQuestionCount: number, completedLevels: number) {
  if (state.progress.exam.status === "completed" && wrongQuestionCount === 0) {
    return "你已经完成本轮道路安全学习闭环，表现很稳定。";
  }

  if (state.progress.exam.status === "completed") {
    return "你已经完成主题学习，接下来把错题对应的关卡再补强一轮。";
  }

  if (state.progress.exam.status === "available") {
    return "三关已经全部完成，最后一步是完成主题考试，把这轮学习真正收口。";
  }

  return `你已经完成 ${completedLevels} / 3 关，继续把道路安全主题稳稳推进下去。`;
}

function buildStrengths(state: AppState) {
  const completedResults = Object.values(state.progress.levelResults)
    .filter((result): result is NonNullable<typeof result> => Boolean(result))
    .sort((left, right) => right.score - left.score);

  if (completedResults.length > 0) {
    return completedResults.slice(0, 3).map((result) => result.highlight);
  }

  const growth = buildGrowthSnapshot(state);
  return growth.dimensions
    .slice()
    .sort((left, right) => right.score - left.score)
    .slice(0, 2)
    .map((dimension) => `${dimension.label}：${dimension.note}`);
}

function buildFocusAreas(state: AppState): ReportFocusArea[] {
  const wrongQuestionDetails = examQuestions.filter((question) =>
    state.progress.exam.wrongQuestionIds.includes(question.id),
  );

  if (wrongQuestionDetails.length > 0) {
    const focusAreaMap = new Map<
      LevelId,
      {
        prompts: string[];
        label: string;
        suggestion: string;
      }
    >();

    wrongQuestionDetails.forEach((question) => {
      const current = focusAreaMap.get(question.reviewLevelId);

      if (current) {
        current.prompts.push(question.prompt);
        return;
      }

      focusAreaMap.set(question.reviewLevelId, {
        prompts: [question.prompt],
        label: question.reviewLabel,
        suggestion: question.reviewSuggestion,
      });
    });

    return Array.from(focusAreaMap.entries()).map(([levelId, item]) => ({
      id: levelId,
      title: item.label,
      suggestion: item.suggestion,
      prompts: item.prompts,
      href: `/student/theme/road-safety/level/${levelId}`,
      ctaLabel: "去复习本关",
    }));
  }

  const nextLevel = state.progress.levels.find(
    (level) => level.status === "available" || level.status === "in_progress",
  );

  if (nextLevel) {
    return [
      {
        id: nextLevel.id,
        title: nextLevel.title,
        suggestion: `当前最适合继续推进的是 ${nextLevel.title}，完成后成长值和结果反馈都会继续更新。`,
        prompts: [fallbackSuggestionByLevel[nextLevel.id]],
        href: `/student/theme/road-safety/level/${nextLevel.id}`,
        ctaLabel: "继续当前关卡",
      },
    ];
  }

  if (state.progress.exam.status === "available") {
    return [
      {
        id: "exam",
        title: "主题考试",
        suggestion: "三关已经完成，现在最重要的是完成主题考试，把这节课真正闭环。",
        prompts: ["进入考试前，先回想斑马线、盲区、安全带和头盔这几个重点。"],
        href: "/student/theme/road-safety/exam",
        ctaLabel: "进入考试",
      },
    ];
  }

  return [
    {
      id: "ai-review",
      title: "AI 巩固问答",
      suggestion: "继续围绕斑马线、公交车盲区和乘车防护提问，稳定巩固本轮学习重点。",
      prompts: ["可以继续问 AI：为什么要走斑马线？公交车盲区是什么？"],
      href: "/student/ai",
      ctaLabel: "继续问 AI",
    },
  ];
}

function buildActions(state: AppState, focusAreas: ReportFocusArea[]): ReportAction[] {
  const primaryFocus = focusAreas[0];

  const actions: ReportAction[] = primaryFocus
    ? [
        {
          id: "primary",
          title: "优先动作",
          detail: primaryFocus.suggestion,
          href: primaryFocus.href,
          ctaLabel: primaryFocus.ctaLabel,
        },
      ]
    : [];

  actions.push(
    {
      id: "records",
      title: "回看学习轨迹",
      detail: "把关卡完成、考试结果和成长变化放在一条线上，再决定下一步节奏。",
      href: "/student/records",
      ctaLabel: "打开学习记录",
    },
    {
      id: "growth",
      title: "查看成长档案",
      detail: "看看这轮学习带来了哪些成长变化，以及下一阶段还差多少分。",
      href: "/student/growth",
      ctaLabel: "查看成长档案",
    },
  );

  return actions;
}

function buildMilestones(state: AppState): ReportMilestone[] {
  const growth = buildGrowthSnapshot(state);
  const completedLevels = state.progress.levels.filter(
    (level) => level.status === "completed",
  ).length;

  return [
    {
      id: "levels",
      label: "闯关完成",
      value: `${completedLevels} / 3`,
      note: completedLevels === 3 ? "三关都已经完成。" : "继续完成剩余关卡后会自动解锁更多反馈。",
    },
    {
      id: "exam",
      label: "考试状态",
      value:
        state.progress.exam.status === "completed"
          ? `${state.progress.exam.score ?? 0} 分`
          : state.progress.exam.status === "available"
            ? "已解锁"
            : "未解锁",
      note:
        state.progress.exam.status === "completed"
          ? `当前共有 ${state.progress.exam.wrongQuestionIds.length} 道题可继续回看。`
          : "主题考试会在三关完成后自动点亮。",
    },
    {
      id: "growth",
      label: "成长阶段",
      value: growth.currentTier.title,
      note: growth.nextTier
        ? `再获得 ${growth.pointsToNext} 分可进入 ${growth.nextTier.title}。`
        : "当前阶段内容已经全部点亮。",
    },
    {
      id: "badges",
      label: "徽章数量",
      value: `${state.progress.badges.length} 枚`,
      note: state.progress.badges.join(" / "),
    },
  ];
}

export function buildStudentAiReport(state: AppState): StudentAiReportSnapshot {
  const growth = buildGrowthSnapshot(state);
  const completedLevels = state.progress.levels.filter(
    (level) => level.status === "completed",
  ).length;
  const wrongQuestionCount = state.progress.exam.wrongQuestionIds.length;
  const focusAreas = buildFocusAreas(state);

  return {
    headline: buildHeadline(state, wrongQuestionCount, completedLevels),
    summary: `${state.studentProfile?.nickname ?? "你"} 当前处于 ${growth.currentTier.title}，累计积分 ${state.progress.points}，${growth.nextFocus}`,
    scoreLabel:
      state.progress.exam.status === "completed"
        ? `${state.progress.exam.score ?? 0} 分`
        : `${completedLevels} / 3 关`,
    scoreCaption:
      state.progress.exam.status === "completed"
        ? "主题考试结果"
        : "当前闯关进度",
    progressLabel: `累计星级 ${growth.totalStars} 星`,
    growthLabel: `${growth.currentTier.title} · ${growth.currentTier.ability}`,
    encouragement:
      wrongQuestionCount === 0 && state.progress.exam.status === "completed"
        ? "这轮道路安全学习已经很完整了，继续保持你的观察力和防护意识。"
        : wrongQuestionCount > 0
          ? "错题不是退步，而是下一轮更精准复习的入口。把对应关卡再练一遍，你会更稳。"
          : "继续沿着当前学习路线推进，完成考试后结果卡片会变得更完整。",
    strengths: buildStrengths(state),
    focusAreas,
    actions: buildActions(state, focusAreas),
    milestones: buildMilestones(state),
    badges: state.progress.badges,
  };
}
