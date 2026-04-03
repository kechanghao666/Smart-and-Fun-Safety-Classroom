import type {
  AdminModuleCard,
  AdminStatMetric,
  AdminUserSummary,
  AiKnowledgeItem,
  AiCopyTemplateItem,
  AvatarOption,
  DemoAccount,
  ExamQuestion,
  GuardianTask,
  LevelBlueprint,
  LevelManagementItem,
  QuestionBankManagementItem,
  RouteChallengeStep,
  StudentStage,
  TeacherClassSummary,
  TeacherStudentDetail,
  TeacherStudentSummary,
  ThemeManagementItem,
  ThemeCard,
} from "../types";

export const demoAccounts: DemoAccount[] = [
  {
    account: "student001",
    password: "123456",
    role: "student",
    roleLabel: "学生端",
    displayName: "学生示例账号",
  },
  {
    account: "teacher001",
    password: "123456",
    role: "teacher",
    roleLabel: "教师端",
    displayName: "教师示例账号",
  },
  {
    account: "admin001",
    password: "123456",
    role: "admin",
    roleLabel: "管理员端",
    displayName: "管理员示例账号",
  },
];

export const studentAvatarOptions: AvatarOption[] = [
  {
    id: "sunny-guard",
    label: "阳光小卫士",
    shortLabel: "阳",
    accent: "sky",
  },
  {
    id: "smart-scout",
    label: "机智观察员",
    shortLabel: "智",
    accent: "mint",
  },
  {
    id: "brave-captain",
    label: "勇敢守护队长",
    shortLabel: "勇",
    accent: "orange",
  },
];

export const studentStageOptions: StudentStage[] = [
  "小学低段",
  "小学中段",
  "小学高段",
];

export const themeCards: ThemeCard[] = [
  {
    id: "road-safety",
    title: "道路安全教育",
    description: "通过三关闯关学习和主题考试，完成一节课的道路安全训练。",
    isOpen: true,
    progressLabel: "当前开放主题",
    cta: "进入主题",
    accent: "sky",
  },
  {
    id: "campus-safety",
    title: "校园安全教育",
    description: "覆盖课间活动、紧急集合和校园设施安全。",
    isOpen: false,
    progressLabel: "正在开发",
    cta: "敬请期待",
    accent: "mint",
  },
  {
    id: "home-safety",
    title: "家庭安全教育",
    description: "聚焦居家用电、厨房防护和应急处理。",
    isOpen: false,
    progressLabel: "正在开发",
    cta: "敬请期待",
    accent: "orange",
  },
];

export const levelBlueprints: LevelBlueprint[] = [
  {
    id: "level-1",
    title: "第一关 · 城市交通观察员",
    focus: "观察与识别",
    description: "在街道路口场景里找到安全通行位置、交通标志和危险行为。",
    duration: "约 15 分钟",
  },
  {
    id: "level-2",
    title: "第二关 · 放学回家路线挑战",
    focus: "路线判断",
    description: "沿着放学路线逐步前进，在关键节点做出安全选择。",
    duration: "约 15 分钟",
  },
  {
    id: "level-3",
    title: "第三关 · 安全出行守护任务",
    focus: "乘车防护",
    description: "在公交车、私家车和电动车场景中完成安全出行准备。",
    duration: "约 15 分钟",
  },
];

export const levelOneTasks = [
  "找到可以安全通行的斑马线位置",
  "识别当前适合通行的信号灯状态",
  "指出翻越护栏的危险行为",
  "找到“人行横道”交通标志",
];

