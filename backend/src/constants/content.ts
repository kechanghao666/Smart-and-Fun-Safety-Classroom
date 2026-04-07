import type {
  AdminModuleCard,
  AdminStatMetric,
  AdminUserSummary,
  AiCopyTemplateItem,
  ExamQuestion,
  LevelBlueprint,
  LevelId,
  LevelManagementItem,
  LevelResult,
  QuestionBankManagementItem,
  TeacherClassSummary,
  TeacherStudentDetail,
  TeacherStudentSummary,
  ThemeManagementItem,
} from "../types/contracts";
import {
  levelOneManagementDefaults,
  levelOneObservationConfig,
} from "./levelOneObservation";
import { levelThreeGuardianConfig, levelThreeManagementDefaults } from "./levelThreeGuardian";
import { levelTwoManagementDefaults, levelTwoRouteConfig } from "./levelTwoRoute";

export const THEME_ID = "road-safety";
export const THEME_TITLE = "道路安全教育";
export const BASE_POINTS = 120;
export const BASE_BADGES = ["观察员新星"];
export const LEVEL_COMPLETION_POINTS = 40;
export const EXAM_COMPLETION_POINTS = 30;
export const EXAM_HIGH_SCORE_POINTS = 60;

export const levelBlueprints: LevelBlueprint[] = [
  {
    id: "level-1",
    title: "第一关 · 城市交通观察员",
    focus: "观察与识别",
    description: "在街道路口场景里找到安全通行位置、交通标志和危险行为。",
    duration: "约 15 分钟",
    gameplayMode: "observation",
    observationConfig: levelOneObservationConfig,
  },
  {
    id: "level-2",
    title: "第二关 · 放学回家路线挑战",
    focus: "路线判断",
    description: "沿着放学路线逐步前进，在关键节点做出安全选择。",
    duration: "约 15 分钟",
    gameplayMode: "route",
    routeChallengeConfig: levelTwoRouteConfig,
  },
  {
    id: "level-3",
    title: "第三关 · 安全出行守护任务",
    focus: "乘车防护",
    description: "在公交车、私家车和电动车场景中完成安全出行准备。",
    duration: "约 15 分钟",
    gameplayMode: "guardian",
    guardianChallengeConfig: levelThreeGuardianConfig,
  },
];

export const levelBadgeMap: Record<LevelId, string> = {
  "level-1": "交通观察员",
  "level-2": "路线小先锋",
  "level-3": "出行守护达人",
};

export const levelResultTemplates: Record<
  LevelId,
  Omit<LevelResult, "levelId" | "completedAt">
> = {
  "level-1": {
    score: 96,
    stars: 3,
    highlight: "你能主动寻找斑马线、信号灯和危险行为，基础观察力很稳定。",
    caution: "继续记住“先看灯、再看车、最后再行动”，不要只盯着一个信号。",
    aiSummary: "第一关顺利通关，你已经具备道路观察员的基本判断力了。",
    keySafetyPoints: ["先找斑马线", "再看信号灯和车辆", "主动识别危险行为"],
    cautionPoints: ["不要只盯着绿灯", "发现护栏和红灯抢跑要及时避开"],
    rewardIcon: "🧭",
    rewardLabel: "观察员徽章 + 40 积分",
  },
  "level-2": {
    score: 92,
    stars: 3,
    highlight: "你在路线节点里能逐步规避护栏近路、盲区和抢行风险。",
    caution: "下次遇到大型车辆或复杂路口时，先停一下确认周围环境更稳妥。",
    aiSummary: "第二关完成得不错，路线判断已经越来越像真正的安全小队员。",
    keySafetyPoints: ["每到节点先停一停", "绿灯也要继续看车", "主动绕开公交车盲区"],
    cautionPoints: ["不要从停放车辆缝隙钻出", "越接近终点越不能放松"],
    rewardIcon: "🗺️",
    rewardLabel: "路线先锋徽章 + 40 积分",
  },
  "level-3": {
    score: 98,
    stars: 3,
    highlight: "你已经掌握候车距离、安全带和头盔这些关键防护动作。",
    caution: "继续把“准备好再出发”记牢，别让着急出门打乱安全步骤。",
    aiSummary: "第三关也完成了，道路安全主题的三关闯关学习已经全部达成。",
    keySafetyPoints: ["候车站在安全线后", "上车先系安全带", "乘坐电动车先戴头盔"],
    cautionPoints: ["首次进入场景别急着点答案", "先准备好再出发才是安全习惯"],
    rewardIcon: "🛡️",
    rewardLabel: "守护达人徽章 + 40 积分",
  },
};

