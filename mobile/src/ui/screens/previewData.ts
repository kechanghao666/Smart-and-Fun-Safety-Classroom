import type { StudentProgress } from "@/types/contracts";

export const previewStudentProgress: StudentProgress = {
  themeId: "road-safety",
  themeTitle: "道路安全教育",
  lastVisitedRoute: "/student/subject-detail",
  points: 120,
  badges: ["观察员新星"],
  levels: [
    {
      id: "level-1",
      title: "第一关：城市交通观察员",
      focus: "观察识别",
      description: "在街道路口找到安全通行位置、交通标志和危险行为。",
      duration: "约 15 分钟",
      gameplayMode: "observation",
      status: "completed",
    },
    {
      id: "level-2",
      title: "第二关：放学回家路线挑战",
      focus: "路线判断",
      description: "沿着放学路线逐步前进，在关键节点做出安全选择。",
      duration: "约 15 分钟",
      gameplayMode: "route",
      status: "available",
    },
    {
      id: "level-3",
      title: "第三关：安全出行守护任务",
      focus: "乘车防护",
      description: "在公交车、私家车和电动车场景中完成安全出行准备。",
      duration: "约 15 分钟",
      gameplayMode: "guardian",
      status: "locked",
      guardianChallengeConfig: {
        completionCopy: "完成安全出行守护任务。",
        stages: [
          {
            id: "bus-line",
            title: "公交车候车区",
            detail: "把候车的同学安排到安全候车线后方。",
            toolLabel: "候车站位卡",
            toolHint: "候车时要离车门和道路边缘远一点。",
            stageLabel: "公交车",
            successText: "站位放对了。",
            taskType: "drag",
            sceneCaption: "公交车进站前，要站在安全线后面等车。",
            sceneImageUrl:
              "https://commons.wikimedia.org/wiki/Special:FilePath/People_waiting_at_bus_stop.jpg",
            actionHint: "先看清安全线的位置。",
          },
        ],
      },
    },
  ],
  levelResults: {
    "level-1": {
      levelId: "level-1",
      score: 92,
      stars: 3,
      completedAt: "2026-05-06T08:00:00.000Z",
      highlight: "能识别斑马线和红绿灯。",
      caution: "继续留意转弯车辆。",
      aiSummary: "观察很细致，继续保持。",
    },
  },
  exam: {
    status: "locked",
    totalQuestions: 3,
    score: null,
    wrongQuestionIds: [],
  },
};