export const routeChallengeSteps: RouteChallengeStep[] = [
  {
    id: "school-gate",
    scenario: "校门口同学邀请你从护栏旁边抄近路，你要怎么做？",
    options: [
      {
        label: "和同学一起从护栏旁穿过去",
        safe: false,
        feedback: "护栏附近视线盲区多，容易被转弯车辆忽视。",
      },
      {
        label: "坚持走斑马线，等信号灯和车辆状态安全后再通过",
        safe: true,
        feedback: "正确，先选安全路线，再判断车辆状态。",
      },
    ],
  },
  {
    id: "cross-road",
    scenario: "绿灯亮了，但右转车辆还在持续经过，你的下一步是什么？",
    options: [
      {
        label: "立刻冲过去，绿灯说明一定安全",
        safe: false,
        feedback: "绿灯不是唯一条件，还要确认车辆礼让和视线安全。",
      },
      {
        label: "先观察车辆是否停稳，再快速通过斑马线",
        safe: true,
        feedback: "正确，过马路时要同时看灯、看车、看路。",
      },
    ],
  },
  {
    id: "bus-stop",
    scenario: "公交车刚靠站，车前方有视线盲区，应该怎么做？",
    options: [
      {
        label: "马上从车前穿过去，省时间",
        safe: false,
        feedback: "车前盲区最危险，驾驶员可能完全看不到你。",
      },
      {
        label: "停下观察，绕到安全区域后再继续前进",
        safe: true,
        feedback: "正确，遇到公交车或大型车辆要避开盲区。",
      },
    ],
  },
];

export const guardianTasks: GuardianTask[] = [
  {
    id: "bus-line",
    label: "让候车学生站在安全候车区",
    hint: "候车时与车门和道路边缘保持安全距离。",
  },
  {
    id: "seatbelt",
    label: "给私家车乘客系好安全带",
    hint: "车内出行必须先系安全带，再准备出发。",
  },
  {
    id: "helmet",
    label: "给电动车乘坐者戴好头盔",
    hint: "头盔是电动车出行最重要的安全装备之一。",
  },
];

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

export const aiKnowledgeBase: AiKnowledgeItem[] = [
  {
    id: "ai-1",
    label: "为什么要走斑马线？",
    question: "为什么要走斑马线？",
    keywords: ["斑马线", "过马路", "走哪里"],
    answer: "斑马线是专门为行人设置的安全通行区域，司机更容易在这里注意到你，也更方便按规则礼让。",
  },
  {
    id: "ai-2",
    label: "电动车为什么要戴头盔？",
    question: "电动车为什么要戴头盔？",
    keywords: ["头盔", "电动车", "骑车"],
    answer: "头盔可以在发生碰撞或摔倒时保护头部，是电动车出行最重要的安全装备之一。",
  },
  {
    id: "ai-3",
    label: "这一关卡住了怎么办？",
    question: "这一关卡住了怎么办？",
    keywords: ["卡住", "不会", "提示", "这一关"],
    answer: "先回到任务说明，找出本关最重要的安全原则，再按“观察环境、判断风险、做出安全选择”的顺序试一次。",
  },
  {
    id: "ai-4",
    label: "公交车盲区是什么？",
    question: "公交车盲区是什么？",
    keywords: ["公交车", "盲区", "大车"],
    answer: "盲区是驾驶员不容易看到的区域，公交车前方、侧方和车尾附近都可能形成危险盲区，要主动避开。",
  },
];

