import type {
  AdminModuleCard,
  AiKnowledgeItem,
  AvatarOption,
  DemoAccount,
  ExamQuestion,
  GuardianTask,
  LevelBlueprint,
  RouteChallengeStep,
  StudentStage,
  TeacherStudentSummary,
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
  },
  {
    id: "q-2",
    prompt: "乘坐私家车时，出发前最重要的动作是什么？",
    options: ["打开窗户透气", "系好安全带", "把书包放在腿上"],
    correctIndex: 1,
    explanation: "系安全带是车内最基础、最关键的安全动作。",
  },
  {
    id: "q-3",
    prompt: "遇到公交车刚靠站时，正确做法是？",
    options: ["从车前快速穿过", "贴着车身绕过去", "避开盲区，确认安全后再通过"],
    correctIndex: 2,
    explanation: "大型车辆视线盲区大，必须避开车前和车身侧方危险区域。",
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

