import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  guardianTasks,
  levelBlueprints,
  levelOneTasks,
  routeChallengeSteps,
} from "../../data/mockData";
import { useAppState } from "../../state/AppState";
import type { LevelId, LevelResult } from "../../types";

function isLevelId(value: string | undefined): value is LevelId {
  return value === "level-1" || value === "level-2" || value === "level-3";
}

export function StudentLevelPage() {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const { completeLevel, markLevelInProgress, state } = useAppState();

  const currentLevel = useMemo(
    () => state.progress.levels.find((level) => level.id === levelId),
    [levelId, state.progress.levels],
  );

  useEffect(() => {
    if (isLevelId(levelId) && currentLevel?.status === "available") {
      markLevelInProgress(levelId);
    }
  }, [currentLevel?.status, levelId, markLevelInProgress]);

  const levelMeta = levelBlueprints.find((level) => level.id === levelId);
  const [selectedHotspots, setSelectedHotspots] = useState<string[]>([]);
  const [routeIndex, setRouteIndex] = useState(0);
  const [routeSafety, setRouteSafety] = useState(3);
  const [routeFeedback, setRouteFeedback] = useState<string | null>(null);
  const [routeCompleted, setRouteCompleted] = useState(false);
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

  function finishLevel() {
    const result = buildLevelResult();
    completeLevel(activeLevelId, result);
    navigate(`/student/theme/road-safety/level/${activeLevelId}/result`);
  }

  const routeStep = routeChallengeSteps[routeIndex];

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
            disabled={selectedHotspots.length !== levelOneTasks.length}
            onClick={finishLevel}
          >
            完成本关
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

          {routeFeedback ? <p className="feedback-box">{routeFeedback}</p> : null}

          <div className="button-row">
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                setRouteIndex(0);
                setRouteSafety(3);
                setRouteFeedback(null);
                setRouteCompleted(false);
              }}
            >
              重新挑战
            </button>
            <button
              type="button"
              className="primary-button"
              disabled={!routeCompleted || routeSafety <= 0}
              onClick={finishLevel}
            >
              完成本关
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
            disabled={selectedGuardianTasks.length !== guardianTasks.length}
            onClick={finishLevel}
          >
            完成本关
          </button>
        </section>
      ) : null}
    </div>
  );
}
