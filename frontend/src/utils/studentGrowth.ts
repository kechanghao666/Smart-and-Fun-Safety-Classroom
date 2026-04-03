import type { AppState, LevelId } from "../types";

interface GrowthTierConfig {
  id: "seed" | "rising" | "guardian";
  title: string;
  description: string;
  minPoints: number;
  appearance: string;
  scene: string;
  ability: string;
}

export interface GrowthDimension {
  id: string;
  label: string;
  score: number;
  note: string;
}

export interface GrowthUnlock {
  label: string;
  value: string;
  note: string;
}

export interface GrowthJournalItem {
  id: string;
  title: string;
  detail: string;
  status: "done" | "current" | "pending";
  href: string;
  ctaLabel: string;
}

export interface GrowthSnapshot {
  points: number;
  completedLevels: number;
  totalStars: number;
  wrongQuestionCount: number;
  examScore: number | null;
  currentTier: GrowthTierConfig;
  nextTier: GrowthTierConfig | null;
  nextTierProgress: number;
  pointsToNext: number;
  dimensions: GrowthDimension[];
  unlocks: GrowthUnlock[];
  journal: GrowthJournalItem[];
  nextFocus: string;
}

export const growthTierDefinitions: GrowthTierConfig[] = [
  {
    id: "seed",
    title: "安全萌芽期",
    description: "先建立交通观察习惯，学会在路口停下来、看清楚、再行动。",
    minPoints: 0,
    appearance: "阳光守护徽章边框",
    scene: "校园出发行程卡",
    ability: "交通观察基础",
  },
  {
    id: "rising",
    title: "守护进阶期",
    description: "能够在路线选择和路口判断中保持更稳定的安全意识。",
    minPoints: 180,
    appearance: "守护披风外观",
    scene: "放学回家路线地图",
    ability: "路线判断进阶",
  },
  {
    id: "guardian",
    title: "安全守护期",
    description: "完成主题学习闭环，已经具备较完整的综合出行防护能力。",
    minPoints: 280,
    appearance: "星级守护勋章外观",
    scene: "城市安全出行场景",
    ability: "综合防护能力",
  },
];

const levelSequence: LevelId[] = ["level-1", "level-2", "level-3"];

function getLevelScore(state: AppState, levelId: LevelId) {
  const storedResult = state.progress.levelResults[levelId];

  if (storedResult) {
    return storedResult.score;
  }

  const level = state.progress.levels.find((item) => item.id === levelId);

  if (!level) {
    return 0;
  }

  if (level.status === "completed") {
    return 80;
  }

  if (level.status === "available") {
    return 28;
  }

  return 0;
}

function getCurrentTier(points: number) {
  return (
    [...growthTierDefinitions].reverse().find((tier) => points >= tier.minPoints) ??
    growthTierDefinitions[0]
  );
}

function getNextTier(points: number) {
  return growthTierDefinitions.find((tier) => points < tier.minPoints) ?? null;
}

