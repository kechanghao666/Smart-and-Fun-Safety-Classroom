import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppState } from "../../state/AppState";
import type { LevelId } from "../../types";

const levelSequence: LevelId[] = ["level-1", "level-2", "level-3"];

function isLevelId(value: string | undefined): value is LevelId {
  return value === "level-1" || value === "level-2" || value === "level-3";
}

export function StudentLevelResultPage() {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const { state } = useAppState();
  const [showExamUnlock, setShowExamUnlock] = useState(
    levelId === "level-3" && state.progress.exam.status === "available",
  );

  const result = useMemo(() => {
    if (!isLevelId(levelId)) {
      return null;
    }

    return state.progress.levelResults[levelId];
  }, [levelId, state.progress.levelResults]);
  const nextLevel = useMemo(() => {
    if (!isLevelId(levelId)) {
      return null;
    }

    const currentIndex = levelSequence.indexOf(levelId);
    const nextLevelId = levelSequence[currentIndex + 1];

    if (!nextLevelId) {
      return null;
    }

    return state.progress.levels.find((level) => level.id === nextLevelId) ?? null;
  }, [levelId, state.progress.levels]);
  const nextLevelRoute =
    nextLevel?.status === "completed" && state.progress.levelResults[nextLevel.id]
      ? `/student/theme/road-safety/level/${nextLevel.id}/result`
      : nextLevel && nextLevel.status !== "locked"
        ? `/student/theme/road-safety/level/${nextLevel.id}`
        : null;
  const nextLevelLabel =
    nextLevel?.status === "completed" && state.progress.levelResults[nextLevel.id]
      ? "查看下一关结算"
      : "继续下一关";

  if (!isLevelId(levelId) || !result) {
    return (
      <section className="surface-card">
        <h2>暂未找到本关结算结果</h2>
        <p>请先完成当前关卡后，再查看独立结算页。</p>
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
      <section className="hero-banner hero-banner--report">
        <div>
          <span className="hero-banner__eyebrow">关卡结算页</span>
          <h1>本关已完成，来看看你的通关反馈</h1>
          <p>{result.aiSummary}</p>
        </div>
        <div className="result-medal">
          <strong>{result.stars} 星</strong>
          <span>{result.score} 分</span>
        </div>
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card result-card">
          <span className="section-block__eyebrow">本关表现</span>
          <h2>完成评价</h2>
          <ul className="plain-list">
            <li>本关得分：{result.score}</li>
            <li>获得星级：{result.stars} 星</li>
            <li>完成时间：{result.completedAt}</li>
          </ul>
        </article>

        <article className="surface-card result-card">
          <span className="section-block__eyebrow">做得好的地方</span>
          <h2>关键亮点</h2>
          <p>{result.highlight}</p>
        </article>

        <article className="surface-card result-card">
          <span className="section-block__eyebrow">需要注意</span>
          <h2>下一步提醒</h2>
          <p>{result.caution}</p>
        </article>

        <article className="surface-card result-card">
          <span className="section-block__eyebrow">获得奖励</span>
          <h2>积分与徽章</h2>
          <ul className="plain-list">
            <li>当前积分：{state.progress.points}</li>
            <li>已获徽章：{state.progress.badges.join(" / ")}</li>
          </ul>
        </article>
      </section>

      <div className="button-row">
        {levelId !== "level-3" && nextLevelRoute ? (
          <button
            type="button"
            className="primary-button"
            onClick={() => navigate(nextLevelRoute)}
          >
            {nextLevelLabel}
          </button>
        ) : (
          <button
            type="button"
            className="primary-button"
            onClick={() => navigate("/student/theme/road-safety")}
          >
            返回主题页
          </button>
        )}

        <button
          type="button"
          className="ghost-button"
          onClick={() => navigate("/student/theme/road-safety")}
        >
          稍后再看
        </button>
      </div>

      {showExamUnlock ? (
        <section className="result-modal-backdrop">
          <article className="surface-card result-modal">
            <span className="section-block__eyebrow">主题考试已解锁</span>
            <h2>三关闯关学习已完成</h2>
            <p>你已经完成道路安全主题的三关学习，现在可以进入主题考试巩固知识点。</p>
            <div className="button-row">
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  setShowExamUnlock(false);
                  navigate("/student/theme/road-safety");
                }}
              >
                稍后去完成
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => navigate("/student/theme/road-safety/exam")}
              >
                立即进入
              </button>
            </div>
          </article>
        </section>
      ) : null}
    </div>
  );
}
