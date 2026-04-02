import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  guardianTasks,
  levelBlueprints,
  levelOneTasks,
  routeChallengeSteps,
} from "../../data/mockData";
import { useAppState } from "../../state/AppState";
import type { LevelId } from "../../types";

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

  function finishLevel() {
    completeLevel(activeLevelId);
    navigate("/student/theme/road-safety");
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
        <button
          type="button"
          className="ghost-button"
          onClick={() => navigate("/student/theme/road-safety")}
        >
          返回主题页
        </button>
      </section>

      {levelId === "level-1" ? (
        <section className="surface-card interaction-board">
          <div className="section-block__header">
            <div>
              <span className="section-block__eyebrow">热点点击任务</span>
              <h2>依次找出安全位置、交通标志和危险行为</h2>
            </div>
            <span className="surface-tag">
              {selectedHotspots.length}/{levelOneTasks.length} 已完成
            </span>
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
            <span className="surface-tag">安全值 {routeSafety} / 3</span>
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
            <span className="surface-tag">
              {selectedGuardianTasks.length}/{guardianTasks.length} 已完成
            </span>
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