export const teacherStudents: TeacherStudentSummary[] = [
  {
    id: "stu-1",
    name: "李小安",
    className: "三年级（2）班",
    completedLevels: 3,
    examStatus: "已完成考试",
    score: 100,
    lastActiveAt: "今天 09:32",
    weakSpot: "整体表现稳定，可继续强化乘车礼仪。",
  },
  {
    id: "stu-2",
    name: "周乐乐",
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
    className: "三年级（2）班",
    completedLevels: 1,
    examStatus: "未解锁考试",
    score: null,
    lastActiveAt: "昨天 16:40",
    weakSpot: "对公交车盲区理解还不稳定。",
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

export const teacherStudentDetails: TeacherStudentDetail[] = [
  {
    id: "stu-1",
    name: "李小安",
    className: "三年级（2）班",
    completedLevels: 3,
    examStatus: "已完成考试",
    score: 100,
    lastActiveAt: "今天 09:32",
    weakSpot: "整体表现稳定，可继续强化乘车礼仪。",
    growthStage: "安全守护期",
    growthLevelLabel: "Lv.3",
    growthSummary: "已经完成三关与考试，成长阶段和学习节奏都比较稳定。",
    motivationLabel: "适合承担课堂示范任务",
    currentAppearance: "星级守护勋章外观",
    currentAbility: "综合防护能力",
    currentScene: "城市安全出行场景",
    levelStatuses: [
      {
        levelId: "level-1",
        title: "第一关：城市交通观察员",
        status: "completed",
        score: 100,
        note: "观察力稳定，热点识别准确。",
      },
      {
        levelId: "level-2",
        title: "第二关：放学回家路线挑战",
        status: "completed",
        score: 100,
        note: "路线选择稳健，能主动规避风险。",
      },
      {
        levelId: "level-3",
        title: "第三关：安全出行守护任务",
        status: "completed",
        score: 100,
        note: "乘车防护意识完整。",
      },
    ],
    wrongTopics: [],
    recommendations: ["继续维持稳定节奏", "可作为课堂示范学生分享安全观察方法"],
  },
  {
    id: "stu-2",
    name: "周乐乐",
    className: "三年级（2）班",
    completedLevels: 2,
    examStatus: "已解锁未考试",
    score: null,
    lastActiveAt: "今天 10:05",
    weakSpot: "路线判断易受同伴影响，需要加强独立安全选择。",
    growthStage: "守护进阶期",
    growthLevelLabel: "Lv.2",
    growthSummary: "前两关推进较快，但还缺最后一关和考试收口。",
    motivationLabel: "需要鼓励完成完整闭环",
    currentAppearance: "守护披风外观",
    currentAbility: "路线判断进阶",
    currentScene: "放学回家路线地图",
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
    className: "三年级（2）班",
    completedLevels: 1,
    examStatus: "未解锁考试",
    score: null,
    lastActiveAt: "昨天 16:40",
    weakSpot: "对公交车盲区理解还不稳定。",
    growthStage: "安全萌芽期",
    growthLevelLabel: "Lv.1",
    growthSummary: "仍在建立基础观察习惯，需要从关卡复习里持续巩固。",
    motivationLabel: "需要分段鼓励和即时反馈",
    currentAppearance: "阳光守护徽章边框",
    currentAbility: "交通观察基础",
    currentScene: "校园出发行程卡",
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

export const themeManagementItems: ThemeManagementItem[] = [
  {
    id: "road-safety",
    title: "道路安全教育",
    description: "当前首发主题，包含三关闯关学习与主题考试。",
    coverLabel: "蓝天斑马线封面",
    coverAccent: "sky",
    coverIllustration: "斑马线与信号灯主题插画",
    isOpen: true,
    sortOrder: 1,
  },
  {
    id: "campus-safety",
    title: "校园安全教育",
    description: "覆盖课间活动、紧急集合和校园设施安全。",
    coverLabel: "校园操场封面",
    coverAccent: "mint",
    coverIllustration: "校园操场与教学楼插画",
    isOpen: false,
    sortOrder: 2,
  },
];

export const levelManagementItems: LevelManagementItem[] = [
  {
    id: "level-1",
    title: "第一关：城市交通观察员",
    focus: "观察与识别",
    duration: "约 15 分钟",
    displayOrder: 1,
    sceneAssetLabel: "城市路口主场景插画 A",
    taskOutline: [
      "找出安全通行位置",
      "识别当前信号灯状态",
      "圈出错误过马路行为",
      "找到人行横道交通标志",
    ],
    rewardLabel: "观察员徽章 + 40 积分",
    feedbackStyle: "强调先观察再行动",
    feedbackCopy: "完成观察任务后，高亮正确热点并提醒先看灯、再看车、最后行动。",
    hotspotItems: [
      "斑马线热点",
      "信号灯热点",
      "翻越护栏危险行为标点",
      "人行横道标志标点",
    ],
    propItems: [],
    targetAreaNotes: ["场景中错误点击只出现轻提示气泡，不中断当前任务。"],
  },
  {
    id: "level-2",
    title: "第二关：放学回家路线挑战",
    focus: "路线判断",
    duration: "约 15 分钟",
    displayOrder: 2,
    sceneAssetLabel: "放学路线地图插画 B",
    taskOutline: [
      "校门口是否抄近路",
      "十字路口是否立即通过",
      "公交站是否避开盲区",
    ],
    rewardLabel: "路线先锋徽章 + 40 积分",
    feedbackStyle: "强调关键节点风险判断",
    feedbackCopy: "节点选择后展示事件卡结果，错误选择仅扣减安全值并说明风险后果。",
    hotspotItems: ["学校节点", "十字路口节点", "公交站节点", "终点到家节点"],
    propItems: [],
    targetAreaNotes: ["底部事件卡固定展示场景描述、行动方案和结果反馈。"],
  },
  {
    id: "level-3",
    title: "第三关：安全出行守护任务",
    focus: "乘车防护",
    duration: "约 15 分钟",
    displayOrder: 3,
    sceneAssetLabel: "公交 / 私家车 / 电动车三连场景插画",
    taskOutline: [
      "公交场景：站到安全候车位置",
      "私家车场景：系好安全带并整理下车动作",
      "电动车场景：补齐头盔并识别超员风险",
    ],
    rewardLabel: "守护达人徽章 + 40 积分",
    feedbackStyle: "强调头盔、安全带和候车距离",
    feedbackCopy: "每完成一个守护步骤都给出轻提示，三项都完成后再进入主题考试解锁阶段。",
    hotspotItems: ["公交站危险站位", "私家车伸手窗外行为", "电动车超员提示"],
    propItems: ["头盔", "安全带标识", "候车安全区站位贴纸"],
    targetAreaNotes: [
      "公交场景目标区：候车安全区",
      "私家车场景目标区：乘客座位与安全带区域",
      "电动车场景目标区：乘坐者头部防护区域",
    ],
  },
];

export const questionBankManagementItems: QuestionBankManagementItem[] = [
  {
    id: "q-1",
    themeId: "road-safety",
    themeTitle: "道路安全教育",
    prompt: "过马路时，下面哪种做法最安全？",
    options: ["看见没车就跑过去", "走斑马线并观察信号灯和车辆", "跟着别人横穿马路"],
    correctOptionIndex: 1,
    correctLabel: "走斑马线并观察信号灯和车辆",
    explanation: "需要同时看灯、看车、看路。",
    reviewLevelId: "level-1",
    status: "enabled",
  },
  {
    id: "q-2",
    themeId: "road-safety",
    themeTitle: "道路安全教育",
    prompt: "乘坐私家车时，出发前最重要的动作是什么？",
    options: ["打开窗户透气", "系好安全带", "把书包抱在腿上"],
    correctOptionIndex: 1,
    correctLabel: "系好安全带",
    explanation: "系安全带是车内最基础的安全动作。",
    reviewLevelId: "level-3",
    status: "enabled",
  },
  {
    id: "q-3",
    themeId: "road-safety",
    themeTitle: "道路安全教育",
    prompt: "遇到公交车刚靠站时，正确做法是？",
    options: ["从车前快速穿过", "贴着车身绕过去", "避开盲区，确认安全后再通过"],
    correctOptionIndex: 2,
    correctLabel: "避开盲区，确认安全后再通过",
    explanation: "需要避开大型车辆前方和侧方盲区。",
    reviewLevelId: "level-2",
    status: "enabled",
  },
  {
    id: "q-4",
    themeId: "campus-safety",
    themeTitle: "校园安全教育",
    prompt: "课间上下楼梯时，哪种做法更安全？",
    options: ["并排行走推挤同学", "靠右慢行，不在楼梯奔跑", "边走边低头看电子设备"],
    correctOptionIndex: 1,
    correctLabel: "靠右慢行，不在楼梯奔跑",
    explanation: "楼梯属于高风险区域，需要靠右有序通行。",
    reviewLevelId: "level-1",
    status: "draft",
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

export const adminUserSummaries: AdminUserSummary[] = [
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

