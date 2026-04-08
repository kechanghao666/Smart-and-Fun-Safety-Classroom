import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { StudentAdventureHero } from "../../components/student/StudentAdventureHero";
import { StudentMascotBubble } from "../../components/student/StudentMascotBubble";
import { levelOneObservationConfig } from "../../data/levelOneObservation";
import {
  levelOneDecisionScene,
  levelOnePhotoCards,
  levelOneStickerScene,
} from "../../data/levelOnePhotoChallenge";
import {
  levelTwoRouteSteps,
  type LevelTwoRoutePhotoStep,
} from "../../data/levelTwoRouteChallenge";
import { guardianSceneVisuals } from "../../data/levelThreeGuardianScenes";
import { levelBlueprints } from "../../data/mockData";
import { ApiError } from "../../services/http";
import { completeStudentLevel, startStudentLevel } from "../../services/student";
import { useAppState } from "../../state/AppState";
import type {
  LevelId,
  LevelResult,
  ObservationSceneTarget,
  ObservationTaskChoice,
  ObservationTaskStep,
} from "../../types";
import { useStudentAiScene } from "../../utils/useStudentAiScene";

interface RouteChoiceLog {
  stepId: string;
  selectedLabel: string;
  safe: boolean;
}

interface RouteStepCard {
  id: string;
  title: string;
  scenario: string;
  hint: string;
  options: ObservationTaskChoice[];
}

interface GuardianSceneConfig {
  id: string;
  title: string;
  detail: string;
  toolLabel: string;
  toolHint: string;
  stageLabel: string;
  successText: string;
}

const routeStepCards: RouteStepCard[] = [
  {
    id: "school-gate",
    title: "校门口起点",
    scenario: "同学喊你从护栏旁边抄近路，你会怎么做？",
    hint: "先选安全路线，再看能不能通过。",
    options: [
      {
        id: "school-gate-risk",
        label: "跟着同学从护栏边钻过去",
        safe: false,
        feedback: "护栏旁边视线差，转弯车辆可能根本看不到你。",
      },
      {
        id: "school-gate-safe",
        label: "坚持走斑马线，等安全后再通过",
        safe: true,
        feedback: "做得对，先选安全路线才是第一步。",
      },
    ],
  },
  {
    id: "cross-road",
    title: "十字路口",
    scenario: "绿灯亮了，但右转车辆还在经过，下一步你会怎么做？",
    hint: "绿灯不是唯一信号，还要看车有没有停稳。",
    options: [
      {
        id: "cross-road-risk",
        label: "马上跑过去，绿灯肯定安全",
        safe: false,
        feedback: "不能只看灯，还要看车和视线。",
      },
      {
        id: "cross-road-safe",
        label: "先观察车辆，再沿斑马线通过",
        safe: true,
        feedback: "很棒，过马路时要同时看灯、看车、看路。",
      },
    ],
  },
  {
    id: "bus-stop",
    title: "公交站终点",
    scenario: "公交车刚靠站，车前方有盲区，你会怎么做？",
    hint: "大车前方和车尾附近都要特别小心。",
    options: [
      {
        id: "bus-stop-risk",
        label: "从车前快速穿过去，省时间",
        safe: false,
        feedback: "车前盲区很危险，司机可能完全看不到你。",
      },
      {
        id: "bus-stop-safe",
        label: "停下来观察，绕到安全区域后再走",
        safe: true,
        feedback: "正确，遇到公交车和大车要主动避开盲区。",
      },
    ],
  },
];

const guardianScenes: GuardianSceneConfig[] = [
  {
    id: "bus-line",
    title: "公交候车区",
    detail: "把候车的同学安排到安全候车线后方。",
    toolLabel: "候车站位卡",
    toolHint: "候车时要离车门和道路边缘远一点。",
    stageLabel: "候车黄线后方",
    successText: "站位放对了，候车时就不会离车门太近。",
  },
  {
    id: "seatbelt",
    title: "私家车出发前",
    detail: "先帮车内乘客系好安全带，再准备出发。",
    toolLabel: "安全带卡扣",
    toolHint: "上车后的第一件事，就是系好安全带。",
    stageLabel: "车内座位安全区",
    successText: "安全带已经准备好了，出发前的保护更完整了。",
  },
  {
    id: "helmet",
    title: "电动车乘坐区",
    detail: "让乘坐电动车的同学先戴好头盔。",
    toolLabel: "头盔守护帽",
    toolHint: "头盔能保护头部，是最重要的装备之一。",
    stageLabel: "头盔佩戴位置",
    successText: "头盔放对了，出发前记得先戴好再上路。",
  },
];

const routePhotoSteps: LevelTwoRoutePhotoStep[] = levelTwoRouteSteps;

function isLevelId(value: string | undefined): value is LevelId {
  return value === "level-1" || value === "level-2" || value === "level-3";
}

function buildProgressValue(current: number, total: number) {
  if (!total) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((current / total) * 100)));
}

function getLevelAccent(levelId: LevelId) {
  if (levelId === "level-2") {
    return "mint" as const;
  }

  if (levelId === "level-3") {
    return "orange" as const;
  }

  return "sky" as const;
}

function countObservationMistakes(attempts: Record<string, number>) {
  return Object.values(attempts).reduce((total, count) => total + count, 0);
}

function getObservationStars(mistakes: number) {
  if (mistakes <= 1) {
    return 3;
  }

  if (mistakes <= 3) {
    return 2;
  }

  return 1;
}

function getObservationScore(mistakes: number) {
  return Math.max(78, 100 - mistakes * 4);
}

function hasTargetBeenSolved(
  targetId: string,
  completedStepIds: string[],
  steps: ObservationTaskStep[],
) {
  return completedStepIds.some((stepId) => {
    const matchedStep = steps.find((item) => item.id === stepId);
    return matchedStep?.targetIds.includes(targetId);
  });
}

