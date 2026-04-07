import type {
  LevelManagementItem,
  ObservationLevelConfig,
} from "../types";

export const levelOneObservationConfig: ObservationLevelConfig = {
  observationScene: {
    backgroundAsset: "level-1-city-street",
    referenceLabel: "儿童交通安全街道观察图 A",
    sceneCaption: "在路口里先看斑马线、路牌、红绿灯，再找出危险动作。",
    targets: [
      {
        id: "crosswalk-main",
        label: "斑马线",
        hint: "安全通行要先找到斑马线。",
        top: 71,
        left: 14,
        width: 20,
        height: 14,
        shape: "rect",
        accent: "mint",
      },
      {
        id: "crosswalk-sign",
        label: "人行横道标志",
        hint: "蓝色路牌会告诉你这里适合安全通过。",
        top: 33,
        left: 9,
        width: 8,
        height: 10,
        shape: "pill",
        accent: "sky",
      },
      {
        id: "signal-zone",
        label: "信号灯观察位",
        hint: "过马路前要同时看灯和看车。",
        top: 46,
        left: 35,
        width: 9,
        height: 19,
        shape: "pill",
        accent: "orange",
      },
      {
        id: "sticker-drop-zone",
        label: "安全提示贴纸点",
        hint: "把安全贴纸贴到斑马线起步观察点。",
        top: 58,
        left: 24,
        width: 12,
        height: 10,
        shape: "rect",
        accent: "mint",
      },
    ],
    dangerMarkers: [
      {
        id: "danger-climb-rail",
        label: "翻越护栏",
        hint: "翻越护栏会突然冲进车道，很危险。",
        top: 58,
        left: 76,
        width: 8,
        height: 13,
        shape: "pill",
        accent: "danger",
      },
      {
        id: "danger-run-red",
        label: "红灯奔跑",
        hint: "红灯时冲跑，会让司机来不及反应。",
        top: 57,
        left: 64,
        width: 8,
        height: 15,
        shape: "pill",
        accent: "danger",
      },
    ],
    dragMarkers: [
      {
        id: "safe-pass-sticker",
        label: "先停一停贴纸",
        emoji: "🛑",
        hint: "提醒自己在起步前先停、先看、再走。",
        targetId: "sticker-drop-zone",
        successCopy: "贴对啦，安全通行前要先停一停、看一看。",
      },
    ],
  },
  taskSteps: [
    {
      id: "step-crosswalk",
      title: "找到安全通行位置",
      instruction: "先在路口里找出可以安全通过的斑马线。",
      interactionType: "hotspot",
      targetIds: ["crosswalk-main"],
      successCopy: "找到了，过马路要优先走斑马线。",
      errorCopy: "先找地面上白白的斑马线，再决定怎么过路。",
      aiHint: "过马路前先找斑马线，别急着往前跑。",
    },
    {
      id: "step-sign",
      title: "找到人行横道标志",
      instruction: "再找到提醒大家安全过路的人行横道标志。",
      interactionType: "hotspot",
      targetIds: ["crosswalk-sign"],
      successCopy: "找到了，路牌会帮助你更快判断安全路线。",
      errorCopy: "看看路边的蓝色标志牌，它会告诉你这里是什么区域。",
      aiHint: "路牌往往藏在路边高一点的位置，别只盯着地面。",
    },
    {
      id: "step-danger-rail",
      title: "圈出翻越护栏的危险动作",
      instruction: "把翻越护栏的危险行为圈出来。",
      interactionType: "danger_mark",
      targetIds: ["danger-climb-rail"],
      successCopy: "发现危险动作了，翻护栏会突然冲到车前。",
      errorCopy: "找找哪位同学没有按规则走斑马线，而是想抄近路。",
      aiHint: "离护栏太近、想钻过去的动作都很危险。",
    },
    {
      id: "step-danger-red",
      title: "圈出另一处明显危险行为",
      instruction: "再找出另一处不安全的过路动作。",
      interactionType: "danger_mark",
      targetIds: ["danger-run-red"],
      successCopy: "找到了，红灯时抢跑很容易和车抢时间。",
      errorCopy: "看看路口中央附近，谁在没有确认安全时就冲了出去？",
      aiHint: "危险动作通常和“急着跑、没看车、没看灯”有关。",
    },
    {
      id: "step-signal-judge",
      title: "判断现在能不能通过",
      instruction: "观察信号灯和车辆状态，选出现在最安全的做法。",
      interactionType: "state_judge",
      targetIds: ["signal-zone"],
      successCopy: "判断正确，绿灯亮起也要确认车辆已经礼让。",
      errorCopy: "不能只看绿灯，还要看看转弯车辆有没有停稳。",
      aiHint: "看灯只是第一步，还要看车和看周围环境。",
      choices: [
        {
          id: "judge-wait",
          label: "先等转弯车停稳，再沿斑马线通过",
          safe: true,
          feedback: "答对了，先停一停、看一看，才是稳妥的选择。",
        },
        {
          id: "judge-run",
          label: "绿灯亮了马上冲过去，不用再看车",
          safe: false,
          feedback: "还不够安全，绿灯亮了也要继续观察车辆状态。",
        },
      ],
    },
    {
      id: "step-sticker",
      title: "贴上安全提示贴纸",
      instruction: "把“先停一停”安全贴纸拖到正确观察点位。",
      interactionType: "drag_marker",
      targetIds: ["sticker-drop-zone"],
      successCopy: "贴好啦，这个观察点最适合提醒大家先停、先看、再走。",
      errorCopy: "把贴纸贴在斑马线起步前的观察位置，不要贴到车道中间。",
      aiHint: "安全贴纸应该贴在准备起步、还没迈入车道的位置。",
      stickerId: "safe-pass-sticker",
    },
  ],
  midpointCopy:
    "观察半程完成啦。你已经认出了斑马线、路牌和第一处危险动作，接下来要开始判断什么时候能走、哪里最该提醒大家。",
  completionCopy:
    "恭喜成为城市交通观察员。你已经学会在路口先看安全通行点，再识别风险动作，最后做出稳妥判断。",
};

export const levelOneManagementDefaults: Pick<
  LevelManagementItem,
  | "displayOrder"
  | "sceneAssetLabel"
  | "taskOutline"
  | "feedbackCopy"
  | "hotspotItems"
  | "propItems"
  | "targetAreaNotes"
  | "observationScene"
  | "taskSteps"
  | "midpointCopy"
  | "completionCopy"
> = {
  displayOrder: 1,
  sceneAssetLabel: levelOneObservationConfig.observationScene.backgroundAsset,
  taskOutline: levelOneObservationConfig.taskSteps.map((step) => step.title),
  feedbackCopy: "每一步都用局部气泡反馈，不打断学生继续观察和尝试。",
  hotspotItems: [
    "斑马线观察区",
    "人行横道标志观察区",
    "翻越护栏危险点",
    "红灯奔跑危险点",
    "信号灯判断区",
  ],
  propItems: ["先停一停贴纸"],
  targetAreaNotes: ["贴纸要贴在斑马线起步观察点，不要直接贴进车道。"],
  observationScene: levelOneObservationConfig.observationScene,
  taskSteps: levelOneObservationConfig.taskSteps,
  midpointCopy: levelOneObservationConfig.midpointCopy,
  completionCopy: levelOneObservationConfig.completionCopy,
};
