import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { StudentAdventureHero } from "../../components/student/StudentAdventureHero";
import { useAppState } from "../../state/AppState";
import type { LevelId } from "../../types";

const levelSequence: LevelId[] = ["level-1", "level-2", "level-3"];
const levelLabels: Record<LevelId, string> = {
  "level-1": "第一关",
  "level-2": "第二关",
  "level-3": "第三关",
};
const levelThemes: Record<LevelId, string> = {
  "level-1": "观察识别",
  "level-2": "路线判断",
  "level-3": "操作守护",
};

function isLevelId(value: string | undefined): value is LevelId {
  return value === "level-1" || value === "level-2" || value === "level-3";
}

export function StudentLevelResultPage() {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const { state } = useAppState();
  const resolvedLevelId: LevelId = isLevelId(levelId) ? levelId : "level-1";
  const result = state.progress.levelResults[resolvedLevelId];
  const [showExamUnlock, setShowExamUnlock] = useState(
    resolvedLevelId === "level-3" && state.progress.exam.status === "available",
  );

  const nextLevel = useMemo(() => {
    const currentIndex = levelSequence.indexOf(resolvedLevelId);
    const nextLevelId = levelSequence[currentIndex + 1];

    if (!nextLevelId) {
      return null;
    }

    return state.progress.levels.find((level) => level.id === nextLevelId) ?? null;
  }, [resolvedLevelId, state.progress.levels]);

  if (!result) {
    return (
      <section className="surface-card empty-state-card">
        <span className="section-block__eyebrow">关卡结算</span>
        <h2>这关还没有完成记录</h2>
        <button
          type="button"
          className="primary-button"
          onClick={() => navigate(`/student/theme/road-safety/level/${resolvedLevelId}`)}
        >
          进入当前关卡
        </button>
      </section>
    );
  }

  const nextRoute =
    nextLevel?.status === "completed"
      ? `/student/theme/road-safety/level/${nextLevel.id}/result`
      : nextLevel?.status && nextLevel.status !== "locked"
        ? `/student/theme/road-safety/level/${nextLevel.id}`
        : null;

  return (
    <div className="page-stack student-page student-page--result">
      <StudentAdventureHero
        eyebrow={`${levelLabels[resolvedLevelId]} · 独立结算页`}
        title={`${levelThemes[resolvedLevelId]}完成啦`}
        description="这一关的表现已经单独结算好了，你可以继续下一关，也可以马上重新挑战本关。"
        bubbleTitle="AI 鼓励"
        bubbleText={result.aiSummary}
        mascotLabel={`${result.stars}★`}
        mascotHint={result.highlight}
        variant="result"
        accent={resolvedLevelId === "level-3" ? "orange" : resolvedLevelId === "level-2" ? "mint" : "sky"}
        stats={[
          { label: "通关得分", value: `${result.score} 分`, accent: "sky" },
          { label: "星级", value: `${result.stars} 星`, accent: "orange" },
          { label: "奖励", value: result.rewardLabel ?? "本关奖励", accent: "mint" },
        ]}
        actions={
          <>
            {nextRoute ? (
              <button
                type="button"
                className="primary-button primary-button--playful"
                onClick={() => navigate(nextRoute)}
              >
                继续下一关
              </button>
            ) : (
              <button
                type="button"
                className="primary-button primary-button--playful"
                onClick={() =>
                  navigate(
                    state.progress.exam.status === "available"
                      ? "/student/theme/road-safety/exam"
                      : "/student/theme/road-safety",
                  )
                }
              >
                {state.progress.exam.status === "available" ? "进入主题考试" : "返回主题页"}
              </button>
            )}
            <button
              type="button"
              className="ghost-button"
              onClick={() => navigate(`/student/theme/road-safety/level/${resolvedLevelId}`)}
            >
              重新挑战本关
            </button>
          </>
        }
      />

      <section className="surface-card student-result-storyboard">
        <div className="student-section-heading">
          <span className="section-block__eyebrow">关卡进度</span>
          <h2>三关闯关学习现在走到哪里了</h2>
        </div>
        <div className="student-result-track">
          {levelSequence.map((item, index) => {
            const isCurrent = item === resolvedLevelId;
            const isDone = Boolean(state.progress.levelResults[item]);

            return (
              <article
                key={item}
                className={
                  isCurrent
                    ? "student-result-track__node student-result-track__node--current"
                    : isDone
                      ? "student-result-track__node student-result-track__node--done"
                      : "student-result-track__node"
                }
              >
                <span className="student-result-track__index">{index + 1}</span>
                <strong>{levelLabels[item]}</strong>
                <p>{levelThemes[item]}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="student-card-grid student-card-grid--three">
        <article className="surface-card student-celebration-card student-celebration-card--sky">
          <span className="student-celebration-card__eyebrow">奖励图标</span>
          <strong className="student-result-reward-icon">{result.rewardIcon ?? "🎁"}</strong>
          <p>{result.rewardLabel ?? "本关奖励"}</p>
        </article>
        <article className="surface-card student-celebration-card student-celebration-card--mint">
          <span className="student-celebration-card__eyebrow">这次做得好</span>
          <strong>{result.highlight}</strong>
          <p>把这几个安全点继续保持下去，就能更稳地推进后续挑战。</p>
        </article>
        <article className="surface-card student-celebration-card student-celebration-card--orange">
          <span className="student-celebration-card__eyebrow">下次要注意</span>
          <strong>{result.caution}</strong>
          <p>重新挑战时可以重点盯住这些地方，把表现再往上提一档。</p>
        </article>
      </section>

      <section className="student-card-grid student-card-grid--two">
        <article className="surface-card student-reward-board">
          <div className="student-section-heading">
            <span className="section-block__eyebrow">关键安全点</span>
            <h2>这关真正学会了什么</h2>
          </div>
          <div className="student-checklist">
            {(result.keySafetyPoints ?? []).map((item) => (
              <div key={item} className="student-checklist__item">
                <span className="student-checklist__dot" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-card student-reward-board">
          <div className="student-section-heading">
            <span className="section-block__eyebrow">需要注意</span>
            <h2>下次重玩先盯住这些点</h2>
          </div>
          <div className="student-checklist">
            {(result.cautionPoints ?? [result.caution]).map((item) => (
              <div key={item} className="student-checklist__item">
                <span className="student-checklist__dot" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="surface-card student-level-replay-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">结算后的操作</span>
            <h2>继续下一关、回主题页，或者直接重玩</h2>
          </div>
          <span className="surface-tag">积分 {state.progress.points}</span>
        </div>
        <div className="button-row">
          {nextRoute ? (
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate(nextRoute)}
            >
              继续下一关
            </button>
          ) : (
            <button
              type="button"
              className="primary-button"
              onClick={() =>
                navigate(
                  state.progress.exam.status === "available"
                    ? "/student/theme/road-safety/exam"
                    : "/student/theme/road-safety",
                )
              }
            >
              {state.progress.exam.status === "available" ? "进入主题考试" : "返回主题页"}
            </button>
          )}
          <button
            type="button"
            className="ghost-button"
            onClick={() => navigate("/student/theme/road-safety")}
          >
            返回主题页
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={() => navigate(`/student/theme/road-safety/level/${resolvedLevelId}`)}
          >
            重新挑战本关
          </button>
        </div>
      </section>

      {showExamUnlock ? (
        <section className="overlay-modal-backdrop">
          <article className="surface-card student-treasure-modal">
            <span className="section-block__eyebrow">主题考试已解锁</span>
            <h2>三关闯关学习已经全部完成</h2>
            <p>现在你可以直接进入主题考试，也可以稍后从主题页继续。</p>
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
                className="primary-button primary-button--playful"
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