export const examQuestions: ExamQuestion[] = [
  {
    id: "q-1",
    prompt: "过马路时，下面哪种做法最安全？",
    options: ["看见没车就跑过去", "走斑马线并观察信号灯和车辆", "跟着别人横穿马路"],
    correctIndex: 1,
    explanation: "过马路要优先选择斑马线，并同时关注信号灯与车辆动态。",
    reviewLevelId: "level-1",
    reviewLabel: "第一关：城市交通观察员",
    reviewSuggestion: "回看斑马线、信号灯和危险行为识别，重新练习先观察再行动。",
  },
  {
    id: "q-2",
    prompt: "乘坐私家车时，出发前最重要的动作是什么？",
    options: ["打开窗户透气", "系好安全带", "把书包放在腿上"],
    correctIndex: 1,
    explanation: "系安全带是车内最基础、最关键的安全动作。",
    reviewLevelId: "level-3",
    reviewLabel: "第三关：安全出行守护任务",
    reviewSuggestion: "回看车内出行守护任务，重点强化安全带、头盔和候车距离。",
  },
  {
    id: "q-3",
    prompt: "遇到公交车刚靠站时，正确做法是？",
    options: ["从车前快速穿过", "贴着车身绕过去", "避开盲区，确认安全后再通过"],
    correctIndex: 2,
    explanation: "大型车辆视线盲区大，必须避开车前和车身侧方危险区域。",
    reviewLevelId: "level-2",
    reviewLabel: "第二关：放学回家路线挑战",
    reviewSuggestion: "回看路口和公交站节点，重点记住大型车辆盲区和停车后再通行。",
  },
];

export const levelManagementItems: LevelManagementItem[] = [
  {
    id: "level-1",
    title: "第一关：城市交通观察员",
    focus: "观察与识别",
    duration: "约 15 分钟",
    gameplayMode: "observation",
    rewardLabel: "观察员徽章 + 40 积分",
    feedbackStyle: "强调先观察再行动",
    ...levelOneManagementDefaults,
  },
  {
    id: "level-2",
    title: "第二关：放学回家路线挑战",
    focus: "路线判断",
    duration: "约 15 分钟",
    gameplayMode: "route",
    rewardLabel: "路线先锋徽章 + 40 积分",
    feedbackStyle: "强调关键节点风险判断",
    ...levelTwoManagementDefaults,
  },
  {
    id: "level-3",
    title: "第三关：安全出行守护任务",
    focus: "乘车防护",
    duration: "约 15 分钟",
    gameplayMode: "guardian",
    rewardLabel: "守护达人徽章 + 40 积分",
    feedbackStyle: "强调头盔、安全带和候车距离",
    ...levelThreeManagementDefaults,
  },
];

export const questionBankManagementItems: QuestionBankManagementItem[] =
  examQuestions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    correctLabel: question.options[question.correctIndex] ?? "",
    explanation: question.explanation,
    reviewLevelId: question.reviewLevelId,
    status: "enabled",
  }));

export const teacherClassSummaries: TeacherClassSummary[] = [
  {
    id: "class-3-2",
    name: "三年级（2）班",
    studentCount: 32,
    completedRate: 78,
    examCompletionRate: 52,
    focusLabel: "放学路线判断仍需强化",
  },
  {
    id: "class-3-3",
    name: "三年级（3）班",
    studentCount: 31,
    completedRate: 65,
    examCompletionRate: 48,
    focusLabel: "公交车盲区理解偏弱",
  },
];

