import type { LevelManagementItem, RouteChallengeConfig } from "../types/contracts";

export const levelTwoRouteConfig: RouteChallengeConfig = {
  mapTitle: "放学回家安全路线图",
  mapDescription: "从学校出发，沿着安全路线依次经过关键节点，完成每一次判断。",
  routeLabel: "学校 -> 斑马线 -> 十字路口 -> 公交站 -> 小区门口 -> 家",
  safetyLabel: "安全值",
  currentRoleLabel: "路线小先锋",
  nodes: [
    {
      id: "school-gate",
      title: "校门口",
      mapLabel: "校门口",
      scenario: "同学喊你从护栏旁边抄近路，你会怎么做？",
      hint: "先选安全路线，再决定怎么通过。",
      helperText: "校门口人车混杂，越着急越容易忽略拐弯车和突然出现的电动车。",
      position: { top: 72, left: 12 },
      options: [
        {
          id: "school-gate-risk",
          label: "跟着同学从护栏边钻过去",
          safe: false,
          safetyDelta: -1,
          feedback: "护栏边视线差，司机不容易看见突然冲出来的学生。",
        },
        {
          id: "school-gate-safe",
          label: "坚持走斑马线，停一下再观察",
          safe: true,
          safetyDelta: 0,
          feedback: "做得对，出发第一步要先选正式过街点。",
        },
      ],
    },
    {
      id: "crosswalk",
      title: "斑马线",
      mapLabel: "斑马线",
      scenario: "绿灯亮了，但右转车还在慢慢通过，你怎么做？",
      hint: "绿灯不是唯一信号，还要看车有没有真正停稳。",
      helperText: "过街时同时看灯、看车、看路，别把绿灯当成可以直接冲过去的指令。",
      position: { top: 58, left: 28 },
      options: [
        {
          id: "crosswalk-safe",
          label: "先停一下，确认右转车礼让后再通过",
          safe: true,
          safetyDelta: 0,
          feedback: "很好，确认车辆动态后再通过更稳妥。",
        },
        {
          id: "crosswalk-risk",
          label: "绿灯已经亮了，马上跑过去",
          safe: false,
          safetyDelta: -1,
          feedback: "只看灯不看车，容易和转弯车辆抢时间。",
        },
      ],
    },
    {
      id: "cross-road",
      title: "十字路口",
      mapLabel: "十字路口",
      scenario: "路口边有停放车辆挡住视线，下面哪种做法更安全？",
      hint: "看不清来车的时候，要先把自己移动到开阔位置。",
      helperText: "停放车辆会挡住视线，突然从车缝里冲出最容易发生危险。",
      position: { top: 43, left: 46 },
      options: [
        {
          id: "cross-road-risk",
          label: "趁现在没车，从停放车中间钻出去",
          safe: false,
          safetyDelta: -1,
          feedback: "司机和你都很难及时看清对方，非常危险。",
        },
        {
          id: "cross-road-safe",
          label: "先绕到开阔位置，再找正式过街点",
          safe: true,
          safetyDelta: 0,
          feedback: "对，先看清、再决定从哪里通过。",
        },
      ],
    },
    {
      id: "bus-stop",
      title: "公交站",
      mapLabel: "公交站",
      scenario: "公交车刚靠站，车前方视线盲区很大，这时该怎么做？",
      hint: "远离公交车前方和车身盲区，再找看得清的位置。",
      helperText: "大车周围盲区明显，越贴近车身越容易被忽略。",
      position: { top: 28, left: 64 },
      options: [
        {
          id: "bus-stop-safe",
          label: "先绕开盲区，到安全区域再继续前进",
          safe: true,
          safetyDelta: 0,
          feedback: "很好，主动远离盲区是关键。",
        },
        {
          id: "bus-stop-risk",
          label: "从公交车前面快速穿过去省时间",
          safe: false,
          safetyDelta: -1,
          feedback: "车前方是最危险的盲区之一，司机可能完全看不到你。",
        },
      ],
    },
    {
      id: "home",
      title: "到家前最后一站",
      mapLabel: "小区门口",
      scenario: "快到家了，最后一个路口你应该怎么收尾？",
      hint: "越接近终点越不能放松，最后一段也要按规则来。",
      helperText: "很多危险发生在“快到了”的时候，最后一站也要继续停一下、看一看、再行动。",
      position: { top: 16, left: 82 },
      options: [
        {
          id: "home-safe",
          label: "继续走清楚的过街点，把最后一段也走稳",
          safe: true,
          safetyDelta: 0,
          feedback: "很棒，最后一段也坚持按规则完成，整条路线才算真正安全。",
        },
        {
          id: "home-risk",
          label: "反正快到了，直接从最近路线穿过去",
          safe: false,
          safetyDelta: -1,
          feedback: "快到终点也不能松懈，最后一段同样要稳稳通过。",
        },
      ],
    },
  ],
  completionCopy: "你已经完成放学回家路线挑战，学会在关键节点停一停、看一看，再做决定。",
};

export const levelTwoManagementDefaults: Pick<
  LevelManagementItem,
  | "displayOrder"
  | "sceneAssetLabel"
  | "taskOutline"
  | "feedbackCopy"
  | "hotspotItems"
  | "propItems"
  | "targetAreaNotes"
  | "routeChallengeConfig"
> = {
  displayOrder: 2,
  sceneAssetLabel: "after-school-route-map",
  taskOutline: levelTwoRouteConfig.nodes.map((item) => item.title),
  feedbackCopy: "每个节点都在底部事件卡里给出 2 到 3 个行动选择，错误选择只扣减安全值并解释风险。",
  hotspotItems: levelTwoRouteConfig.nodes.map((item) => item.mapLabel),
  propItems: [],
  targetAreaNotes: ["路线图中要明确显示学校、家、路口、斑马线和公交站等关键节点。"],
  routeChallengeConfig: levelTwoRouteConfig,
};
