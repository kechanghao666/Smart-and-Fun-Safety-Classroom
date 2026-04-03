import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  guardianTasks,
  levelBlueprints,
  levelOneTasks,
  routeChallengeSteps,
} from "../../data/mockData";
import { ApiError } from "../../services/http";
import { completeStudentLevel, startStudentLevel } from "../../services/student";
import { useAppState } from "../../state/AppState";
import type { LevelId, LevelResult } from "../../types";
import { useStudentAiScene } from "../../utils/useStudentAiScene";

interface RouteChoiceLog {
  stepId: string;
  scenario: string;
  selectedLabel: string;
  safe: boolean;
}

interface StreetHotspot {
  id: string;
  task: string;
  label: string;
  note: string;
  top: string;
  left: string;
}

interface GuardianSceneConfig {
  id: string;
  title: string;
  detail: string;
  visualLabel: string;
  successText: string;
}

const streetHotspots: StreetHotspot[] = [
  {
    id: "crosswalk",
    task: levelOneTasks[0],
    label: "斑马线",
    note: "先找到适合安全通行的位置。",
    top: "66%",
    left: "24%",
  },
  {
    id: "signal-light",
    task: levelOneTasks[1],
    label: "信号灯",
    note: "观察当前灯色和车辆状态。",
    top: "22%",
    left: "48%",
  },
  {
    id: "danger-action",
    task: levelOneTasks[2],
    label: "危险行为",
    note: "识别翻越护栏的危险动作。",
    top: "48%",
    left: "74%",
  },
  {
    id: "road-sign",
    task: levelOneTasks[3],
    label: "交通标志",
    note: "注意和行人过街相关的提示牌。",
    top: "18%",
    left: "18%",
  },
];