export const teacherStaticStudents: TeacherStudentSummary[] = [
  {
    id: "stu-2",
    name: "周乐乐",
    studentNo: "S00000002",
    className: "三年级（2）班",
    completedLevels: 2,
    examStatus: "已解锁未考试",
    score: null,
    lastActiveAt: "今天 10:05",
    weakSpot: "路线判断易受同伴影响，需要加强独立安全选择。",
  },
  {
    id: "stu-3",
    name: "陈晓雨",
    studentNo: "S00000003",
    className: "三年级（2）班",
    completedLevels: 1,
    examStatus: "未解锁考试",
    score: null,
    lastActiveAt: "昨天 16:40",
    weakSpot: "对公交车盲区理解还不稳定。",
  },
];

export const teacherStaticDetails: TeacherStudentDetail[] = [
  {
    id: "stu-2",
    name: "周乐乐",
    studentNo: "S00000002",
    className: "三年级（2）班",
    completedLevels: 2,
    examStatus: "已解锁未考试",
    score: null,
    lastActiveAt: "今天 10:05",
    weakSpot: "路线判断易受同伴影响，需要加强独立安全选择。",
    growthStage: "守护进阶期",
    growthSummary: "前两关推进较快，但还缺最后一关和考试收口。",
    motivationLabel: "需要鼓励完成完整闭环",
    levelStatuses: [
      {
        levelId: "level-1",
        title: "第一关：城市交通观察员",
        status: "completed",
        score: 96,
        note: "基础观察已经建立。",
      },
      {
        levelId: "level-2",
        title: "第二关：放学回家路线挑战",
        status: "completed",
        score: 82,
        note: "路线判断有时会受外界干扰。",
      },
      {
        levelId: "level-3",
        title: "第三关：安全出行守护任务",
        status: "available",
        score: null,
        note: "进入后可继续完成本轮学习闭环。",
      },
    ],
    wrongTopics: ["尚未进入主题考试"],
    recommendations: ["提醒优先完成第三关", "教师课后追问大型车辆盲区判断逻辑"],
  },
  {
    id: "stu-3",
    name: "陈晓雨",
    studentNo: "S00000003",
    className: "三年级（2）班",
    completedLevels: 1,
    examStatus: "未解锁考试",
    score: null,
    lastActiveAt: "昨天 16:40",
    weakSpot: "对公交车盲区理解还不稳定。",
    growthStage: "安全萌芽期",
    growthSummary: "仍在建立基础观察习惯，需要从关卡复习里持续巩固。",
    motivationLabel: "需要分段鼓励和即时反馈",
    levelStatuses: [
      {
        levelId: "level-1",
        title: "第一关：城市交通观察员",
        status: "completed",
        score: 88,
        note: "已经通过基础识别训练。",
      },
      {
        levelId: "level-2",
        title: "第二关：放学回家路线挑战",
        status: "available",
        score: null,
        note: "建议继续完成路线判断训练。",
      },
      {
        levelId: "level-3",
        title: "第三关：安全出行守护任务",
        status: "locked",
        score: null,
        note: "完成第二关后自动解锁。",
      },
    ],
    wrongTopics: ["考试尚未解锁"],
    recommendations: ["先回到第二关继续学习", "加强公交车停靠与盲区场景口头问答"],
  },
];

