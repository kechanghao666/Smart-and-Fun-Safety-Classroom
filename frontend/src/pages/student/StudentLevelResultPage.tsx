import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { StudentAdventureHero } from "../../components/student/StudentAdventureHero";
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

  if (!isLevelId(levelId) || !result) {
    return (
      <section className="surface-card empty-state-card">
        <span className="section-block__eyebrow">关卡庆祝页</span>
        <h2>这关还没有通关记录</h2>
        <p>先完成关卡挑战，再回来领取这张通关卡。</p>
        <button
          type="button"
          className="primary-button"
          onClick={() => navigate("/student/theme/road-safety")}
        >
          返回主题地图
        </button>
      </section>
    );
  }

  return (
    <div className="page-stack student-page student-page--result">
      <StudentAdventureHero
        eyebrow="通关庆祝"
        title={result.levelId === "level-3" ? "第三关挑战完成" : "恭喜你成功通关"}
        description="这一关已经顺利完成，快来看看你拿到了几颗星。"
        bubbleTitle="通关小结"
        bubbleText={result.highlight}
        mascotLabel={`${result.stars}★`}
        mascotHint={result.caution}
        variant="result"
        accent={result.levelId === "level-3" ? "orange" : "mint"}
        stats={[
          { label: "通关分数", value: `${result.score} 分`, accent: "sky" },
          { label: "获得星星", value: `${result.stars} 颗`, accent: "orange" },
          { label: "当前积分", value: `${state.progress.points}`, accent: "mint" },
        ]}
        actions={
          <>
            {levelId !== "level-3" && nextLevelRoute ? (
              <button
                type="button"
                className="primary-button primary-button--playful"
                onClick={() => navigate(nextLevelRoute)}
              >
                去下一关
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
                {state.progress.exam.status === "available"
                  ? "去打开考试宝箱"
                  : "回到主题地图"}
              </button>
            )}
            <button
              type="button"
              className="ghost-button"
              onClick={() => navigate("/student/records")}
            >
              收进学习记录
            </button>
          </>
        }
      />

      <section className="student-card-grid student-card-grid--three">
        <article className="surface-card student-celebration-card student-celebration-card--sky">
          <span className="student-celebration-card__eyebrow">通关星级</span>
          <div className="student-result-stars">
            {[1, 2, 3].map((star) => (
              <span
                key={star}
                className={
                  star <= result.stars
                    ? "student-result-stars__item student-result-stars__item--on"
                    : "student-result-stars__item"
                }
              >
                ★
              </span>
            ))}
          </div>
          <p>{result.completedAt}</p>
        </article>

        <article className="surface-card student-celebration-card student-celebration-card--mint">
          <span className="student-celebration-card__eyebrow">做得真棒</span>
          <strong>{result.highlight}</strong>
          <p>这一关的安全要点已经被你牢牢记住了。</p>
        </article>

        <article className="surface-card student-celebration-card student-celebration-card--orange">
          <span className="student-celebration-card__eyebrow">下一次再注意</span>
          <strong>{result.caution}</strong>
          <p>带着这句提醒继续往前走，会更稳。</p>
        </article>
      </section>

      <section className="student-card-grid student-card-grid--two">
        <article className="surface-card student-reward-board">
          <div className="student-section-heading">
            <span className="section-block__eyebrow">奖励到帐</span>
            <h2>这次点亮了什么？</h2>
          </div>
          <div className="student-checklist">
            <div className="student-checklist__item">
              <span className="student-checklist__dot" />
              <span>当前积分：{state.progress.points}</span>
            </div>
            <div className="student-checklist__item">
              <span className="student-checklist__dot" />
              <span>徽章收藏：{state.progress.badges.join(" / ")}</span>
            </div>
            <div className="student-checklist__item">
              <span className="student-checklist__dot" />
              <span>
                {result.levelId === "level-3"
                  ? "三关通关后，考试宝箱也会一起点亮。"
                  : "继续往前闯，下一关还会带来新的奖励。"}
              </span>
            </div>
          </div>
        </article>

        <article className="surface-card student-link-board">
          <div className="student-section-heading">
            <span className="section-block__eyebrow">下一站</span>
            <h2>现在最适合做什么？</h2>
          </div>
          <div className="student-mini-links">
            {levelId !== "level-3" && nextLevelRoute ? (
              <button
                type="button"
                className="student-mini-link"
                onClick={() => navigate(nextLevelRoute)}
              >
                <strong>继续下一关</strong>
                <span>把地图继续往前点亮</span>
              </button>
            ) : (
              <button
                type="button"
                className="student-mini-link"
                onClick={() =>
                  navigate(
                    state.progress.exam.status === "available"
                      ? "/student/theme/road-safety/exam"
                      : "/student/theme/road-safety",
                  )
                }
              >
                <strong>
                  {state.progress.exam.status === "available"
                    ? "进入主题考试"
                    : "回到主题地图"}
                </strong>
                <span>继续完成这轮学习闭环</span>
              </button>
            )}
            <button
              type="button"
              className="student-mini-link"
              onClick={() => navigate("/student/records")}
            >
              <strong>查看学习记录</strong>
              <span>把这张通关卡收藏起来</span>
            </button>
          </div>
        </article>
      </section>

      {showExamUnlock ? (
        <section className="result-modal-backdrop">
          <article className="surface-card student-treasure-modal">
            <span className="section-block__eyebrow">宝箱已解锁</span>
            <h2>三关学习全部完成啦</h2>
            <p>现在可以打开考试宝箱，完成这一轮道路安全冒险。</p>
            <div className="student-treasure-modal__badge">考试宝箱</div>
            <div className="button-row">
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  setShowExamUnlock(false);
                  navigate("/student/theme/road-safety");
                }}
              >
                先回地图
              </button>
              <button
                type="button"
                className="primary-button primary-button--playful"
                onClick={() => navigate("/student/theme/road-safety/exam")}
              >
                立刻挑战
              </button>
            </div>
          </article>
        </section>
      ) : null}
    </div>
  );
}
