import type { AppState, LevelId } from "../types";
import {
  getAvailableStreakRewardDays,
  getCurrentStreakDays,
  getNextStreakGoal,
  STREAK_REWARD_POINTS,
  WRONG_QUESTION_REVIEW_REWARD,
} from "./studentRewards";

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

export interface GrowthChoiceOption {
  id: string;
  label: string;
  detail: string;
  unlocked: boolean;
}

export interface GrowthSnapshot {
  points: number;
  completedLevels: number;
  totalStars: number;
  wrongQuestionCount: number;
  examScore: number | null;
  currentStreakDays: number;
  availableStreakRewards: number[];
  claimedStreakRewards: number[];
  reviewedWrongQuestionIds: string[];
  remainingWrongQuestionRewards: number;
  currentTier: GrowthTierConfig;
  nextTier: GrowthTierConfig | null;
  nextTierProgress: number;
  pointsToNext: number;
  dimensions: GrowthDimension[];
  unlocks: GrowthUnlock[];
  selectedAppearance: string;
  selectedScene: string;
  appearanceOptions: GrowthChoiceOption[];
  sceneOptions: GrowthChoiceOption[];
  journal: GrowthJournalItem[];
  nextFocus: string;
}

export const growthTierDefinitions: GrowthTierConfig[] = [
  {
    id: "seed",
    title: "安全萌芽期",
    description:
      "先建立基础交通观察习惯，学会在路口停下来、看清楚、再行动。",
    minPoints: 0,
    appearance: "阳光守护徽章边框",
    scene: "校园出发行程卡",
    ability: "交通观察基础",
  },
  {
    id: "rising",
    title: "守护进阶期",
    description:
      "能够在路线选择和路口判断中保持更稳定的安全意识，把规则用到真实情境里。",
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

export function getGrowthSceneVisualClass(sceneLabel: string) {
  if (sceneLabel.includes("校园")) {
    return "scene-visual--campus";
  }

  if (sceneLabel.includes("路线")) {
    return "scene-visual--route";
  }

  if (sceneLabel.includes("城市")) {
    return "scene-visual--city";
  }

  return "scene-visual--campus";
}

export function buildGrowthUpgradeEncouragement(snapshot: GrowthSnapshot) {
  if (snapshot.availableStreakRewards.length > 0) {
    return `AI 助手提示：你已经连续学习 ${snapshot.currentStreakDays} 天，记得领取成长礼包，把这次坚持转成新的成长值。`;
  }

  if (snapshot.remainingWrongQuestionRewards > 0) {
    return `AI 助手提示：你已经进入 ${snapshot.currentTier.title}，再完成 ${snapshot.remainingWrongQuestionRewards} 道错题重学，就能把这次升级学得更扎实。`;
  }

  return `AI 助手提示：新的成长阶段已经点亮，继续沿着“${snapshot.nextFocus}”往前走，外观、能力和场景都会继续升级。`;
}

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
  const currentStreakDays = getCurrentStreakDays(
    state.progress.rewardProgress.studyDates,
  );
  const availableStreakRewards = getAvailableStreakRewardDays(
    state.progress.rewardProgress,
  );
  const nextStreakGoal = getNextStreakGoal(state.progress.rewardProgress);
  const reviewedWrongQuestionIds =
    state.progress.rewardProgress.reviewedWrongQuestionIds;
  const remainingWrongQuestionRewards = state.progress.exam.wrongQuestionIds.filter(
    (questionId) => !reviewedWrongQuestionIds.includes(questionId),
  ).length;
  const currentTier = getCurrentTier(state.progress.points);
  const nextTier = getNextTier(state.progress.points);
  const unlockedTiers = growthTierDefinitions.filter(
    (tier) => state.progress.points >= tier.minPoints,
  );
  const previousTierMin = currentTier.minPoints;
  const nextTierMin = nextTier?.minPoints ?? state.progress.points;
  const nextTierProgress = nextTier
    ? Math.max(
        0,
        Math.min(
          100,
          Math.round(
            ((state.progress.points - previousTierMin) /
              (nextTierMin - previousTierMin)) *
              100,
          ),
        ),
      )
    : 100;
  const examBonus =
    state.progress.exam.score === null
      ? 0
      : Math.min(12, Math.round(state.progress.exam.score / 10));

  const preferredAppearance = state.growthPreferences.appearance;
  const preferredScene = state.growthPreferences.scene;
  const selectedAppearance =
    preferredAppearance &&
    unlockedTiers.some((tier) => tier.appearance === preferredAppearance)
      ? preferredAppearance
      : currentTier.appearance;
  const selectedScene =
    preferredScene && unlockedTiers.some((tier) => tier.scene === preferredScene)
      ? preferredScene
      : currentTier.scene;

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

  const strongestDimension =
    [...dimensions].sort((left, right) => right.score - left.score)[0]?.label ?? "观察力";

  const unlocks: GrowthUnlock[] = [
    {
      label: "当前外观",
      value: selectedAppearance,
      note: "已解锁的外观会长期保留，并可在成长档案中自由切换。",
    },
    {
      label: "能力标签",
      value: currentTier.ability,
      note: `本轮最强维度：${strongestDimension}`,
    },
    {
      label: "专属场景",
      value: selectedScene,
      note: nextTier
        ? `再积累 ${nextTier.minPoints - state.progress.points} 分可解锁下一阶段场景，已解锁场景可自由切换。`
        : "当前阶段内容已经全部点亮，可在成长档案中自由切换已解锁场景。",
    },
  ];

  const appearanceOptions: GrowthChoiceOption[] = growthTierDefinitions.map((tier) => ({
    id: `${tier.id}-appearance`,
    label: tier.appearance,
    detail: `${tier.title} · ${tier.ability}`,
    unlocked: state.progress.points >= tier.minPoints,
  }));

  const sceneOptions: GrowthChoiceOption[] = growthTierDefinitions.map((tier) => ({
    id: `${tier.id}-scene`,
    label: tier.scene,
    detail: `${tier.title} · ${tier.description}`,
    unlocked: state.progress.points >= tier.minPoints,
  }));

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

  if (availableStreakRewards.length > 0) {
    journal.push({
      id: "streak-reward",
      title: "连续学习礼包可领取",
      detail: `已达成 ${availableStreakRewards
        .map((day) => `${day} 天`)
        .join(" / ")} 连续学习目标，可领取成长值礼包。`,
      status: "current",
      href: "/student/growth",
      ctaLabel: "领取奖励",
    });
  }

  if (reviewedWrongQuestionIds.length > 0) {
    journal.push({
      id: "wrong-question-review",
      title: "完成错题重学",
      detail: `已完成 ${reviewedWrongQuestionIds.length} 道错题重学，每道已获得 ${WRONG_QUESTION_REVIEW_REWARD} 成长值。`,
      status: "done",
      href: "/student/theme/road-safety/wrong-questions",
      ctaLabel: "查看错题",
    });
  }

  const nextFocus =
    availableStreakRewards.length > 0
      ? `先领取 ${availableStreakRewards
          .map((day) => `${day} 天礼包（+${STREAK_REWARD_POINTS[day]}）`)
          .join(" 和 ")}，让连续学习直接转成成长值。`
      : state.progress.exam.status === "completed"
        ? remainingWrongQuestionRewards > 0
          ? `先完成 ${remainingWrongQuestionRewards} 道错题重学，每道可获得 ${WRONG_QUESTION_REVIEW_REWARD} 成长值。`
          : nextStreakGoal
            ? `继续保持连续学习，再学习 ${Math.max(
                0,
                nextStreakGoal - currentStreakDays,
              )} 天可领取 ${nextStreakGoal} 天成长礼包。`
            : "继续保持当前节奏，已经可以把重点放到成长档案和个性化展示上。"
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
    currentStreakDays,
    availableStreakRewards,
    claimedStreakRewards: state.progress.rewardProgress.claimedStreakDays,
    reviewedWrongQuestionIds,
    remainingWrongQuestionRewards,
    currentTier,
    nextTier,
    nextTierProgress,
    pointsToNext: nextTier ? Math.max(0, nextTier.minPoints - state.progress.points) : 0,
    dimensions,
    unlocks,
    selectedAppearance,
    selectedScene,
    appearanceOptions,
    sceneOptions,
    journal,
    nextFocus,
  };
}