export const adminModules: AdminModuleCard[] = [
  {
    id: "theme",
    title: "主题管理",
    description: "维护主题名称、封面、简介、开放状态与排序。",
    ownerSuggestion: "内容策划 / 运营",
    status: "可开始",
  },
  {
    id: "levels",
    title: "关卡内容管理",
    description: "维护场景任务、热点配置、反馈文案和奖励规则。",
    ownerSuggestion: "教学设计 / 前端联调",
    status: "优先搭建",
  },
  {
    id: "question-bank",
    title: "题库管理",
    description: "维护道路安全客观题、答案、解析和启用状态。",
    ownerSuggestion: "教研 / 管理后台",
    status: "可开始",
  },
  {
    id: "ai-copy",
    title: "AI 文案管理",
    description: "维护欢迎语、提示语、鼓励语和结果卡片模板。",
    ownerSuggestion: "教研 / 产品",
    status: "建议尽早锁定",
  },
  {
    id: "users",
    title: "用户管理",
    description: "查看用户角色、状态和账号启停信息。",
    ownerSuggestion: "后台 / 平台管理",
    status: "待后端接入",
  },
  {
    id: "stats",
    title: "数据统计",
    description: "查看主题访问量、完成率、考试成绩和异常提醒。",
    ownerSuggestion: "后台 / 数据分析",
    status: "待接口",
  },
];

export const themeManagementItems: ThemeManagementItem[] = [
  {
    id: "road-safety",
    title: "道路安全教育",
    description: "当前首发主题，包含三关闯关学习与主题考试。",
    coverLabel: "蓝天斑马线封面",
    isOpen: true,
    sortOrder: 1,
  },
  {
    id: "campus-safety",
    title: "校园安全教育",
    description: "覆盖课间活动、紧急集合和校园设施安全。",
    coverLabel: "校园操场封面",
    isOpen: false,
    sortOrder: 2,
  },
];

export const aiCopyTemplateItems: AiCopyTemplateItem[] = [
  {
    id: "copy-welcome",
    category: "欢迎语",
    title: "学生首页欢迎",
    scene: "welcome",
    promptText: "欢迎回来，今天继续和我一起完成道路安全学习吧。",
  },
  {
    id: "copy-hint",
    category: "关卡提示",
    title: "第二关卡提示",
    scene: "hint",
    promptText: "先看清楚路口和车辆，再做路线选择，不要被捷径带偏。",
  },
  {
    id: "copy-report",
    category: "结果卡片",
    title: "考试完成总结",
    scene: "report",
    promptText: "根据关卡完成情况、错题与积分变化，生成简短总结与下一步建议。",
  },
];

export const adminUserSeedSummaries: AdminUserSummary[] = [
  {
    id: "user-student-001",
    name: "student001",
    role: "student",
    status: "active",
    lastActiveAt: "今天 10:05",
    note: "学生演示账号",
  },
  {
    id: "user-teacher-001",
    name: "teacher001",
    role: "teacher",
    status: "active",
    lastActiveAt: "今天 09:10",
    note: "教师演示账号",
  },
  {
    id: "user-admin-001",
    name: "admin001",
    role: "admin",
    status: "active",
    lastActiveAt: "今天 08:58",
    note: "管理员演示账号",
  },
];

export const adminStatMetrics: AdminStatMetric[] = [
  {
    id: "visits",
    label: "主题访问量",
    value: "1,248",
    trend: "较上周 +12%",
    accent: "sky",
  },
  {
    id: "completion",
    label: "三关完成率",
    value: "78%",
    trend: "较上周 +8%",
    accent: "mint",
  },
  {
    id: "exam",
    label: "考试平均分",
    value: "86",
    trend: "较上周 +4 分",
    accent: "orange",
  },
];

export const welcomeSuggestions = ["进入道路安全主题", "查看当前学习进度", "继续上次未完成的位置"];

export const hintSuggestionMap: Record<LevelId, string[]> = {
  "level-1": ["先找斑马线", "先看信号灯状态", "注意翻护栏等危险行为"],
  "level-2": ["先判断关键节点风险", "避开大型车辆盲区", "不要为了抄近路忽略规则"],
  "level-3": ["先准备安全装备", "先确认候车和上车位置", "先检查安全带和头盔"],
};

export const themeKeywords = [
  "道路安全",
  "交通",
  "斑马线",
  "红绿灯",
  "信号灯",
  "护栏",
  "盲区",
  "公交车",
  "私家车",
  "电动车",
  "头盔",
  "安全带",
  "过马路",
  "候车",
  "放学",
  "路线",
];