const guardianScenes: GuardianSceneConfig[] = [
  {
    id: "bus-line",
    title: "公交候车区",
    detail: "把候车学生安排到安全候车线后方，避免贴近车门和道路边缘。",
    visualLabel: "候车黄线后方",
    successText: "你已经把候车位置放回安全区域，能避开车辆进站时的危险距离。",
  },
  {
    id: "seatbelt",
    title: "私家车上车前",
    detail: "出发前先确认乘客已经系好安全带，再准备启程。",
    visualLabel: "车内安全带卡扣区",
    successText: "很好，先系安全带再出发，才是正确的车内出行顺序。",
  },
  {
    id: "helmet",
    title: "电动车乘坐区",
    detail: "乘坐电动车前先戴好头盔，头部防护是最重要的一步。",
    visualLabel: "头盔佩戴区",
    successText: "头盔已经放到正确场景里了，出行前的防护准备更完整了。",
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
            : "关卡开始同步失败，当前仍可继续浏览本页内容。",
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

  const routeStep = routeChallengeSteps[routeIndex];
  const activeGuardianScene =
    guardianScenes.find((scene) => scene.id === activeGuardianSceneId) ?? guardianScenes[0];
  const completedGuardianCount = selectedGuardianTasks.length;

  const levelChecklist = useMemo(() => {
    if (resolvedLevelId === "level-1") {
      return streetHotspots.map((hotspot) => ({
        id: hotspot.id,
        label: hotspot.task,
        done: selectedHotspots.includes(hotspot.id),
        note: selectedHotspots.includes(hotspot.id) ? "已在场景中找到" : hotspot.note,
      }));
    }

    if (resolvedLevelId === "level-2") {
      return routeChallengeSteps.map((step, index) => {
        const choice = routeChoices.find((item) => item.stepId === step.id);

        return {
          id: step.id,
          label: `节点 ${index + 1}`,
          done: Boolean(choice),
          note: choice
            ? `${choice.safe ? "安全选择" : "风险选择"}：${choice.selectedLabel}`
            : "等待做出路线判断",
        };
      });
    }

    return guardianScenes.map((scene) => ({
      id: scene.id,
      label: scene.title,
      done: selectedGuardianTasks.includes(scene.id),
      note: selectedGuardianTasks.includes(scene.id) ? "安全准备已补齐" : scene.detail,
    }));
  }, [resolvedLevelId, routeChoices, selectedGuardianTasks, selectedHotspots]);

  const levelGuide = useMemo(() => {
    if (resolvedLevelId === "level-1") {
      return {
        title: "先看清，再点击关键位置",
        summary: `当前已完成 ${selectedHotspots.length} / ${streetHotspots.length} 个观察任务。`,
        rule: "先停下来，看清斑马线、信号灯、危险行为和交通标志，再做出过街选择。",
        reminder: "完成四个观察任务后，再提交本关结算。",
      };
    }

    if (resolvedLevelId === "level-2") {
      return {
        title: "沿路线一步一步做判断",
        summary: `当前安全值 ${routeSafety} / 3，已完成 ${routeChoices.length} / ${routeChallengeSteps.length} 个节点。`,
        rule: "看到绿灯也不能直接冲，要同时看灯、看车、看路、看盲区。",
        reminder: routeCompleted
          ? "所有节点都完成了，先回想刚才的判断，再提交本关。"
          : "每个节点都要先观察环境，再做出更稳妥的路线选择。",
      };
    }

    return {
      title: "把安全装备放回正确场景",
      summary: `当前已完成 ${completedGuardianCount} / ${guardianScenes.length} 个守护步骤。`,
      rule: "牢记候车距离、安全带和头盔三条核心规则，再完成本关的出行防护准备。",
      reminder: "三项准备全部完成后，系统会解锁主题考试入口。",
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
      `我正在进行${levelMeta?.title ?? "道路安全关卡"}，${levelGuide.summary}。请用儿童友好的语气告诉我这关最重要的安全原则，并提醒我现在最该做的下一步。`,
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
        ? Math.min(routeChoices.length + 1, routeChallengeSteps.length)
        : Math.min(completedGuardianCount + 1, guardianScenes.length);

  const totalTaskCount =
    resolvedLevelId === "level-1"
      ? streetHotspots.length
      : resolvedLevelId === "level-2"
        ? routeChallengeSteps.length
        : guardianScenes.length;

  const progressWidth =
    resolvedLevelId === "level-1"
      ? buildProgressValue(selectedHotspots.length, streetHotspots.length)
      : resolvedLevelId === "level-2"
        ? routeCompleted
          ? 100
          : buildProgressValue(routeChoices.length, routeChallengeSteps.length)
        : buildProgressValue(completedGuardianCount, guardianScenes.length);

  function buildLevelResult(): LevelResult {
    const completedAt = new Date().toLocaleString("zh-CN", { hour12: false });

    if (resolvedLevelId === "level-1") {
      return {
        levelId: resolvedLevelId,
        score: 100,
        stars: 3,
        completedAt,
        highlight: "你已经能在路口场景里主动识别斑马线、信号灯和危险行为。",
        caution: "下一关要把“认得出”进一步变成“会判断、会选择”。",
        aiSummary: "你观察得很仔细，继续保持这种先观察再行动的节奏。",
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
            ? "你能在关键节点里保持安全判断，没有被捷径和同伴影响带偏。"
            : "你顺利完成了路线挑战，已经建立了基础的放学回家安全意识。",
        caution:
          routeSafety >= 2
            ? "继续记住：看到绿灯时，也要同时看车、看路、看盲区。"
            : "后续要重点强化路口观察和大型车辆盲区判断，减少冒险通过。",
        aiSummary:
          routeSafety >= 2
            ? "你的路线选择很稳，已经能把规则应用到真实情境里了。"
            : "你完成了挑战，但下一次要更冷静地观察风险，再做决定。",
      };
    }

    return {
      levelId: resolvedLevelId,
      score: 100,
      stars: 3,
      completedAt,
      highlight: "你已经能在公交、私家车和电动车场景中补齐关键安全准备。",
      caution: "进入考试前，再回想一次头盔、安全带和候车距离这三个重点。",
      aiSummary: "你的守护任务完成得很棒，已经具备了更完整的出行防护意识。",
    };
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
            : "关卡完成同步失败，请稍后重试。",
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

  function selectHotspot(hotspotId: string) {
    setSelectedHotspots((current) =>
      current.includes(hotspotId) ? current : [...current, hotspotId],
    );
  }

  function handleRouteOptionSelect(option: (typeof routeChallengeSteps)[number]["options"][number]) {
    if (!option.safe) {
      setRouteSafety((current) => Math.max(0, current - 1));
    }

    setRouteChoices((current) => [
      ...current,
      {
        stepId: routeStep.id,
        scenario: routeStep.scenario,
        selectedLabel: option.label,
        safe: option.safe,
      },
    ]);
    setRouteFeedback(option.feedback);

    if (routeIndex === routeChallengeSteps.length - 1) {
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

      setSelectedGuardianTasks((current) => [...current, taskId]);
      setGuardianFeedback(scene?.successText ?? "安全准备已经放到正确位置。");
      setDraggedGuardianTaskId(null);

      const nextScene = guardianScenes.find(
        (item) => item.id !== sceneId && !selectedGuardianTasks.includes(item.id),
      );

      if (nextScene) {
        setActiveGuardianSceneId(nextScene.id);
      }

      return;
    }

    setGuardianFeedback("这件安全装备和当前场景不匹配，请再看看提示后重新尝试。");
    setDraggedGuardianTaskId(null);
  }

  if (!isLevelId(levelId) || !currentLevel || !levelMeta) {
    return (
      <section className="surface-card">
        <h2>未找到对应关卡</h2>
        <button
          type="button"
          className="primary-button"
          onClick={() => navigate("/student/theme/road-safety")}
        >
          返回主题页
        </button>
      </section>
    );
  }

  if (currentLevel.status === "locked") {
    return (
      <section className="surface-card">
        <h2>当前关卡尚未解锁</h2>
        <p>请先完成前一关，再回来继续学习。</p>
        <button
          type="button"
          className="primary-button"
          onClick={() => navigate("/student/theme/road-safety")}
        >
          返回主题页
        </button>
      </section>
    );
  }

  return (
    <div className="page-stack">
      <section className="surface-card level-status-bar">
        <div className="level-status-bar__meta">
          <span className="surface-tag">{levelMeta.focus}</span>
          <h1>{levelMeta.title}</h1>
          <p>{levelMeta.description}</p>
        </div>

        <div className="level-status-bar__summary">
          <div className="level-status-chip-group">
            <span className="surface-tag">第 {levelOrderIndex + 1} / 3 关</span>
            <span className="surface-tag">
              当前任务 {currentTaskIndex} / {totalTaskCount}
            </span>
          </div>
          <div className="star-preview">
            {[1, 2, 3].map((star) => (
              <span
                key={star}
                className={star <= previewStars ? "star-preview__item star-preview__item--on" : "star-preview__item"}
              >
                ★
              </span>
            ))}
          </div>
          <div className="progress-bar">
            <span className="progress-bar__fill" style={{ width: `${progressWidth}%` }} />
          </div>
          <div className="button-row">
            <button
              type="button"
              className="ghost-button"
              onClick={() => navigate("/student/theme/road-safety")}
            >
              返回主题页
            </button>
            <button
              type="button"
              className="primary-button"
              disabled={!completionReady || isFinishing}
              onClick={() => {
                void finishLevel();
              }}
            >
              {isFinishing ? "提交中..." : "完成本关"}
            </button>
          </div>
        </div>
      </section>

      {syncError ? (
        <article className="feedback-box">
          <strong>学习提醒</strong>
          <p>{syncError}</p>
        </article>
      ) : null}

      {resolvedLevelId === "level-1" ? (
        <section className="level-one-layout">
          <aside className="surface-card level-task-panel">
            <span className="section-block__eyebrow">左侧任务区</span>
            <h2>依次完成四个观察任务</h2>
            <ul className="task-checklist">
              {levelChecklist.map((item) => (
                <li
                  key={item.id}
                  className={
                    item.done
                      ? "task-checklist__item task-checklist__item--done"
                      : "task-checklist__item"
                  }
                >
                  <strong>{item.label}</strong>
                  <span>{item.note}</span>
                </li>
              ))}
            </ul>
            <article className="feedback-box">
              <strong>本关提示</strong>
              <p>{levelGuide.rule}</p>
            </article>
          </aside>

          <section className="surface-card level-scene-panel">
            <div className="section-block__header">
              <div>
                <span className="section-block__eyebrow">中部场景区</span>
                <h2>点击场景中的安全关键点</h2>
              </div>
            </div>

            <div className="street-scene">
              <div className="street-scene__sky" />
              <div className="street-scene__building street-scene__building--left" />
              <div className="street-scene__building street-scene__building--right" />
              <div className="street-scene__road" />
              <div className="street-scene__crosswalk" />
              {streetHotspots.map((hotspot) => {
                const isDone = selectedHotspots.includes(hotspot.id);

                return (
                  <button
                    key={hotspot.id}
                    type="button"
                    className={isDone ? "scene-hotspot scene-hotspot--done" : "scene-hotspot"}
                    style={{ top: hotspot.top, left: hotspot.left }}
                    onClick={() => selectHotspot(hotspot.id)}
                  >
                    {hotspot.label}
                  </button>
                );
              })}
            </div>

            <p className="inline-tip">
              点击斑马线、信号灯、危险行为和交通标志四个热点，完成后即可提交本关。
            </p>
          </section>
        </section>
      ) : null}

      {resolvedLevelId === "level-2" ? (
        <>
          <section className="surface-card route-map-panel">
            <div className="section-block__header">
              <div>
                <span className="section-block__eyebrow">地图主视图</span>
                <h2>沿着放学路线推进关键节点</h2>
              </div>
              <span className="surface-tag">安全值 {routeSafety} / 3</span>
            </div>

            <div className="route-map">
              {routeChallengeSteps.map((step, index) => {
                const choice = routeChoices.find((item) => item.stepId === step.id);
                const nodeClass = choice
                  ? choice.safe
                    ? "route-node route-node--done"
                    : "route-node route-node--risk"
                  : index === routeIndex && !routeCompleted
                    ? "route-node route-node--current"
                    : "route-node";

                return (
                  <div key={step.id} className={nodeClass}>
                    <span className="route-node__circle">{index + 1}</span>
                    <div className="route-node__content">
                      <strong>路线节点 {index + 1}</strong>
                      <p>{choice ? choice.selectedLabel : "等待判断"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="surface-card route-event-card">
            <div className="section-block__header">
              <div>
                <span className="section-block__eyebrow">底部事件卡</span>
                <h2>{routeCompleted ? "路线挑战已完成" : `节点 ${routeIndex + 1}`}</h2>
              </div>
            </div>

            {!routeCompleted ? (
              <>
                <article className="feedback-box">
                  <strong>当前情境</strong>
                  <p>{routeStep.scenario}</p>
                </article>

                <div className="option-grid">
                  {routeStep.options.map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      className="option-card"
                      onClick={() => handleRouteOptionSelect(option)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <article className="feedback-box">
                <strong>路线挑战已完成</strong>
                <p>你已经走完全部路线节点，可以先回想每一步的判断，再提交本关。</p>
              </article>
            )}

            {routeFeedback ? (
              <article className="feedback-box">
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
                className="primary-button"
                disabled={!completionReady || isFinishing}
                onClick={() => {
                  void finishLevel();
                }}
              >
                {isFinishing ? "提交中..." : "完成本关"}
              </button>
            </div>
          </section>
        </>
      ) : null}

      {resolvedLevelId === "level-3" ? (
        <>
          <section className="surface-card guardian-scene-card">
            <div className="section-block__header">
              <div>
                <span className="section-block__eyebrow">顶部步骤状态栏</span>
                <h2>按顺序完成三种出行防护准备</h2>
              </div>
            </div>

            <div className="guardian-step-strip">
              {guardianScenes.map((scene) => {
                const isDone = selectedGuardianTasks.includes(scene.id);
                const isActive = activeGuardianSceneId === scene.id;

                return (
                  <button
                    key={scene.id}
                    type="button"
                    className={
                      isDone
                        ? "guardian-step guardian-step--done"
                        : isActive
                          ? "guardian-step guardian-step--active"
                          : "guardian-step"
                    }
                    onClick={() => setActiveGuardianSceneId(scene.id)}
                  >
                    <strong>{scene.title}</strong>
                    <span>{isDone ? "已完成" : isActive ? "进行中" : "待完成"}</span>
                  </button>
                );
              })}
            </div>

            <div className="guardian-scene-stage">
              <span className="surface-tag">中部主场景</span>
              <h3>{activeGuardianScene.title}</h3>
              <p>{activeGuardianScene.detail}</p>
              <div
                className={
                  selectedGuardianTasks.includes(activeGuardianScene.id)
                    ? "guardian-drop-zone guardian-drop-zone--done"
                    : draggedGuardianTaskId
                      ? "guardian-drop-zone guardian-drop-zone--ready"
                      : "guardian-drop-zone"
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
                {selectedGuardianTasks.includes(activeGuardianScene.id) ? (
                  <div className="guardian-drop-zone__result">
                    <strong>{activeGuardianScene.visualLabel}</strong>
                    <span>安全准备已就位</span>
                  </div>
                ) : (
                  <div className="guardian-drop-zone__result">
                    <strong>{activeGuardianScene.visualLabel}</strong>
                    <span>把正确的安全装备拖入这里，或在下方点击“放入当前场景”。</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="surface-card guardian-inventory-panel">
            <div className="section-block__header">
              <div>
                <span className="section-block__eyebrow">底部操作区</span>
                <h2>拖动或点击安全装备，放入当前场景</h2>
              </div>
            </div>

            <div className="guardian-inventory">
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
                        ? "guardian-tool-card guardian-tool-card--done"
                        : isDragging
                          ? "guardian-tool-card guardian-tool-card--dragging"
                          : "guardian-tool-card"
                    }
                    onDragStart={() => setDraggedGuardianTaskId(scene.id)}
                    onDragEnd={() => setDraggedGuardianTaskId(null)}
                    onClick={() => handleGuardianPlacement(scene.id, activeGuardianScene.id)}
                    disabled={isDone}
                  >
                    <strong>{scene.title}</strong>
                    <span>{guardianTasks.find((task) => task.id === scene.id)?.hint ?? scene.detail}</span>
                  </button>
                );
              })}
            </div>

            {guardianFeedback ? (
              <article className="feedback-box">
                <strong>场景反馈</strong>
                <p>{guardianFeedback}</p>
              </article>
            ) : null}
          </section>
        </>
      ) : null}

      <section className="card-grid card-grid--two">
        <article className="surface-card level-support-card">
          <span className="section-block__eyebrow">关键规则</span>
          <h2>{levelGuide.title}</h2>
          <p>{levelGuide.summary}</p>
          <ul className="plain-list">
            <li>{levelGuide.rule}</li>
            <li>{levelGuide.reminder}</li>
          </ul>
        </article>

        <article className="surface-card ai-insight-card">
          <div className="row-between">
            <div>
              <span className="section-block__eyebrow">AI 关卡提示</span>
              <h2>卡住时先看这里</h2>
            </div>
            <span className="surface-tag">
              {isHintLoading ? "生成中" : state.authSource === "api" ? "AI 实时提示" : "AI 学习提示"}
            </span>
          </div>
          <p className="ai-insight-card__message">
            {isHintLoading ? "AI 正在整理本关提示..." : hintMessage}
          </p>
          {hintNotice ? <p className="inline-note">{hintNotice}</p> : null}
          <div className="button-row">
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                void refreshHint();
              }}
              disabled={isHintLoading}
            >
              {isHintLoading ? "生成中..." : "刷新提示"}
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => navigate("/student/ai")}
            >
              去 AI 问答
            </button>
          </div>
        </article>
      </section>
    </div>
  );
}
