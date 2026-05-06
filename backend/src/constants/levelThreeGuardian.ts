import type { GuardianChallengeConfig, LevelManagementItem } from "../types/contracts";

export const levelThreeGuardianConfig: GuardianChallengeConfig = {
  stages: [
    {
      id: "bus-line",
      title: "公交车候车区",
      detail: "把候车的同学安排到安全候车线后方。",
      toolLabel: "候车站位卡",
      toolHint: "候车时要离车门和道路边缘远一点。",
      stageLabel: "公交车",
      successText: "站位放对了，候车时就不会离车门太近。",
      taskType: "drag",
      sceneImageUrl: "/learning-images/level3-bus-line.jpg",
      sceneSourcePageUrl:
        "https://commons.wikimedia.org/wiki/File:People_waiting_at_bus_stop.jpg",
      sceneCaption: "公交车进站前，要站在安全线后面等车，不贴着车门和道路边缘。",
      toolImageUrl: "/learning-images/level3-bus-marking.jpg",
      toolSourcePageUrl:
        "https://commons.wikimedia.org/wiki/File:Sidewalk_and_bus_stop_pavement_marking_(43966547644).jpg",
      toolCaption: "把候车站位卡拖到安全候车区，提醒自己先站稳再等车。",
      actionHint: "先看清安全线的位置，再把候车站位卡拖过去。",
      targetZone: { top: 62, left: 22, width: 24, height: 18, label: "安全候车区" },
    },
    {
      id: "seatbelt",
      title: "私家车出发前",
      detail: "找出最先需要纠正的危险行为。",
      toolLabel: "点击纠错",
      toolHint: "上车后第一件事应该是系好安全带。",
      stageLabel: "私家车",
      successText: "纠正成功，出发前先系安全带才是最稳妥的。",
      taskType: "tap",
      sceneImageUrl: "/learning-images/level3-seatbelt-scene.jpg",
      sceneSourcePageUrl:
        "https://commons.wikimedia.org/wiki/File:Fastening_belt.jpg",
      sceneCaption: "乘坐私家车时，坐稳后要先系好安全带，不把手伸出窗外。",
      actionHint: "点击最需要先纠正的危险行为。",
      tapTargets: [
        {
          id: "seatbelt-correct",
          label: "未系安全带",
          hint: "这是出发前最先要处理的危险点。",
          top: 34,
          left: 42,
          width: 24,
          height: 22,
          correct: true,
          feedback: "答对了，系好安全带是出发前最重要的保护动作。",
        },
        {
          id: "seatbelt-window",
          label: "手臂伸出窗外",
          hint: "这也危险，但不是当前第一步要先处理的动作。",
          top: 22,
          left: 68,
          width: 18,
          height: 18,
          correct: false,
          feedback: "还差一点，乘车时第一步应该先完成基础保护动作。",
        },
      ],
    },
    {
      id: "helmet",
      title: "电动车乘坐区",
      detail: "把安全出发步骤按正确顺序排好。",
      toolLabel: "出发步骤卡",
      toolHint: "先戴头盔，再坐稳扶好，最后再提醒不超员。",
      stageLabel: "电动车",
      successText: "顺序排对了，出发前的保护动作都准备好了。",
      taskType: "sequence",
      sceneImageUrl: "/learning-images/level3-helmet-scene.jpg",
      sceneSourcePageUrl:
        "https://commons.wikimedia.org/wiki/File:Helmet_bike.jpg",
      sceneCaption: "乘坐电动车前，要先戴好头盔、坐稳扶好，再确认没有超员。",
      actionHint: "把三张步骤卡按正确顺序排列。",
      sequenceItems: [
        { id: "helmet-first", label: "戴好头盔", expectedOrder: 1 },
        { id: "helmet-second", label: "坐稳扶好", expectedOrder: 2 },
        { id: "helmet-third", label: "确认不超员", expectedOrder: 3 },
      ],
    },
  ],
  completionCopy: "你已经完成安全出行守护任务，知道在不同乘车场景里先准备好，再出发。",
};

export const levelThreeManagementDefaults: Pick<
  LevelManagementItem,
  | "displayOrder"
  | "sceneAssetLabel"
  | "taskOutline"
  | "feedbackCopy"
  | "hotspotItems"
  | "propItems"
  | "targetAreaNotes"
  | "guardianChallengeConfig"
> = {
  displayOrder: 3,
  sceneAssetLabel: "safety-guardian-scenes",
  taskOutline: levelThreeGuardianConfig.stages.map((item) => item.title),
  feedbackCopy: "三段守护任务分别覆盖拖拽、点击纠错和步骤排序，完成一段就给出轻提示后再进入下一段。",
  hotspotItems: ["公交车候车区", "私家车安全带位", "电动车乘坐步骤"],
  propItems: ["候车站位卡", "点击纠错", "出发步骤卡"],
  targetAreaNotes: ["首次进入只提示方向，不直接把答案高亮出来。"],
  guardianChallengeConfig: levelThreeGuardianConfig,
};
