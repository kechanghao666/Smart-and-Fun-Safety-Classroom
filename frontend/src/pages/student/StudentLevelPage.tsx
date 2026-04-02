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

function isLevelId(value: string | undefined): value is LevelId {
  return value === "level-1" || value === "level-2" || value === "level-3";
}

export function StudentLevelPage() {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const { completeLevel, markLevelInProgress, replaceProgress, state } = useAppState();
  const [syncError, setSyncError] = useState("");
  const [isFinishing, setIsFinishing] = useState(false);
  const startRequestRef = useRef<LevelId | null>(null);
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);

  const currentLevel = useMemo(
    () => state.progress.levels.find((level) => level.id === levelId),
    [levelId, state.progress.levels],
  );

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

  const levelMeta = levelBlueprints.find((level) => level.id === levelId);
  const [selectedHotspots, setSelectedHotspots] = useState<string[]>([]);
  const [routeIndex, setRouteIndex] = useState(0);
  const [routeSafety, setRouteSafety] = useState(3);
  const [routeFeedback, setRouteFeedback] = useState<string | null>(null);
  const [routeCompleted, setRouteCompleted] = useState(false);
  const [routeChoices, setRouteChoices] = useState<RouteChoiceLog[]>([]);
  const [selectedGuardianTasks, setSelectedGuardianTasks] = useState<string[]>([]);

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

  const activeLevelId = currentLevel.id;

  useEffect(() => {
    setSelectedHotspots([]);
    setRouteIndex(0);
    setRouteSafety(3);
    setRouteFeedback(null);
    setRouteCompleted(false);
    setRouteChoices([]);
    setSelectedGuardianTasks([]);
  }, [activeLevelId]);

  function buildLevelResult(): LevelResult {
    const completedAt = new Date().toLocaleString("zh-CN", { hour12: false });

    if (activeLevelId === "level-1") {
      return {
        levelId: activeLevelId,
        score: 100,
        stars: 3,
        completedAt,
        highlight: "你已经能在路口场景中主动识别斑马线、信号灯和危险行为。",
        caution: "下一关要把“认得出”进一步变成“会判断、会选择”。",
        aiSummary: "你观察得很仔细，继续保持这种先观察再行动的节奏。",
      };
    }

    if (activeLevelId === "level-2") {
      const scoreMap: Record<number, number> = {
        3: 100,
        2: 88,
        1: 76,
        0: 60,
      };
      const stars = routeSafety >= 3 ? 3 : routeSafety === 2 ? 2 : 1;

      return {
        levelId: activeLevelId,
        score: scoreMap[routeSafety] ?? 60,
        stars,
        completedAt,
        highlight:
          routeSafety >= 2
            ? "你能在关键节点里保持安全判断，没有被捷径和同伴影响带偏。"
            : "你顺利完成了路线挑战，已经建立了基本的放学回家安全意识。",
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
      levelId: activeLevelId,
      score: 100,
      stars: 3,
      completedAt,
      highlight: "你已经能在公交车、私家车和电动车场景中补齐关键安全准备。",
      caution: "进入考试前，再回顾一次头盔、安全带和候车距离这三个重点。",
      aiSummary: "你的守护任务完成得很棒，已经具备了更完整的出行防护意识。",
    };
  }

  async function finishLevel() {
    const result = buildLevelResult();
    if (canUseApi && state.authToken) {
      setIsFinishing(true);
      setSyncError("");

      try {
        const response = await completeStudentLevel(state.authToken, activeLevelId);
        replaceProgress({
          ...response.progress,
          levelResults: {
            ...response.progress.levelResults,
            [activeLevelId]: response.result ?? result,
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
      navigate(`/student/theme/road-safety/level/${activeLevelId}/result`);
      return;
    }

    completeLevel(activeLevelId, result);
    navigate(`/student/theme/road-safety/level/${activeLevelId}/result`);
  }

  const routeStep = routeChallengeSteps[routeIndex];
  const levelChecklist = useMemo(() => {
    if (activeLevelId === "level-1") {
      return levelOneTasks.map((task) => ({
        id: task,
        label: task,
        done: selectedHotspots.includes(task),
        note: selectedHotspots.includes(task) ? "已完成识别" : "等待点击场景热点",
      }));
    }

    if (activeLevelId === "level-2") {
      return routeChallengeSteps.map((step) => {
        const choice = routeChoices.find((item) => item.stepId === step.id);

        return {
          id: step.id,
          label: `节点 ${routeChallengeSteps.findIndex((item) => item.id === step.id) + 1}`,
          done: Boolean(choice),
          note: choice
            ? `${choice.safe ? "安全选择" : "风险选择"}：${choice.selectedLabel}`
            : "等待做出路线判断",
        };
      });
    }

    return guardianTasks.map((task) => ({
      id: task.id,
      label: task.label,
      done: selectedGuardianTasks.includes(task.id),
      note: selectedGuardianTasks.includes(task.id) ? "已补齐安全准备" : task.hint,
    }));
  }, [activeLevelId, routeChoices, selectedGuardianTasks, selectedHotspots]);
  const levelGuide = useMemo(() => {
    if (activeLevelId === "level-1") {
      return {
        title: "先观察，再点击关键点",
        summary: `当前已完成 ${selectedHotspots.length} / ${levelOneTasks.length} 个观察任务。`,
        rule: "这关最重要的是先停下来，看清楚斑马线、信号灯和危险行为，再做选择。",
        reminder: "做完四个观察任务后，再提交本关结算。",
      };
    }

    if (activeLevelId === "level-2") {
      return {
        title: "沿路线一步一步判断",
        summary: `当前安全值 ${routeSafety} / 3，已完成 ${routeChoices.length} / ${routeChallengeSteps.length} 个节点。`,
        rule: "看到绿灯也不能直接冲，要同时看灯、看车、看路、看盲区。",
        reminder: routeCompleted
          ? "所有节点都完成了，先回顾刚才的判断，再提交本关。"
          : "每个节点都要先观察环境，再做出更稳的路线选择。",
      };
    }

    return {
      title: "给每个场景补齐安全准备",
      summary: `当前已完成 ${selectedGuardianTasks.length} / ${guardianTasks.length} 个守护任务。`,
      rule: "这关最重要的是记住安全带、头盔和候车距离三条核心规则。",
      reminder: "所有守护任务完成后，系统会解锁本主题的考试入口。",
    };
  }, [activeLevelId, routeChoices.length, routeCompleted, routeSafety, selectedGuardianTasks.length, selectedHotspots.length]);
  const levelHintPrompt = useMemo(
    () =>
      `我正在进行${levelMeta.title}，${levelGuide.summary}。请用儿童友好的语气告诉我这关最重要的安全原则，并提醒我现在最该做的下一步。`,
    [levelGuide.summary, levelMeta.title],
  );
  const {
    isLoading: isHintLoading,
    message: hintMessage,
    notice: hintNotice,
    refresh: refreshHint,
  } = useStudentAiScene({
    prompt: levelHintPrompt,
    scene: "hint",
    levelId: activeLevelId,
    fallbackText: levelGuide.rule,
  });
  const completionReady =
    activeLevelId === "level-1"
      ? selectedHotspots.length === levelOneTasks.length
      : activeLevelId === "level-2"
        ? routeCompleted && routeSafety > 0
        : selectedGuardianTasks.length === guardianTasks.length;
  const completionLabel =
    activeLevelId === "level-2" ? "完成路线挑战并保持安全值大于 0" : "完成全部任务后即可提交";

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--level">
        <div>
          <span className="hero-banner__eyebrow">{levelMeta.focus}</span>
          <h1>{levelMeta.title}</h1>
          <p>{levelMeta.description}</p>
        </div>
        <div className="level-status-panel">
          <span className="surface-tag">关卡进度</span>
          <strong>
            {state.progress.levels.findIndex((level) => level.id === activeLevelId) + 1} / 3
          </strong>
          <button
            type="button"
            className="ghost-button"
            onClick={() => navigate("/student/theme/road-safety")}
          >
            返回主题页
          </button>
        </div>
      </section>

      {syncError ? (
        <article className="feedback-box">
          <strong>同步提醒</strong>
          <p>{syncError}</p>
        </article>
      ) : null}

      <section className="level-layout">
        {levelId === "level-1" ? (
          <section className="surface-card interaction-board">
            <div className="section-block__header">
              <div>
                <span className="section-block__eyebrow">热点点击任务</span>
                <h2>依次找出安全位置、交通标志和危险行为</h2>
              </div>
              <div className="level-progress-box">
                <span className="surface-tag">
                  {selectedHotspots.length}/{levelOneTasks.length} 已完成
                </span>
                <div className="progress-bar">
                  <span
                    className="progress-bar__fill"
                    style={{ width: `${(selectedHotspots.length / levelOneTasks.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <article className="feedback-box">
              <strong>本关提示</strong>
              <p>先按“看斑马线、看信号灯、看危险行为、看交通标志”的顺序完成观察，再提交本关。</p>
            </article>

            <div className="task-grid">
              {levelOneTasks.map((task) => {
                const isDone = selectedHotspots.includes(task);
                return (
                  <button
                    key={task}
                    type="button"
                    className={isDone ? "task-button task-button--done" : "task-button"}
                    onClick={() =>
                      setSelectedHotspots((current) =>
                        current.includes(task) ? current : [...current, task],
                      )
                    }
                  >
                    {task}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="primary-button"
              disabled={!completionReady}
              onClick={() => {
                void finishLevel();
              }}
            >
              {isFinishing ? "提交中..." : "完成本关"}
            </button>
          </section>
        ) : null}

        {levelId === "level-2" ? (
          <section className="surface-card interaction-board">
            <div className="section-block__header">
              <div>
                <span className="section-block__eyebrow">路线推进</span>
                <h2>在关键路口做出更安全的选择</h2>
              </div>
              <div className="level-progress-box">
                <span className="surface-tag">安全值 {routeSafety} / 3</span>
                <div className="progress-bar">
                  <span
                    className="progress-bar__fill progress-bar__fill--orange"
                    style={{
                      width: `${
                        routeCompleted
                          ? 100
                          : (routeIndex / routeChallengeSteps.length) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {!routeCompleted ? (
              <>
                <article className="route-scenario">
                  <h3>节点 {routeIndex + 1}</h3>
                  <p>{routeStep.scenario}</p>
                </article>

                <div className="option-grid">
                  {routeStep.options.map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      className="option-card"
                      onClick={() => {
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
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <article className="route-summary">
                <h3>路线挑战已完成</h3>
                <p>你已顺利完成全部路线节点判断，请回顾关键安全原则后完成本关。</p>
              </article>
            )}

            {routeFeedback ? (
              <article className="feedback-box">
                <strong>刚才的反馈</strong>
                <p>{routeFeedback}</p>
              </article>
            ) : null}

            <div className="button-row">
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  setRouteIndex(0);
                  setRouteSafety(3);
                  setRouteFeedback(null);
                  setRouteCompleted(false);
                  setRouteChoices([]);
                }}
              >
                重新挑战
              </button>
              <button
                type="button"
                className="primary-button"
                disabled={!completionReady}
                onClick={() => {
                  void finishLevel();
                }}
              >
                {isFinishing ? "提交中..." : "完成本关"}
              </button>
            </div>
          </section>
        ) : null}

        {levelId === "level-3" ? (
          <section className="surface-card interaction-board">
            <div className="section-block__header">
              <div>
                <span className="section-block__eyebrow">守护任务</span>
                <h2>帮不同场景中的角色补齐安全准备</h2>
              </div>
              <div className="level-progress-box">
                <span className="surface-tag">
                  {selectedGuardianTasks.length}/{guardianTasks.length} 已完成
                </span>
                <div className="progress-bar">
                  <span
                    className="progress-bar__fill progress-bar__fill--mint"
                    style={{
                      width: `${(selectedGuardianTasks.length / guardianTasks.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <article className="feedback-box">
              <strong>本关提示</strong>
              <p>依次确认候车距离、安全带和头盔这三项准备，全部补齐后再提交本关。</p>
            </article>

            <div className="task-grid">
              {guardianTasks.map((task) => {
                const selected = selectedGuardianTasks.includes(task.id);
                return (
                  <button
                    key={task.id}
                    type="button"
                    className={selected ? "task-button task-button--done" : "task-button"}
                    onClick={() =>
                      setSelectedGuardianTasks((current) =>
                        current.includes(task.id) ? current : [...current, task.id],
                      )
                    }
                  >
                    <strong>{task.label}</strong>
                    <span>{task.hint}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="primary-button"
              disabled={!completionReady}
              onClick={() => {
                void finishLevel();
              }}
            >
              {isFinishing ? "提交中..." : "完成本关"}
            </button>
          </section>
        ) : null}

        <aside className="page-stack">
          <article className="surface-card level-support-card">
            <span className="section-block__eyebrow">任务清单</span>
            <h2>{levelGuide.title}</h2>
            <p>{levelGuide.summary}</p>
            <ul className="level-checklist">
              {levelChecklist.map((item) => (
                <li key={item.id} className={item.done ? "level-checklist__item level-checklist__item--done" : "level-checklist__item"}>
                  <strong>{item.label}</strong>
                  <span>{item.note}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="surface-card level-support-card">
            <span className="section-block__eyebrow">关键规则</span>
            <h2>完成前再看一眼</h2>
            <p>{levelGuide.rule}</p>
            <ul className="plain-list">
              <li>{levelGuide.reminder}</li>
              <li>完成条件：{completionLabel}</li>
            </ul>
          </article>

          <article className="surface-card ai-insight-card">
            <div className="row-between">
              <div>
                <span className="section-block__eyebrow">AI 关卡提示</span>
                <h2>卡住时先看这里</h2>
              </div>
              <span className="surface-tag">
                {isHintLoading ? "生成中" : state.authSource === "api" ? "AI 已联调" : "本地提示"}
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
        </aside>
      </section>
    </div>
  );
}