export function StudentLevelPage() {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const { completeLevel, markLevelInProgress, replaceProgress, state } = useAppState();
  const resolvedLevelId: LevelId = isLevelId(levelId) ? levelId : "level-1";
  const currentProgressLevel =
    state.progress.levels.find((level) => level.id === resolvedLevelId) ?? null;
  const currentLevel =
    currentProgressLevel ??
    levelBlueprints.find((level) => level.id === resolvedLevelId) ??
    null;
  const levelOrderIndex = state.progress.levels.findIndex(
    (level) => level.id === resolvedLevelId,
  );
  const accent = getLevelAccent(resolvedLevelId);
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);
  const startRequestRef = useRef<LevelId | null>(null);

  const observationConfig = currentLevel?.observationConfig ?? levelOneObservationConfig;
  const observationScene = observationConfig.observationScene;
  const observationSteps = observationConfig.taskSteps;
  const [syncError, setSyncError] = useState("");
  const [isFinishing, setIsFinishing] = useState(false);
  const [observationStepIndex, setObservationStepIndex] = useState(0);
  const [completedObservationSteps, setCompletedObservationSteps] = useState<string[]>([]);
  const [observationFeedback, setObservationFeedback] = useState(
    "先从斑马线开始观察，把安全线索一个一个找出来。",
  );
  const [observationAttempts, setObservationAttempts] = useState<Record<string, number>>({});
  const [showObservationMidpoint, setShowObservationMidpoint] = useState(false);
  const [selectedObservationChoiceId, setSelectedObservationChoiceId] = useState<string | null>(
    null,
  );
  const [activeObservationTargetId, setActiveObservationTargetId] = useState<string | null>(
    null,
  );
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [routeIndex, setRouteIndex] = useState(0);
  const [routeSafety, setRouteSafety] = useState(3);
  const [routeFeedback, setRouteFeedback] = useState<string | null>(null);
  const [routeCompleted, setRouteCompleted] = useState(false);
  const [routeChoices, setRouteChoices] = useState<RouteChoiceLog[]>([]);
  const [selectedGuardianTasks, setSelectedGuardianTasks] = useState<string[]>([]);
  const [activeGuardianSceneId, setActiveGuardianSceneId] = useState<string>(
    guardianScenes[0]?.id ?? "bus-line",
  );
  const [guardianFeedback, setGuardianFeedback] = useState<string | null>(null);
  const [draggedGuardianTaskId, setDraggedGuardianTaskId] = useState<string | null>(null);
  const [recentGuardianSuccessId, setRecentGuardianSuccessId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLevelId(levelId) || currentProgressLevel?.status !== "available") {
      return;
    }

    if (!canUseApi || !state.authToken) {
      markLevelInProgress(levelId);
      return;
    }

    if (startRequestRef.current === levelId) {
      return;
    }

    startRequestRef.current = levelId;
    setSyncError("");

    void startStudentLevel(state.authToken, levelId)
      .then((progress) => {
        replaceProgress(progress);
      })
      .catch((error) => {
        setSyncError(
          error instanceof ApiError
            ? error.message
            : "关卡已经打开，你可以继续挑战，稍后我会再和学习记录同步。",
        );
      });
  }, [
    canUseApi,
    currentProgressLevel?.status,
    levelId,
    markLevelInProgress,
    replaceProgress,
    state.authToken,
  ]);

  useEffect(() => {
    setObservationStepIndex(0);
    setCompletedObservationSteps([]);
    setObservationFeedback("先从斑马线开始观察，把安全线索一个一个找出来。");
    setObservationAttempts({});
    setShowObservationMidpoint(false);
    setSelectedObservationChoiceId(null);
    setActiveObservationTargetId(null);
    setSelectedStickerId(null);
    setRouteIndex(0);
    setRouteSafety(3);
    setRouteFeedback(null);
    setRouteCompleted(false);
    setRouteChoices([]);
    setSelectedGuardianTasks([]);
    setGuardianFeedback(null);
    setDraggedGuardianTaskId(null);
    setRecentGuardianSuccessId(null);
    setActiveGuardianSceneId(guardianScenes[0]?.id ?? "bus-line");
  }, [resolvedLevelId]);

  useEffect(() => {
    if (!recentGuardianSuccessId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setRecentGuardianSuccessId(null);
    }, 2200);

    return () => window.clearTimeout(timeoutId);
  }, [recentGuardianSuccessId]);

  const activeObservationStep =
    observationSteps[Math.min(observationStepIndex, observationSteps.length - 1)] ??
    observationSteps[0];
  const activeGuardianScene =
    guardianScenes.find((scene) => scene.id === activeGuardianSceneId) ?? guardianScenes[0];
  const activeGuardianVisual =
    guardianSceneVisuals[activeGuardianScene.id] ?? guardianSceneVisuals["bus-line"];
  const routeStep = routePhotoSteps[routeIndex] ?? routePhotoSteps[0];
  const lastRouteChoice = routeChoices[routeChoices.length - 1] ?? null;
  const routeShieldStates = [0, 1, 2].map((index) => index < routeSafety);
  const shuffledLevelOnePhotoCards = useMemo(() => {
    const cards = [...levelOnePhotoCards];

    for (let index = cards.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [cards[index], cards[swapIndex]] = [cards[swapIndex], cards[index]];
    }

    return cards;
  }, []);
  const recentGuardianSuccess =
    guardianScenes.find((scene) => scene.id === recentGuardianSuccessId) ?? null;

  const observationMistakes = countObservationMistakes(observationAttempts);
  const previewStars =
    resolvedLevelId === "level-1"
      ? getObservationStars(observationMistakes)
      : resolvedLevelId === "level-2"
        ? routeSafety >= 3
          ? 3
          : routeSafety === 2
            ? 2
            : 1
        : Math.max(1, Math.ceil((selectedGuardianTasks.length / guardianScenes.length) * 3));
  const completionReady =
    resolvedLevelId === "level-1"
      ? completedObservationSteps.length === observationSteps.length
      : resolvedLevelId === "level-2"
        ? routeCompleted && routeSafety > 0
        : selectedGuardianTasks.length === guardianScenes.length;
  const currentTaskIndex =
    resolvedLevelId === "level-1"
      ? Math.min(completedObservationSteps.length + 1, observationSteps.length)
      : resolvedLevelId === "level-2"
        ? Math.min(routeChoices.length + 1, routePhotoSteps.length)
        : Math.min(selectedGuardianTasks.length + 1, guardianScenes.length);
  const totalTaskCount =
    resolvedLevelId === "level-1"
      ? observationSteps.length
      : resolvedLevelId === "level-2"
        ? routePhotoSteps.length
        : guardianScenes.length;
  const progressWidth =
    resolvedLevelId === "level-1"
      ? buildProgressValue(completedObservationSteps.length, observationSteps.length)
      : resolvedLevelId === "level-2"
        ? routeCompleted
          ? 100
          : buildProgressValue(routeChoices.length, routePhotoSteps.length)
        : buildProgressValue(selectedGuardianTasks.length, guardianScenes.length);

  const levelGuide = useMemo(() => {
    if (resolvedLevelId === "level-1") {
      return {
        title: activeObservationStep?.title ?? "城市交通观察员",
        summary: `已完成 ${completedObservationSteps.length} / ${observationSteps.length} 个观察任务`,
        rule: activeObservationStep?.instruction ?? observationScene.sceneCaption,
        reminder: observationScene.sceneCaption,
        shortGoal: "先观察，再判断",
      };
    }

    if (resolvedLevelId === "level-2") {
      return {
        title: "沿着回家路线，一站一站做判断",
        summary: `安全护盾 ${routeSafety} / 3，已通过 ${routeChoices.length} / ${routePhotoSteps.length} 站`,
        rule: "过马路时不能只看绿灯，还要同时看车、看路、看盲区。",
        reminder: routeCompleted
          ? "路线挑战已经完成，检查一下刚才的判断，再提交本关。"
          : "每到一个路口，都先停一下，想清楚再选。",
        shortGoal: "选安全路线",
      };
    }

    return {
      title: "把安全装备放回正确场景",
      summary: `已完成 ${selectedGuardianTasks.length} / ${guardianScenes.length} 个守护步骤`,
      rule: "候车要站在线后，乘车要系安全带，坐电动车要先戴头盔。",
      reminder: "三项准备都完成后，就能解锁主题考试。",
      shortGoal: "装备放到位",
    };
  }, [
    activeObservationStep,
    completedObservationSteps.length,
    observationScene.sceneCaption,
    observationSteps.length,
    resolvedLevelId,
    routeChoices.length,
    routeCompleted,
    routeSafety,
    selectedGuardianTasks.length,
  ]);

  const levelHintPrompt = useMemo(() => {
    if (resolvedLevelId === "level-1") {
      return `我正在进行第一关“${currentLevel?.title ?? "城市交通观察员"}”，当前任务是：${activeObservationStep?.title ?? "观察路口"}。请用儿童友好的语气提醒我这一小步最该先观察什么。`;
    }

    return `我正在进行${currentLevel?.title ?? "道路安全关卡"}。${levelGuide.summary}。请用儿童友好的语气提醒我这一关最重要的安全规则，并告诉我现在最适合做的下一步。`;
  }, [activeObservationStep?.title, currentLevel?.title, levelGuide.summary, resolvedLevelId]);

  const {
    isLoading: isHintLoading,
    message: hintMessage,
    notice: hintNotice,
    refresh: refreshHint,
  } = useStudentAiScene({
    prompt: levelHintPrompt,
    scene: "hint",
    levelId: resolvedLevelId,
    fallbackText:
      resolvedLevelId === "level-1"
        ? activeObservationStep?.aiHint ?? levelGuide.rule
        : levelGuide.rule,
  });

  const levelChecklist = useMemo(() => {
    if (resolvedLevelId === "level-1") {
      return observationSteps.map((step, index) => ({
        id: step.id,
        label: step.title,
        done: completedObservationSteps.includes(step.id),
        note: completedObservationSteps.includes(step.id)
          ? step.successCopy
          : index === observationStepIndex
            ? step.instruction
            : step.aiHint,
      }));
    }

    if (resolvedLevelId === "level-2") {
      return routePhotoSteps.map((step, index) => {
        const choice = routeChoices.find((item) => item.stepId === step.id);

        return {
          id: step.id,
          label: step.title,
          done: Boolean(choice),
          note: choice
            ? `${choice.safe ? "安全选择" : "还需复习"}：${choice.selectedLabel}`
            : `第 ${index + 1} 站还没有做判断`,
        };
      });
    }

    return guardianScenes.map((scene) => ({
      id: scene.id,
      label: scene.toolLabel,
      done: selectedGuardianTasks.includes(scene.id),
      note: selectedGuardianTasks.includes(scene.id) ? scene.successText : scene.toolHint,
    }));
  }, [
    completedObservationSteps,
    observationStepIndex,
    observationSteps,
    resolvedLevelId,
    routeChoices,
    selectedGuardianTasks,
  ]);

  function moveToNextObservationStep() {
    setObservationStepIndex((current) => Math.min(current + 1, observationSteps.length - 1));
    setSelectedObservationChoiceId(null);
    setSelectedStickerId(null);
    setActiveObservationTargetId(null);
  }

  function recordObservationError(step: ObservationTaskStep) {
    setObservationAttempts((current) => ({
      ...current,
      [step.id]: (current[step.id] ?? 0) + 1,
    }));
    setObservationFeedback(step.errorCopy);
  }

  function completeObservationStep(step: ObservationTaskStep, focusId?: string) {
    setCompletedObservationSteps((current) =>
      current.includes(step.id) ? current : [...current, step.id],
    );
    setObservationFeedback(step.successCopy);
    setActiveObservationTargetId(focusId ?? step.targetIds[0] ?? null);

    if (step.id === observationSteps[2]?.id) {
      setShowObservationMidpoint(true);
      return;
    }

    if (step.id !== observationSteps[observationSteps.length - 1]?.id) {
      moveToNextObservationStep();
    }
  }

  function handleObservationTargetSelect(targetId: string) {
    if (resolvedLevelId !== "level-1" || !activeObservationStep) {
      return;
    }

    setActiveObservationTargetId(targetId);

    if (activeObservationStep.interactionType === "state_judge") {
      setObservationFeedback("先想一想现在该怎么做，再选一个安全做法。");
      return;
    }

    if (activeObservationStep.interactionType === "drag_marker") {
      if (!selectedStickerId) {
        setObservationFeedback("先从下方拿起安全贴纸，再贴到正确位置。");
        return;
      }

      if (activeObservationStep.targetIds.includes(targetId)) {
        completeObservationStep(activeObservationStep, targetId);
        return;
      }

      recordObservationError(activeObservationStep);
      return;
    }

    if (activeObservationStep.targetIds.includes(targetId)) {
      completeObservationStep(activeObservationStep, targetId);
      return;
    }

    recordObservationError(activeObservationStep);
  }

  function handleObservationPhotoCardSelect(taskId: string) {
    if (
      resolvedLevelId !== "level-1" ||
      !activeObservationStep ||
      (activeObservationStep.interactionType !== "hotspot" &&
        activeObservationStep.interactionType !== "danger_mark")
    ) {
      return;
    }

    setActiveObservationTargetId(taskId);

    if (activeObservationStep.id === taskId) {
      completeObservationStep(activeObservationStep, taskId);
      return;
    }

    recordObservationError(activeObservationStep);
  }

  function handleObservationChoiceSelect(choice: ObservationTaskChoice) {
    if (resolvedLevelId !== "level-1" || !activeObservationStep) {
      return;
    }

    setSelectedObservationChoiceId(choice.id);

    if (choice.safe) {
      completeObservationStep(activeObservationStep, activeObservationStep.targetIds[0]);
      return;
    }

    recordObservationError(activeObservationStep);
    setObservationFeedback(choice.feedback);
  }

  function handleObservationStickerSelect(stickerId: string) {
    setSelectedStickerId(stickerId);
    setObservationFeedback("贴纸拿好了，把它贴到斑马线起步观察点。");
  }

  function buildLevelResult(): LevelResult {
    const completedAt = new Date().toLocaleString("zh-CN", { hour12: false });

    if (resolvedLevelId === "level-1") {
      const stars = getObservationStars(observationMistakes);
      const score = getObservationScore(observationMistakes);

      return {
        levelId: resolvedLevelId,
        score,
        stars,
        completedAt,
        highlight:
          stars >= 2
            ? "你已经会先找斑马线、再看路牌和红绿灯，还能认出危险动作了。"
            : "你已经把整条观察链走完了，对路口里的安全线索越来越熟悉。",
        caution:
          stars >= 2
            ? "下一关记得把“看得见”升级成“会判断、会选择”。"
            : "看到绿灯也要继续看车，别着急往前冲。",
        aiSummary: observationConfig.completionCopy,
      };
    }

    if (resolvedLevelId === "level-2") {
      const scoreMap: Record<number, number> = {
        3: 100,
        2: 88,
        1: 76,
        0: 60,
      };
      const stars = routeSafety >= 3 ? 3 : routeSafety === 2 ? 2 : 1;

      return {
        levelId: resolvedLevelId,
        score: scoreMap[routeSafety] ?? 60,
        stars,
        completedAt,
        highlight:
          routeSafety >= 2
            ? "你能在关键路口保持冷静，做出比较稳妥的路线判断。"
            : "你已经走完整条路线，对放学回家的安全规则更熟悉了。",
        caution:
          routeSafety >= 2
            ? "记得看到绿灯也要继续观察车辆和盲区。"
            : "下一次别着急做选择，先停一停、想一想。",
        aiSummary: "继续保持先观察再决定的节奏，你会越来越像真正的路线小先锋。",
      };
    }

    return {
      levelId: resolvedLevelId,
      score: 100,
      stars: 3,
      completedAt,
      highlight: "你已经会在不同乘车场景里补齐关键防护动作了。",
      caution: "出发前先准备好，再行动，安全就会更稳。",
      aiSummary: "把防护动作变成习惯，才是真正的安全守护达人。",
    };
  }

  function handleRouteOptionSelect(option: RouteStepCard["options"][number]) {
    if (!routeStep) {
      return;
    }

    if (!option.safe) {
      setRouteSafety((current) => Math.max(0, current - 1));
    }

    setRouteChoices((current) => [
      ...current,
      {
        stepId: routeStep.id,
        selectedLabel: option.label,
        safe: option.safe,
      },
    ]);
    setRouteFeedback(option.feedback);

    if (routeIndex === routePhotoSteps.length - 1) {
      setRouteCompleted(true);
    } else {
      setRouteIndex((current) => current + 1);
    }
  }

  function resetRouteChallenge() {
    setRouteIndex(0);
    setRouteSafety(3);
    setRouteFeedback(null);
    setRouteCompleted(false);
    setRouteChoices([]);
  }

  function handleGuardianPlacement(taskId: string, sceneId: string) {
    if (selectedGuardianTasks.includes(taskId)) {
      return;
    }

    const currentScene = guardianScenes.find((item) => item.id === sceneId);

    if (taskId === sceneId) {
      const nextSelected = [...selectedGuardianTasks, taskId];
      const nextScene = guardianScenes.find((item) => !nextSelected.includes(item.id));

      setSelectedGuardianTasks(nextSelected);
      setRecentGuardianSuccessId(taskId);
      setGuardianFeedback(currentScene?.successText ?? "安全装备已经放到正确位置。");
      setDraggedGuardianTaskId(null);

      if (nextScene) {
        setActiveGuardianSceneId(nextScene.id);
      }

      setGuardianFeedback(
        nextScene
          ? `${currentScene?.successText ?? "安全装备已经放到正确位置。"} 下一步去完成“${nextScene.toolLabel}”。`
          : `${currentScene?.successText ?? "安全装备已经放到正确位置。"} 三项守护都准备好了，可以完成本关。`,
      );

      return;
    }

    setGuardianFeedback(
      currentScene
        ? `当前是${currentScene.title}，先完成“${currentScene.toolLabel}”。${currentScene.toolHint}`
        : "这件装备和当前场景不匹配，换一个再试试。",
    );
    setDraggedGuardianTaskId(null);
  }

  async function finishLevel() {
    const result = buildLevelResult();

    if (canUseApi && state.authToken) {
      setIsFinishing(true);
      setSyncError("");

      try {
        const response = await completeStudentLevel(state.authToken, resolvedLevelId);
        replaceProgress({
          ...response.progress,
          levelResults: {
            ...response.progress.levelResults,
            [resolvedLevelId]:
              resolvedLevelId === "level-1" ? result : response.result ?? result,
          },
        });
      } catch (error) {
        setSyncError(
          error instanceof ApiError
            ? error.message
            : "本关已经完成，但成绩同步稍慢，请稍后再试一次。",
        );
        setIsFinishing(false);
        return;
      }

      setIsFinishing(false);
      navigate(`/student/theme/road-safety/level/${resolvedLevelId}/result`);
      return;
    }

    completeLevel(resolvedLevelId, result);
    navigate(`/student/theme/road-safety/level/${resolvedLevelId}/result`);
  }

  if (!isLevelId(levelId) || !currentLevel) {
    return (
      <article className="surface-card student-level-empty">
        <strong>没有找到这一关</strong>
        <p>先回到主题页，再从可进入的关卡重新开始。</p>
        <button
          type="button"
          className="primary-button primary-button--playful"
          onClick={() => navigate("/student/theme/road-safety")}
        >
          回到主题页
        </button>
      </article>
    );
  }

  return (
    <div className="page-stack student-page student-page--level">
      <StudentAdventureHero
        eyebrow={`第 ${levelOrderIndex + 1 || 1} 关`}
        title={currentLevel.title}
        description={currentLevel.description}
        bubbleTitle="闯关目标"
        bubbleText={levelGuide.title}
        mascotLabel={`${previewStars}★`}
        mascotHint={levelGuide.rule}
        accent={accent}
        variant="level"
        stats={[
          { label: "任务进度", value: `${currentTaskIndex}/${totalTaskCount}`, accent: "sky" },
          { label: "预计时长", value: currentLevel.duration, accent: "orange" },
          { label: "奖励预览", value: `${previewStars} 星`, accent: "mint" },
        ]}
        actions={
          <>
            <button
              type="button"
              className="ghost-button"
              onClick={() => navigate("/student/theme/road-safety")}
            >
              返回主题页
            </button>
            <button
              type="button"
              className="primary-button primary-button--playful"
              disabled={!completionReady || isFinishing}
              onClick={() => {
                void finishLevel();
              }}
            >
              {isFinishing ? "正在结算..." : completionReady ? "完成本关" : "继续闯关"}
            </button>
          </>
        }
        aside={
          <div className="student-level-hero-meter">
            <p>进度条会一直告诉你，现在闯到哪一步了。</p>
            <div className="student-level-hero-meter__stars">
              {[1, 2, 3].map((star) => (
                <span
                  key={star}
                  className={
                    star <= previewStars
                      ? "student-level-hero-meter__star student-level-hero-meter__star--on"
                      : "student-level-hero-meter__star"
                  }
                >
                  ★
                </span>
              ))}
            </div>
            <div className="student-level-hero-meter__bar">
              <span
                className="student-level-hero-meter__fill"
                style={{ width: `${progressWidth}%` }}
              />
            </div>
            <p>{levelGuide.summary}</p>
          </div>
        }
      />

      {syncError ? (
        <article className="surface-card notice-card notice-card--warning">
          <strong>同步提醒</strong>
          <p>{syncError}</p>
        </article>
      ) : null}

      {resolvedLevelId === "level-1" ? (
        <section className="student-level-observe-layout">
          <article className="surface-card student-level-mission-board">
            <span className="section-block__eyebrow">当前任务</span>
            <div className="student-level-task-focus">
              <span className="student-level-task-focus__icon">{currentTaskIndex}</span>
              <div>
                <strong>{activeObservationStep.title}</strong>
                <p>{activeObservationStep.instruction}</p>
              </div>
            </div>

            <div className="student-level-checklist">
              {levelChecklist.map((item, index) => (
                <article
                  key={item.id}
                  className={
                    item.done
                      ? "student-level-checklist__item student-level-checklist__item--done"
                      : "student-level-checklist__item"
                  }
                >
                  <span className="student-level-checklist__index">{index + 1}</span>
                  <div>
                    <strong>{item.label}</strong>
                    <p>{item.note}</p>
                  </div>
                </article>
              ))}
            </div>

            <StudentMascotBubble
              eyebrow="AI 小提示"
              title="这一步先看哪里？"
              message={isHintLoading ? "正在整理观察提示..." : hintMessage}
              accent="sky"
              notice={hintNotice}
              actions={
                <>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => {
                      void refreshHint();
                    }}
                    disabled={isHintLoading}
                  >
                    {isHintLoading ? "生成中..." : "换一句提示"}
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => navigate("/student/ai")}
                  >
                    去 AI 问答
                  </button>
                </>
              }
            />
          </article>

          <article className="surface-card student-level-scene-card">
            <div className="student-level-panel-heading">
              <div>
                <span className="section-block__eyebrow">街道观察场景</span>
                <h2>在大图里找出安全线索</h2>
              </div>
              <span className="surface-tag">{observationScene.referenceLabel}</span>
            </div>

            {activeObservationStep.interactionType === "hotspot" ||
            activeObservationStep.interactionType === "danger_mark" ? (
              <div className="student-photo-choice-grid">
                {shuffledLevelOnePhotoCards.map((card) => {
                  const isCurrent = activeObservationStep.id === card.taskId;
                  const isDone = completedObservationSteps.includes(card.taskId);
                  const isSelected = activeObservationTargetId === card.taskId;

                  return (
                    <button
                      key={card.id}
                      type="button"
                      className={[
                        "student-photo-choice-card",
                        isDone ? "student-photo-choice-card--correct" : "",
                        isCurrent || isSelected ? "student-photo-choice-card--selected" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => handleObservationPhotoCardSelect(card.taskId)}
                    >
                      <div className="student-photo-choice-card__frame">
                        <img
                          src={card.imageUrl}
                          alt={card.label}
                          className="student-photo-choice-card__image"
                        />
                      </div>
                      <div className="student-photo-choice-card__content">
                        <p>{card.shortHint}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : activeObservationStep.interactionType === "state_judge" ? (
              <div className="student-observe-photo-stage">
                <div className="student-observe-photo-stage__frame">
                  <img
                    src={levelOneDecisionScene.imageUrl}
                    alt={levelOneDecisionScene.title}
                    className="student-observe-photo-stage__image"
                  />
                </div>
                <div className="student-observe-photo-stage__copy">
                  <span>真实路口照片</span>
                  <strong>{levelOneDecisionScene.title}</strong>
                  <p>{levelOneDecisionScene.helperText}</p>
                </div>
              </div>
            ) : (
              <div className="student-observe-photo-stage">
                <div className="student-observe-photo-board">
              <img
                src={levelOneStickerScene.imageUrl}
                alt="城市交通观察场景"
                className="student-observe-photo-board__image"
              />
              <div className="student-observe-photo-board__targets">
                {levelOneStickerScene.targets.map((target) => {
                  const isActive = activeObservationStep.targetIds.includes(target.id);
                  const isDone = hasTargetBeenSolved(
                    target.id,
                    completedObservationSteps,
                    observationSteps,
                  );

                  return (
                    <button
                      key={target.id}
                      type="button"
                      className={[
                        "student-observe-marker",
                        `student-observe-marker--${target.accent}`,
                        isActive ? "student-observe-marker--active" : "",
                        isDone ? "student-observe-marker--done" : "",
                        activeObservationTargetId === target.id
                          ? "student-observe-marker--focus"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      style={{
                        top: `${target.top}%`,
                        left: `${target.left}%`,
                        width: `${target.width}%`,
                        height: `${target.height}%`,
                      }}
                      onClick={() => handleObservationTargetSelect(target.id)}
                      onDragOver={(event) => {
                        event.preventDefault();
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        if (selectedStickerId) {
                          handleObservationTargetSelect(target.id);
                        }
                      }}
                    >
                      <span className="student-observe-marker__pulse" />
                      <span className="student-observe-marker__label">{target.label}</span>
                    </button>
                  );
                })}
              </div>
                </div>
                <div className="student-observe-photo-stage__copy">
                  <span>真实道路照片</span>
                  <strong>{levelOneStickerScene.title}</strong>
                  <p>{levelOneStickerScene.helperText}</p>
                </div>
              </div>
            )}

            <div className="student-observe-feedback">
              <strong>观察反馈</strong>
              <p>{observationFeedback}</p>
            </div>

            {activeObservationStep.interactionType === "state_judge" ? (
              <div className="student-state-choice-grid">
                {activeObservationStep.choices?.map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    className={
                      selectedObservationChoiceId === choice.id
                        ? "student-state-choice-card student-state-choice-card--active"
                        : "student-state-choice-card"
                    }
                    onClick={() => handleObservationChoiceSelect(choice)}
                  >
                    <strong>{choice.label}</strong>
                  </button>
                ))}
              </div>
            ) : null}

            {activeObservationStep.interactionType === "drag_marker" ? (
              <div className="student-sticker-tray">
                {observationScene.dragMarkers.map((marker) => (
                  <button
                    key={marker.id}
                    type="button"
                    draggable
                    className={
                      selectedStickerId === marker.id
                        ? "student-sticker-card student-sticker-card--active"
                        : "student-sticker-card"
                    }
                    onClick={() => handleObservationStickerSelect(marker.id)}
                    onDragStart={() => setSelectedStickerId(marker.id)}
                    onDragEnd={() => setSelectedStickerId(null)}
                  >
                    <span className="student-sticker-card__emoji">{marker.emoji}</span>
                    <div>
                      <strong>{marker.label}</strong>
                      <p>{marker.hint}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </article>
        </section>
      ) : (
        <>
          <section className="student-level-hud">
            <article className="surface-card student-level-mission-board">
              <span className="section-block__eyebrow">本关任务条</span>
              <h2>{levelGuide.title}</h2>
              <div className="student-level-checklist">
                {levelChecklist.map((item, index) => (
                  <article
                    key={item.id}
                    className={
                      item.done
                        ? "student-level-checklist__item student-level-checklist__item--done"
                        : "student-level-checklist__item"
                    }
                  >
                    <span className="student-level-checklist__index">{index + 1}</span>
                    <div>
                      <strong>{item.label}</strong>
                      <p>{item.note}</p>
                    </div>
                  </article>
                ))}
              </div>
            </article>

            <StudentMascotBubble
              eyebrow="AI 小提示"
              title="卡住时先看这里"
              message={isHintLoading ? "正在整理本关提示..." : hintMessage}
              accent={accent}
              notice={hintNotice}
              actions={
                <>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => {
                      void refreshHint();
                    }}
                    disabled={isHintLoading}
                  >
                    {isHintLoading ? "生成中..." : "换一句提示"}
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => navigate("/student/ai")}
                  >
                    去 AI 问答
                  </button>
                </>
              }
            />
          </section>

          {resolvedLevelId === "level-2" ? (
            <section className="student-level-stage student-level-stage--route">
              <article className="surface-card student-route-map-card">
                <div className="student-level-panel-heading">
                  <div>
                    <span className="section-block__eyebrow">路线地图</span>
                    <h2>沿着放学路线一站一站前进</h2>
                  </div>
                  <span className="surface-tag">安全护盾 {routeSafety} / 3</span>
                </div>

                <div className="student-route-map-board">
                  <div className="student-route-map-board__copy">
                    <strong>今天的放学路线一共有 6 站</strong>
                    <p>每到一站先看图，再做选择，沿着安全路线一步一步走回家。</p>
                  </div>

                  <div className="student-route-map-board__stats">
                    <article className="student-route-map-stat">
                      <span>当前进度</span>
                      <strong>{routeCompleted ? "到家啦" : `第 ${routeIndex + 1} 站`}</strong>
                    </article>
                    <article className="student-route-map-stat">
                      <span>已完成站点</span>
                      <strong>
                        {routeChoices.length} / {routePhotoSteps.length}
                      </strong>
                    </article>
                    <article className="student-route-map-stat student-route-map-stat--shield">
                      <span>安全护盾</span>
                      <div className="student-route-shields" aria-label={`安全护盾 ${routeSafety} / 3`}>
                        {routeShieldStates.map((active, index) => (
                          <span
                            key={index}
                            className={active ? "student-route-shield student-route-shield--active" : "student-route-shield"}
                          >
                            ◇
                          </span>
                        ))}
                      </div>
                    </article>
                  </div>

                  <div className="student-route-track">
                    {routePhotoSteps.map((step, index) => {
                      const choice = routeChoices.find((item) => item.stepId === step.id);
                      const cardClass = choice
                        ? choice.safe
                          ? "student-route-node student-route-node--done"
                          : "student-route-node student-route-node--risk"
                        : index === routeIndex && !routeCompleted
                          ? "student-route-node student-route-node--current"
                          : "student-route-node";
                      const statusLabel = choice
                        ? choice.safe
                          ? "稳稳通过"
                          : "需要再练"
                        : index === routeIndex && !routeCompleted
                          ? "正在这里"
                          : "下一站";

                      return (
                        <article
                          key={step.id}
                          className={`${cardClass} ${index % 2 === 0 ? "student-route-node--north" : "student-route-node--south"}`}
                        >
                          <div className="student-route-node__thumb">
                            <img src={step.imageUrl} alt={step.title} />
                          </div>
                          <div className="student-route-node__body">
                            <div className="student-route-node__meta">
                              <span className="student-route-node__index">{index + 1}</span>
                              <span className="student-route-node__status">{statusLabel}</span>
                            </div>
                            <strong>{step.title}</strong>
                            <p>{choice ? choice.selectedLabel : step.hint}</p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </article>

              <article className="surface-card student-route-choice-card">
                <span className="section-block__eyebrow">当前挑战</span>
                <div className="student-route-choice-card__meta">
                  <span className="student-route-choice-card__station">
                    {routeCompleted ? "路线全部完成" : `第 ${routeIndex + 1} 站 / ${routePhotoSteps.length}`}
                  </span>
                  {!routeCompleted ? (
                    <span className="student-route-choice-card__goal">先看图，再选最稳妥的做法</span>
                  ) : null}
                </div>
                <h2>{routeCompleted ? "路线挑战完成" : routeStep.title}</h2>
                <p className="student-route-choice-card__scenario">
                  {routeCompleted
                    ? "你已经走完整条路线，可以提交本关了。"
                    : routeStep.scenario}
                </p>

                <div className="student-route-photo-stage">
                  <div className="student-route-photo-stage__frame">
                    <img
                      src={routeStep.imageUrl}
                      alt={routeStep.title}
                      className="student-route-photo-stage__image"
                    />
                  </div>
                  <div className="student-route-photo-stage__copy">
                    <span>{routeCompleted ? "路线总结" : "真实道路现场"}</span>
                    <p>
                      {routeCompleted
                        ? "你已经把放学回家的 6 个关键节点都判断过一遍了，提交前再回想一下每次都是怎么做选择的。"
                        : routeStep.helperText}
                    </p>
                  </div>
                </div>

                {!routeCompleted ? (
                  <div className="student-route-choice-grid">
                    {routeStep.options.map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        className="student-route-option"
                        onClick={() => handleRouteOptionSelect(option)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : null}

                {routeFeedback ? (
                  <article
                    className={
                      lastRouteChoice?.safe
                        ? "student-level-scene-tip student-level-scene-tip--mint"
                        : "student-level-scene-tip student-level-scene-tip--orange"
                    }
                  >
                    <div className="student-level-scene-tip__meta">
                      <span className="student-level-scene-tip__label">路线反馈</span>
                      <span className="student-level-scene-tip__status">
                        {lastRouteChoice?.safe ? "这一站通过了" : "这一站要再想想"}
                      </span>
                    </div>
                    <strong>{lastRouteChoice?.safe ? "这一站做对了" : "这一站要再想一想"}</strong>
                    <p>{routeFeedback}</p>
                  </article>
                ) : null}

                <div className="button-row">
                  <button type="button" className="ghost-button" onClick={resetRouteChallenge}>
                    重新挑战
                  </button>
                  <button
                    type="button"
                    className="primary-button primary-button--playful"
                    disabled={!completionReady || isFinishing}
                    onClick={() => {
                      void finishLevel();
                    }}
                  >
                    {isFinishing ? "正在结算..." : "完成本关"}
                  </button>
                </div>
              </article>
            </section>
          ) : null}

          {resolvedLevelId === "level-3" ? (
            <section className="student-level-stage student-level-stage--guardian">
              <article className="surface-card student-guardian-stage-card">
                <div className="student-level-panel-heading">
                  <div>
                    <span className="section-block__eyebrow">守护步骤</span>
                    <h2>把安全装备放到正确场景</h2>
                  </div>
                  <span className="surface-tag">
                    {selectedGuardianTasks.length} / {guardianScenes.length} 已完成
                  </span>
                </div>

                <div className="student-guardian-step-row">
                  {guardianScenes.map((scene) => {
                    const isDone = selectedGuardianTasks.includes(scene.id);
                    const isActive = activeGuardianSceneId === scene.id;
                    const isCelebrating = recentGuardianSuccessId === scene.id;
                    const visual = guardianSceneVisuals[scene.id] ?? activeGuardianVisual;

                    return (
                      <button
                        key={scene.id}
                        type="button"
                        className={
                          isDone
                            ? isCelebrating
                              ? "student-guardian-step student-guardian-step--done student-guardian-step--celebrating"
                              : "student-guardian-step student-guardian-step--done"
                            : isActive
                              ? "student-guardian-step student-guardian-step--active"
                              : "student-guardian-step"
                        }
                        onClick={() => setActiveGuardianSceneId(scene.id)}
                      >
                        <div className="student-guardian-step__thumb">
                          <img src={visual.sceneImageUrl} alt={scene.title} />
                        </div>
                        <strong>{scene.title}</strong>
                        <span>{isDone ? "已完成" : isActive ? "进行中" : "等待中"}</span>
                      </button>
                    );
                  })}
                </div>

                {recentGuardianSuccess ? (
                  <article className="student-guardian-celebration">
                    <strong>刚刚完成：{recentGuardianSuccess.title}</strong>
                    <span>
                      {selectedGuardianTasks.length === guardianScenes.length
                        ? "三项守护已经全部点亮，可以完成这一关。"
                        : `继续前往下一步：${activeGuardianScene.title}`}
                    </span>
                  </article>
                ) : null}

                <div className="student-guardian-stage">
                  <div className="student-guardian-stage__scene">
                    <span className="surface-tag">当前场景</span>
                    <h3>{activeGuardianScene.title}</h3>
                    <div className="student-guardian-stage__photo">
                      <img src={activeGuardianVisual.sceneImageUrl} alt={activeGuardianScene.title} />
                      <div
                        className={
                          selectedGuardianTasks.includes(activeGuardianScene.id)
                            ? "student-guardian-photo-target student-guardian-photo-target--done"
                            : draggedGuardianTaskId
                              ? "student-guardian-photo-target student-guardian-photo-target--ready"
                              : "student-guardian-photo-target"
                        }
                        style={{
                          top: `${activeGuardianVisual.targetZone.top}%`,
                          left: `${activeGuardianVisual.targetZone.left}%`,
                          width: `${activeGuardianVisual.targetZone.width}%`,
                          height: `${activeGuardianVisual.targetZone.height}%`,
                        }}
                        onDragOver={(event) => {
                          event.preventDefault();
                        }}
                        onDrop={(event) => {
                          event.preventDefault();

                          if (draggedGuardianTaskId) {
                            handleGuardianPlacement(draggedGuardianTaskId, activeGuardianScene.id);
                          }
                        }}
                      >
                        <span>{activeGuardianVisual.targetZone.label}</span>
                      </div>
                    </div>
                    <div className="student-guardian-stage__task-chip">
                      当前要放：{activeGuardianScene.toolLabel}
                    </div>
                    <p>{activeGuardianScene.detail}</p>
                    <p>{activeGuardianVisual.sceneCaption}</p>
                  </div>
                  <div
                    className={
                      selectedGuardianTasks.includes(activeGuardianScene.id)
                        ? "student-guardian-dropzone student-guardian-dropzone--done"
                        : draggedGuardianTaskId
                          ? "student-guardian-dropzone student-guardian-dropzone--ready"
                          : "student-guardian-dropzone"
                    }
                    onDragOver={(event) => {
                      event.preventDefault();
                    }}
                    onDrop={(event) => {
                      event.preventDefault();

                      if (draggedGuardianTaskId) {
                        handleGuardianPlacement(draggedGuardianTaskId, activeGuardianScene.id);
                      }
                    }}
                  >
                    <span className="student-guardian-dropzone__eyebrow">真实照片任务区</span>
                    <strong>{activeGuardianScene.stageLabel}</strong>
                    <span>
                      {selectedGuardianTasks.includes(activeGuardianScene.id)
                        ? "装备已经放好了"
                        : "把合适的装备拖进来，或点击下方道具卡"}
                    </span>
                    {!selectedGuardianTasks.includes(activeGuardianScene.id) ? (
                      <span className="student-guardian-dropzone__hint">
                        {activeGuardianVisual.actionHint}
                      </span>
                    ) : null}
                  </div>
                </div>
              </article>

              <article className="surface-card student-guardian-tool-card-board">
                <span className="section-block__eyebrow">装备栏</span>
                <h2>选择合适的安全装备</h2>
                <div className="student-guardian-tool-board__hint">
                  现在请先放：{activeGuardianScene.toolLabel}
                </div>
                <div className="student-guardian-tool-grid">
                  {guardianScenes.map((scene) => {
                    const isDone = selectedGuardianTasks.includes(scene.id);
                    const isDragging = draggedGuardianTaskId === scene.id;
                    const isFocus = activeGuardianScene.id === scene.id && !isDone;
                    const isCelebrating = recentGuardianSuccessId === scene.id;
                    const visual = guardianSceneVisuals[scene.id] ?? activeGuardianVisual;

                    return (
                      <button
                        key={scene.id}
                        type="button"
                        draggable={!isDone}
                        className={
                          isDone
                            ? isCelebrating
                              ? "student-guardian-tool student-guardian-tool--done student-guardian-tool--celebrating"
                              : "student-guardian-tool student-guardian-tool--done"
                            : isDragging
                              ? "student-guardian-tool student-guardian-tool--dragging"
                              : isFocus
                                ? "student-guardian-tool student-guardian-tool--focus"
                                : isCelebrating
                                  ? "student-guardian-tool student-guardian-tool--celebrating"
                                  : "student-guardian-tool"
                        }
                        onDragStart={() => setDraggedGuardianTaskId(scene.id)}
                        onDragEnd={() => setDraggedGuardianTaskId(null)}
                        onClick={() => handleGuardianPlacement(scene.id, activeGuardianScene.id)}
                        disabled={isDone}
                      >
                        <div className="student-guardian-tool__thumb">
                          <img src={visual.toolImageUrl} alt={scene.toolLabel} />
                        </div>
                        <span className="student-guardian-tool__status">
                          {isDone ? "已就位" : isFocus ? "当前要放" : "待选择"}
                        </span>
                        <strong>{scene.toolLabel}</strong>
                        <span>{visual.toolCaption}</span>
                      </button>
                    );
                  })}
                </div>

                {guardianFeedback ? (
                  <article
                    className={
                      recentGuardianSuccess
                        ? "student-level-scene-tip student-level-scene-tip--mint"
                        : "student-level-scene-tip student-level-scene-tip--orange"
                    }
                  >
                    <div className="student-level-scene-tip__meta">
                      <span className="student-level-scene-tip__label">场景反馈</span>
                      <span className="student-level-scene-tip__status">
                        {recentGuardianSuccess ? "刚完成一个守护动作" : "换一个再试试"}
                      </span>
                    </div>
                    <strong>场景反馈</strong>
                    <p>{guardianFeedback}</p>
                  </article>
                ) : null}
              </article>
            </section>
          ) : null}
        </>
      )}

      <section className="student-card-grid student-card-grid--two">
        <article className="surface-card student-level-rule-card">
          <span className="section-block__eyebrow">闯关规则</span>
          <h2>{levelGuide.shortGoal}</h2>
          <div className="student-level-mini-rules">
            <article className="student-level-mini-rules__card">
              <strong>这一关要做什么？</strong>
              <p>{levelGuide.rule}</p>
            </article>
            <article className="student-level-mini-rules__card">
              <strong>过关提醒</strong>
              <p>{levelGuide.reminder}</p>
            </article>
          </div>
        </article>

        <article className="surface-card student-level-reward-card">
          <span className="section-block__eyebrow">过关奖励</span>
          <h2>点亮星星，继续向前</h2>
          <div className="student-level-reward-card__row">
            <span className="student-level-reward-card__token">星级</span>
            <strong>{previewStars} 星预览</strong>
          </div>
          <div className="student-level-reward-card__row">
            <span className="student-level-reward-card__token">时长</span>
            <strong>{currentLevel.duration}</strong>
          </div>
          <div className="student-level-reward-card__row">
            <span className="student-level-reward-card__token">下一步</span>
            <strong>{completionReady ? "可以去领奖励" : "继续完成任务"}</strong>
          </div>
        </article>
      </section>

      {showObservationMidpoint ? (
        <div className="student-level-midpoint-overlay">
          <article className="surface-card student-level-midpoint-card">
            <span className="section-block__eyebrow">观察半程完成</span>
            <h2>你已经找到前半段关键线索啦</h2>
            <p>{observationConfig.midpointCopy}</p>
            <div className="student-level-midpoint-card__actions">
              <button
                type="button"
                className="primary-button primary-button--playful"
                onClick={() => {
                  setShowObservationMidpoint(false);
                  moveToNextObservationStep();
                }}
              >
                继续观察
              </button>
            </div>
          </article>
        </div>
      ) : null}
    </div>
  );
}
