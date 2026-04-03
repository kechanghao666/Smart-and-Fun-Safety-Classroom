import type { GrowthConfigItem } from "../types/contracts";

export const defaultGrowthConfig: GrowthConfigItem = {
  id: "default-growth",
  title: "虚拟人物成长规则",
  levelAwards: {
    "level-1": {
      appearancePoints: 8,
      safetyPoints: 16,
      scenePoints: 6,
    },
    "level-2": {
      appearancePoints: 6,
      safetyPoints: 14,
      scenePoints: 10,
    },
    "level-3": {
      appearancePoints: 10,
      safetyPoints: 12,
      scenePoints: 8,
    },
  },
  levelThreeStarBonusRate: 0.2,
  examBasePoints: 50,
  examBonus80: 15,
  examBonus90: 25,
  examAppearanceRatio: 0.2,
  examSafetyRatio: 0.46,
  wrongQuestionReviewAward: {
    appearancePoints: 2,
    safetyPoints: 7,
    scenePoints: 3,
  },
  streakAwards: {
    threeDay: {
      appearancePoints: 6,
      safetyPoints: 8,
      scenePoints: 4,
    },
    sevenDay: {
      appearancePoints: 10,
      safetyPoints: 12,
      scenePoints: 8,
    },
  },
  appearanceThresholds: [
    { threshold: 0, label: "基础形态" },
    { threshold: 80, label: "安全头盔" },
    { threshold: 180, label: "反光背心" },
    { threshold: 320, label: "守护披风" },
  ],
  safetyThresholds: [
    { threshold: 0, label: "基础观察" },
    { threshold: 80, label: "识别进阶" },
    { threshold: 180, label: "判断熟练" },
    { threshold: 320, label: "综合守护" },
  ],
  sceneThresholds: [
    { threshold: 0, label: "城市街道" },
    { threshold: 160, label: "校园周边" },
    { threshold: 320, label: "出行路上" },
  ],
  stageThresholds: [
    {
      threshold: 0,
      label: "安全萌芽期",
      summary: "正在建立基础安全习惯，继续完成关卡和复学任务会有明显成长。",
    },
    {
      threshold: 120,
      label: "守护进阶期",
      summary: "已经完成核心能力积累，适合通过考试和错题回看继续冲刺升级。",
    },
    {
      threshold: 260,
      label: "安全守护期",
      summary: "已经形成比较稳定的道路安全学习闭环，可持续强化迁移应用。",
    },
  ],
};