export function buildGrowthSnapshot(state: AppState): GrowthSnapshot {
  const completedLevels = state.progress.levels.filter(
    (level) => level.status === "completed",
  ).length;
  const totalStars = levelSequence.reduce(
    (sum, levelId) => sum + (state.progress.levelResults[levelId]?.stars ?? 0),
    0,
  );
  const wrongQuestionCount = state.progress.exam.wrongQuestionIds.length;
  const currentTier = getCurrentTier(state.progress.points);
  const nextTier = getNextTier(state.progress.points);
  const previousTierMin = currentTier.minPoints;
  const nextTierMin = nextTier?.minPoints ?? state.progress.points;
  const nextTierProgress = nextTier
    ? Math.max(
        0,
        Math.min(
          100,
          Math.round(
            ((state.progress.points - previousTierMin) / (nextTierMin - previousTierMin)) * 100,
          ),
        ),
      )
    : 100;
  const examBonus =
    state.progress.exam.score === null ? 0 : Math.min(12, Math.round(state.progress.exam.score / 10));

  const dimensions: GrowthDimension[] = [
    {
      id: "observe",
      label: "观察力",
      score: Math.min(100, getLevelScore(state, "level-1") + Math.round(examBonus / 2)),
      note:
        state.progress.levelResults["level-1"]?.score !== undefined
          ? "已经完成路口观察训练，能更稳定识别斑马线、信号灯和危险行为。"
          : "先从第一关建立“停下来、看清楚、再行动”的观察节奏。",
    },
    {
      id: "judge",
      label: "判断力",
      score: Math.min(100, getLevelScore(state, "level-2") + examBonus),
      note:
        state.progress.levelResults["level-2"]?.score !== undefined
          ? "路线判断正在变稳，已经开始把规则应用到真实情境中。"
          : "完成第二关后，这项能力会明显提升。",
    },
    {
      id: "protect",
      label: "防护力",
      score: Math.min(
        100,
        getLevelScore(state, "level-3") +
          (state.progress.badges.includes("道路安全小卫士") ? 12 : 0),
      ),
      note:
        state.progress.levelResults["level-3"]?.score !== undefined
          ? "乘车安全、防护准备和盲区意识已经形成较完整的保护能力。"
          : "完成第三关与主题考试后，会解锁更完整的安全防护档案。",
    },
  ];

  const unlocks: GrowthUnlock[] = [
    {
      label: "当前外观",
      value: currentTier.appearance,
      note: "跟随成长阶段变化，展示不同守护形象。",
    },
    {
      label: "能力标签",
      value: currentTier.ability,
      note: `本轮最强维度：${[...dimensions].sort((left, right) => right.score - left.score)[0]?.label ?? "观察力"}`,
    },
    {
      label: "专属场景",
      value: currentTier.scene,
      note: nextTier ? `再积累 ${nextTier.minPoints - state.progress.points} 分可解锁下一阶段内容。` : "当前阶段内容已全部解锁。",
    },
  ];

  const currentLearningLevel = state.progress.levels.find(
    (level) => level.status === "available",
  );

  const journal: GrowthJournalItem[] = [];

  if (state.studentProfile) {
    journal.push({
      id: "profile-setup",
      title: "完成学生资料设置",
      detail: `${state.studentProfile.nickname} · ${state.studentProfile.stage}`,
      status: "done",
      href: "/student/profile-setup",
      ctaLabel: "查看资料",
    });
  }

  levelSequence.forEach((levelId) => {
    const level = state.progress.levels.find((item) => item.id === levelId);
    const result = state.progress.levelResults[levelId];

    if (!level) {
      return;
    }

    if (result) {
      journal.push({
        id: `${levelId}-done`,
        title: `完成${level.title}`,
        detail: `${result.score} 分 · ${result.stars} 星 · ${result.completedAt}`,
        status: "done",
        href: `/student/theme/road-safety/level/${levelId}/result`,
        ctaLabel: "查看结算",
      });
      return;
    }

    if (level.status === "available") {
      journal.push({
        id: `${levelId}-current`,
        title: `当前进行：${level.title}`,
        detail: "继续完成本关后，会同步更新成长值和成长档案。",
        status: "current",
        href: `/student/theme/road-safety/level/${levelId}`,
        ctaLabel: "继续学习",
      });
      return;
    }

    journal.push({
      id: `${levelId}-pending`,
      title: `${level.title} 待解锁`,
      detail: "完成前一关后，这里会自动点亮并加入成长轨迹。",
      status: "pending",
      href: "/student/theme/road-safety",
      ctaLabel: "查看主题",
    });
  });

  if (state.progress.exam.status === "completed") {
    journal.push({
      id: "exam-completed",
      title: "完成主题考试",
      detail: `${state.progress.exam.score ?? 0} 分 · ${wrongQuestionCount} 道错题待回看`,
      status: "done",
      href: "/student/ai-report",
      ctaLabel: "查看结果",
    });
  } else if (state.progress.exam.status === "available") {
    journal.push({
      id: "exam-available",
      title: "主题考试已解锁",
      detail: "进入考试页完成本轮知识检测，成长档案会同步更新。",
      status: "current",
      href: "/student/theme/road-safety/exam",
      ctaLabel: "进入考试",
    });
  } else {
    journal.push({
      id: "exam-pending",
      title: "主题考试待解锁",
      detail: "完成三关闯关学习后，考试入口会自动点亮。",
      status: "pending",
      href: "/student/theme/road-safety",
      ctaLabel: "查看主题",
    });
  }

  const nextFocus = state.progress.exam.status === "completed"
    ? wrongQuestionCount > 0
      ? "先回看错题对应关卡，再补齐本轮薄弱点。"
      : "继续保持当前节奏，已经可以把重心放到成长档案和连续学习上。"
    : state.progress.exam.status === "available"
      ? "主题考试已经解锁，完成它就能补齐本轮学习闭环。"
      : currentLearningLevel
        ? `继续完成 ${currentLearningLevel.title}，成长值会在通关后自动上涨。`
        : "先回到主题页，继续推进当前学习进度。";

  return {
    points: state.progress.points,
    completedLevels,
    totalStars,
    wrongQuestionCount,
    examScore: state.progress.exam.score,
    currentTier,
    nextTier,
    nextTierProgress,
    pointsToNext: nextTier ? Math.max(0, nextTier.minPoints - state.progress.points) : 0,
    dimensions,
    unlocks,
    journal,
    nextFocus,
  };
}
