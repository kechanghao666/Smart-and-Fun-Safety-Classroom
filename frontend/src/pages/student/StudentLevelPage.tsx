import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { StudentAdventureHero } from "../../components/student/StudentAdventureHero";
import { StudentMascotBubble } from "../../components/student/StudentMascotBubble";
import { levelBlueprints } from "../../data/mockData";
import { ApiError } from "../../services/http";
import { completeStudentLevel, startStudentLevel } from "../../services/student";
import { useAppState } from "../../state/AppState";
import type { LevelId, LevelResult } from "../../types";
import { useStudentAiScene } from "../../utils/useStudentAiScene";

interface RouteChoiceLog {
  stepId: string;
  selectedLabel: string;
  safe: boolean;
}

interface StreetHotspot {
  id: string;
  task: string;
  label: string;
  clue: string;
  success: string;
  top: string;
  left: string;
}

interface RouteStepCard {
  id: string;
  title: string;
  scenario: string;
  hint: string;
  options: Array<{
    label: string;
    safe: boolean;
    feedback: string;
  }>;
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

const streetHotspots: StreetHotspot[] = [
  {
    id: "crosswalk",
    task: "找到安全通行的斑马线",
    label: "斑马线",
    clue: "先找过马路应该站的位置。",
    success: "找到了，过马路要优先走斑马线。",
    top: "70%",
    left: "24%",
  },
  {
    id: "signal-light",
    task: "识别可以通行的信号灯",
    label: "信号灯",
    clue: "看清灯色和车辆状态再行动。",
    success: "看到了，通行前要同时看灯和看车。",
    top: "25%",
    left: "47%",
  },
  {
    id: "danger-action",
    task: "指出危险行为",
    label: "危险动作",
    clue: "翻越护栏很危险，不能模仿。",
    success: "发现危险行为了，要远离护栏旁的捷径。",
    top: "47%",
    left: "75%",
  },
  {
    id: "road-sign",
    task: "找到人行横道标志",
    label: "路牌",
    clue: "路牌会提醒你这里适合安全通行。",
    success: "找到了，先看标志能帮助你更快做判断。",
    top: "20%",
    left: "16%",
  },
];

const routeStepCards: RouteStepCard[] = [
  {
    id: "school-gate",
    title: "校门口起点",
    scenario: "同学喊你从护栏旁抄近路，你会怎么走？",
    hint: "先选安全路线，再看能不能通过。",
    options: [
      {
        label: "跟着同学从护栏旁钻过去",
        safe: false,
        feedback: "护栏边视线差，转弯车辆可能看不到你。",
      },
      {
        label: "坚持走斑马线，等安全后再通过",
        safe: true,
        feedback: "做得对，先选安全路线才是第一步。",
      },
    ],
  },
  {
    id: "cross-road",
    title: "路口判断站",
    scenario: "绿灯亮了，但右转车辆还在经过，下一步怎么做？",
    hint: "绿灯不是唯一信号，还要看车有没有停稳。",
    options: [
      {
        label: "马上跑过去，绿灯肯定安全",
        safe: false,
        feedback: "不能只看灯，还要看车和视线。",
      },
      {
        label: "先观察车辆，再沿斑马线通过",
        safe: true,
        feedback: "很好，过马路时要同时看灯、看车、看路。",
      },
    ],
  },
  {
    id: "bus-stop",
    title: "公交站终点",
    scenario: "公交车刚靠站，车前方有盲区，你应该怎么做？",
    hint: "大车前方和车尾附近都要特别小心。",
    options: [
      {
        label: "从车前快速穿过去，省时间",
        safe: false,
        feedback: "车前盲区很危险，司机可能完全看不到你。",
      },
      {
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

function isLevelId(value: string | undefined): value is LevelId {
  return value === "level-1" || value === "level-2" || value === "level-3";
}

function buildProgressValue(current: number, total: number) {
  if (total === 0) {
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

export function StudentLevelPage() {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const { completeLevel, markLevelInProgress, replaceProgress, state } = useAppState();
  const resolvedLevelId: LevelId = isLevelId(levelId) ? levelId : "level-1";
  const currentLevel =
    state.progress.levels.find((level) => level.id === resolvedLevelId) ?? null;
  const levelMeta =
    levelBlueprints.find((level) => level.id === resolvedLevelId) ?? null;
  const levelOrderIndex = state.progress.levels.findIndex(
    (level) => level.id === resolvedLevelId,
  );
  const [syncError, setSyncError] = useState("");
  const [isFinishing, setIsFinishing] = useState(false);
  const [selectedHotspots, setSelectedHotspots] = useState<string[]>([]);
  const [hotspotMessage, setHotspotMessage] = useState("");
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
  const startRequestRef = useRef<LevelId | null>(null);
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);

  useEffect(() => {
    if (!isLevelId(levelId) || currentLevel?.status !== "available") {
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
            : "关卡已打开，你可以继续挑战，稍后会再和学习记录同步。",
        );
      });
  }, [
    canUseApi,
    currentLevel?.status,
    levelId,
    markLevelInProgress,
    replaceProgress,
    state.authToken,
  ]);

  useEffect(() => {
    setSelectedHotspots([]);
    setHotspotMessage("");
    setRouteIndex(0);
    setRouteSafety(3);
    setRouteFeedback(null);
    setRouteCompleted(false);
    setRouteChoices([]);
    setSelectedGuardianTasks([]);
    setGuardianFeedback(null);
    setDraggedGuardianTaskId(null);
    setActiveGuardianSceneId(guardianScenes[0]?.id ?? "bus-line");
  }, [resolvedLevelId]);

  const accent = getLevelAccent(resolvedLevelId);
  const routeStep = routeStepCards[routeIndex] ?? routeStepCards[0]!;
  const activeGuardianScene =
    guardianScenes.find((scene) => scene.id === activeGuardianSceneId) ?? guardianScenes[0]!;
  const completedGuardianCount = selectedGuardianTasks.length;

  const levelGuide = useMemo(() => {
    if (resolvedLevelId === "level-1") {
      return {
        title: "在图里找到四个安全关键点",
        summary: `已找到 ${selectedHotspots.length} / ${streetHotspots.length} 个目标`,
        rule: "先看斑马线、信号灯、危险动作和路牌，再决定怎么通过路口。",
        reminder: "四个目标都点亮后，就能完成这一关。",
        shortGoal: "看清楚，再行动",
      };
    }

    if (resolvedLevelId === "level-2") {
      return {
        title: "沿着回家路线，一站一站做判断",
        summary: `安全护盾 ${routeSafety} / 3，已通过 ${routeChoices.length} / ${routeStepCards.length} 站`,
        rule: "过马路时不能只看绿灯，还要同时看车、看路、看盲区。",
        reminder: routeCompleted
          ? "路线挑战已经完成，检查一下刚才的判断，再提交本关。"
          : "每到一个路口，都先停一下，想清楚再选。",
        shortGoal: "选安全路线",
      };
    }

    return {
      title: "把安全装备放回正确场景",
      summary: `已完成 ${completedGuardianCount} / ${guardianScenes.length} 个守护步骤`,
      rule: "候车要站在线后，乘车要系安全带，坐电动车要先戴头盔。",
      reminder: "三项准备都完成后，就能解锁主题考试。",
      shortGoal: "装备放到位",
    };
  }, [
    completedGuardianCount,
    resolvedLevelId,
    routeChoices.length,
    routeCompleted,
    routeSafety,
    selectedHotspots.length,
  ]);

  const levelHintPrompt = useMemo(
    () =>
      `我正在进行${levelMeta?.title ?? "道路安全关卡"}。${levelGuide.summary}。请用儿童友好的语气提醒我这一关最重要的安全规则，并告诉我现在最适合做的下一步。`,
    [levelGuide.summary, levelMeta?.title],
  );

  const {
    isLoading: isHintLoading,
    message: hintMessage,
    notice: hintNotice,
    refresh: refreshHint,
  } = useStudentAiScene({
    prompt: levelHintPrompt,
    scene: "hint",
    levelId: resolvedLevelId,
    fallbackText: levelGuide.rule,
  });

  const completionReady =
    resolvedLevelId === "level-1"
      ? selectedHotspots.length === streetHotspots.length
      : resolvedLevelId === "level-2"
        ? routeCompleted && routeSafety > 0
        : completedGuardianCount === guardianScenes.length;

  const previewStars =
    resolvedLevelId === "level-1"
      ? Math.max(1, Math.ceil((selectedHotspots.length / streetHotspots.length) * 3))
      : resolvedLevelId === "level-2"
        ? routeSafety >= 3
          ? 3
          : routeSafety === 2
            ? 2
            : 1
        : Math.max(1, Math.ceil((completedGuardianCount / guardianScenes.length) * 3));

  const currentTaskIndex =
    resolvedLevelId === "level-1"
      ? Math.min(selectedHotspots.length + 1, streetHotspots.length)
      : resolvedLevelId === "level-2"
        ? Math.min(routeChoices.length + 1, routeStepCards.length)
        : Math.min(completedGuardianCount + 1, guardianScenes.length);

  const totalTaskCount =
    resolvedLevelId === "level-1"
      ? streetHotspots.length
      : resolvedLevelId === "level-2"
        ? routeStepCards.length
        : guardianScenes.length;

  const progressWidth =
    resolvedLevelId === "level-1"
      ? buildProgressValue(selectedHotspots.length, streetHotspots.length)
      : resolvedLevelId === "level-2"
        ? routeCompleted
          ? 100
          : buildProgressValue(routeChoices.length, routeStepCards.length)
        : buildProgressValue(completedGuardianCount, guardianScenes.length);

  const levelChecklist = useMemo(() => {
    if (resolvedLevelId === "level-1") {
      return streetHotspots.map((hotspot) => ({
        id: hotspot.id,
        label: hotspot.task,
        done: selectedHotspots.includes(hotspot.id),
        note: selectedHotspots.includes(hotspot.id) ? hotspot.success : hotspot.clue,
      }));
    }

    if (resolvedLevelId === "level-2") {
      return routeStepCards.map((step, index) => {
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
  }, [resolvedLevelId, routeChoices, selectedGuardianTasks, selectedHotspots]);

  function buildLevelResult(): LevelResult {
    const completedAt = new Date().toLocaleString("zh-CN", { hour12: false });

    if (resolvedLevelId === "level-1") {
      return {
        levelId: resolvedLevelId,
        score: 100,
        stars: 3,
        completedAt,
        highlight: "你已经会在路口主动寻找斑马线、信号灯、路牌和危险动作了。",
        caution: "下一关要把“看得见”升级成“会判断、会选择”。",
        aiSummary: "继续保持先观察再行动的节奏，你会越来越像真正的安全观察员。",
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
            : "下次遇到路口时，要再多停一下，先看车再行动。",
        aiSummary:
          routeSafety >= 2
            ? "你的路线判断越来越稳了，已经能把规则用到真实场景里。"
            : "你完成了挑战，接下来只要再多观察一点点，就会更安全。",
      };
    }

    return {
      levelId: resolvedLevelId,
      score: 100,
      stars: 3,
      completedAt,
      highlight: "你已经会在不同乘车场景里准备好重要的安全装备。",
      caution: "进入考试前，再回想一次候车距离、安全带和头盔这三个重点。",
      aiSummary: "守护任务完成得很棒，你已经拥有更完整的出行防护意识。",
    };
  }

  function selectHotspot(hotspotId: string) {
    const hotspot = streetHotspots.find((item) => item.id === hotspotId);
    setSelectedHotspots((current) =>
      current.includes(hotspotId) ? current : [...current, hotspotId],
    );
    setHotspotMessage(hotspot?.success ?? "你已经找到一个安全关键点。");
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

    if (routeIndex === routeStepCards.length - 1) {
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

    if (taskId === sceneId) {
      const scene = guardianScenes.find((item) => item.id === sceneId);
      const nextSelected = [...selectedGuardianTasks, taskId];
      const nextScene = guardianScenes.find((item) => !nextSelected.includes(item.id));

      setSelectedGuardianTasks(nextSelected);
      setGuardianFeedback(scene?.successText ?? "安全装备已经放到正确位置。");
      setDraggedGuardianTaskId(null);

      if (nextScene) {
        setActiveGuardianSceneId(nextScene.id);
      }

      return;
    }

    setGuardianFeedback("这件装备和当前场景不匹配，换一个再试试。");
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
            [resolvedLevelId]: response.result ?? result,
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

  if (!isLevelId(levelId) || !currentLevel || !levelMeta) {
    return (
      <section className="surface-card student-level-empty">
        <strong>这张冒险地图还没准备好</strong>
        <p>先回到主题地图，重新选择要挑战的关卡吧。</p>
        <button
          type="button"
          className="primary-button primary-button--playful"
          onClick={() => navigate("/student/theme/road-safety")}
        >
          返回主题地图
        </button>
      </section>
    );
  }

  if (currentLevel.status === "locked") {
    return (
      <section className="surface-card student-level-empty">
        <strong>这一关还没有打开</strong>
        <p>先完成前一关，再回来继续闯关。</p>
        <button
          type="button"
          className="primary-button primary-button--playful"
          onClick={() => navigate("/student/theme/road-safety")}
        >
          返回主题地图
        </button>
      </section>
    );
  }

  return (
    <div className="page-stack student-page student-page--level">
      <StudentAdventureHero
        eyebrow={`第 ${levelOrderIndex + 1} 站`}
        title={levelMeta.title}
        description={levelMeta.description}
        bubbleTitle="本关目标"
        bubbleText={levelGuide.shortGoal}
        mascotLabel={`${currentTaskIndex}`}
        mascotHint={levelGuide.summary}
        variant="level"
        accent={accent}
        stats={[
          { label: "任务进度", value: `${currentTaskIndex}/${totalTaskCount}`, accent: "sky" },
          { label: "预计星级", value: `${previewStars} 星`, accent: "orange" },
          { label: "本关重点", value: levelMeta.focus, accent: "mint" },
        ]}
        actions={
          <>
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
            <button
              type="button"
              className="ghost-button"
              onClick={() => navigate("/student/theme/road-safety")}
            >
              回到地图
            </button>
          </>
        }
        aside={
          <div className="student-level-hero-meter">
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
            <p>{completionReady ? "已经可以提交啦" : "再完成一点点就能过关"}</p>
          </div>
        }
      />

      {syncError ? (
        <article className="feedback-box">
          <strong>学习提醒</strong>
          <p>{syncError}</p>
        </article>
      ) : null}

      <section className="student-level-hud">
        <article className="surface-card student-level-mission-board">
          <span className="section-block__eyebrow">本关任务板</span>
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
          eyebrow="AI 小提醒"
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

      {resolvedLevelId === "level-1" ? (
        <section className="student-level-stage student-level-stage--observe">
          <article className="surface-card student-level-scene-card">
            <div className="student-level-panel-heading">
              <div>
                <span className="section-block__eyebrow">主场景</span>
                <h2>在路口里找出安全关键点</h2>
              </div>
              <span className="surface-tag">
                {selectedHotspots.length} / {streetHotspots.length} 已点亮
              </span>
            </div>

            <div className="student-observe-scene">
              <div className="student-observe-scene__sky" />
              <div className="student-observe-scene__building student-observe-scene__building--left" />
              <div className="student-observe-scene__building student-observe-scene__building--right" />
              <div className="student-observe-scene__road" />
              <div className="student-observe-scene__crosswalk" />
              <div className="student-observe-scene__car" />
              <div className="student-observe-scene__tree" />

              {streetHotspots.map((hotspot) => {
                const isDone = selectedHotspots.includes(hotspot.id);

                return (
                  <button
                    key={hotspot.id}
                    type="button"
                    className={
                      isDone
                        ? "student-observe-hotspot student-observe-hotspot--done"
                        : "student-observe-hotspot"
                    }
                    style={{ top: hotspot.top, left: hotspot.left }}
                    onClick={() => selectHotspot(hotspot.id)}
                  >
                    <span>{hotspot.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="student-level-scene-tip">
              <strong>玩法</strong>
              <p>把四个热点都点亮，就能完成这一关。</p>
            </div>
          </article>

          <article className="surface-card student-level-side-card">
            <span className="section-block__eyebrow">观察结果</span>
            <h2>我已经发现了什么</h2>
            <p>{hotspotMessage || "先点击场景里的贴纸按钮，把四个关键点全部找出来。"}</p>
            <div className="student-level-badge-row">
              {streetHotspots.map((item) => (
                <span
                  key={item.id}
                  className={
                    selectedHotspots.includes(item.id)
                      ? "student-level-badge student-level-badge--done"
                      : "student-level-badge"
                  }
                >
                  {item.label}
                </span>
              ))}
            </div>
          </article>
        </section>
      ) : null}

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

            <div className="student-route-track">
              {routeStepCards.map((step, index) => {
                const choice = routeChoices.find((item) => item.stepId === step.id);
                const cardClass = choice
                  ? choice.safe
                    ? "student-route-node student-route-node--done"
                    : "student-route-node student-route-node--risk"
                  : index === routeIndex && !routeCompleted
                    ? "student-route-node student-route-node--current"
                    : "student-route-node";

                return (
                  <article key={step.id} className={cardClass}>
                    <span className="student-route-node__index">{index + 1}</span>
                    <div>
                      <strong>{step.title}</strong>
                      <p>{choice ? choice.selectedLabel : step.hint}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </article>

          <article className="surface-card student-route-choice-card">
            <span className="section-block__eyebrow">当前挑战</span>
            <h2>{routeCompleted ? "路线挑战完成" : routeStep.title}</h2>
            <p className="student-route-choice-card__scenario">
              {routeCompleted ? "你已经走完整条路线，可以提交本关了。" : routeStep.scenario}
            </p>

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
              <article className="student-level-scene-tip student-level-scene-tip--mint">
                <strong>刚才的反馈</strong>
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
                {completedGuardianCount} / {guardianScenes.length} 已完成
              </span>
            </div>

            <div className="student-guardian-step-row">
              {guardianScenes.map((scene) => {
                const isDone = selectedGuardianTasks.includes(scene.id);
                const isActive = activeGuardianSceneId === scene.id;

                return (
                  <button
                    key={scene.id}
                    type="button"
                    className={
                      isDone
                        ? "student-guardian-step student-guardian-step--done"
                        : isActive
                          ? "student-guardian-step student-guardian-step--active"
                          : "student-guardian-step"
                    }
                    onClick={() => setActiveGuardianSceneId(scene.id)}
                  >
                    <strong>{scene.title}</strong>
                    <span>{isDone ? "已完成" : isActive ? "进行中" : "等待中"}</span>
                  </button>
                );
              })}
            </div>

            <div className="student-guardian-stage">
              <div className="student-guardian-stage__scene">
                <span className="surface-tag">当前场景</span>
                <h3>{activeGuardianScene.title}</h3>
                <p>{activeGuardianScene.detail}</p>
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
                <strong>{activeGuardianScene.stageLabel}</strong>
                <span>
                  {selectedGuardianTasks.includes(activeGuardianScene.id)
                    ? "装备已经放好了"
                    : "把合适的装备拖进来，或点击下方道具卡"}
                </span>
              </div>
            </div>
          </article>

          <article className="surface-card student-guardian-tool-card-board">
            <span className="section-block__eyebrow">装备栏</span>
            <h2>选择合适的安全装备</h2>
            <div className="student-guardian-tool-grid">
              {guardianScenes.map((scene) => {
                const isDone = selectedGuardianTasks.includes(scene.id);
                const isDragging = draggedGuardianTaskId === scene.id;

                return (
                  <button
                    key={scene.id}
                    type="button"
                    draggable={!isDone}
                    className={
                      isDone
                        ? "student-guardian-tool student-guardian-tool--done"
                        : isDragging
                          ? "student-guardian-tool student-guardian-tool--dragging"
                          : "student-guardian-tool"
                    }
                    onDragStart={() => setDraggedGuardianTaskId(scene.id)}
                    onDragEnd={() => setDraggedGuardianTaskId(null)}
                    onClick={() => handleGuardianPlacement(scene.id, activeGuardianScene.id)}
                    disabled={isDone}
                  >
                    <strong>{scene.toolLabel}</strong>
                    <span>{scene.toolHint}</span>
                  </button>
                );
              })}
            </div>

            {guardianFeedback ? (
              <article className="student-level-scene-tip student-level-scene-tip--orange">
                <strong>场景反馈</strong>
                <p>{guardianFeedback}</p>
              </article>
            ) : null}
          </article>
        </section>
      ) : null}

      <section className="student-card-grid student-card-grid--two">
        <article className="surface-card student-level-rule-card">
          <span className="section-block__eyebrow">闯关规则</span>
          <h2>{levelGuide.shortGoal}</h2>
          <div className="student-level-mini-rules">
            <article className="student-level-mini-rules__card">
              <strong>这一关要做什么</strong>
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
            <strong>{levelMeta.duration}</strong>
          </div>
          <div className="student-level-reward-card__row">
            <span className="student-level-reward-card__token">下一步</span>
            <strong>{completionReady ? "可以去领奖励" : "继续完成任务"}</strong>
          </div>
        </article>
      </section>
    </div>
  );
}
