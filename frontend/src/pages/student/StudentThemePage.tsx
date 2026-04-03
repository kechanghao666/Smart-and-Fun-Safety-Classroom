import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StatusBadge } from "../../components/StatusBadge";
import { useAppState } from "../../state/AppState";
import type { LevelId } from "../../types";
import { useStudentAiScene } from "../../utils/useStudentAiScene";
import { buildGrowthSnapshot } from "../../utils/studentGrowth";
import { usePersistedState } from "../../utils/usePersistedState";

export function StudentThemePage() {
  const navigate = useNavigate();
  const { state } = useAppState();
  const completedLevels = state.progress.levels.filter(
    (level) => level.status === "completed",
  ).length;
  const growth = buildGrowthSnapshot(state);
  const nextLevel = state.progress.levels.find(
    (level) => level.status === "available",
  );
  const examUnlocked = state.progress.exam.status !== "locked";
  const examCompleted = state.progress.exam.status === "completed";
  const accountKey = state.sessionAccount ?? "student-demo";
  const [unlockAcknowledged, setUnlockAcknowledged] = usePersistedState<
    Record<string, boolean>
  >("student-theme-exam-unlock", {});
  const [showExamUnlock, setShowExamUnlock] = useState(false);

  const homeRoute =
    nextLevel?.status === "completed" && state.progress.levelResults[nextLevel.id]
      ? `/student/theme/road-safety/level/${nextLevel.id}/result`
      : nextLevel
        ? `/student/theme/road-safety/level/${nextLevel.id}`
        : examCompleted
          ? "/student/theme/road-safety/exam/result"
          : "/student/theme/road-safety/exam";

  const themeAiPrompt = useMemo(
    () =>
      `我正在学习道路安全教育主题，当前已完成 ${completedLevels} / 3 关，考试状态为 ${state.progress.exam.status}。请给我一句学习提醒，并告诉我现在最应该先做哪一步。`,
    [completedLevels, state.progress.exam.status],
  );

  const {
    isLoading: isHintLoading,
    message: hintMessage,
    notice: hintNotice,
    refresh: refreshHint,
  } = useStudentAiScene({
    prompt: themeAiPrompt,
    scene: "hint",
    levelId: nextLevel?.id as LevelId | undefined,
    fallbackText:
      "先确认当前最该完成的关卡，再按照“观察环境、判断风险、做出安全选择”的顺序进入学习。",
  });

  useEffect(() => {
    if (!examUnlocked) {
      if (unlockAcknowledged[accountKey]) {
        setUnlockAcknowledged((current) => ({
          ...current,
          [accountKey]: false,
        }));
      }
      setShowExamUnlock(false);
      return;
    }

    if (!examCompleted && !unlockAcknowledged[accountKey]) {
      setShowExamUnlock(true);
    }

    if (examCompleted) {
      setShowExamUnlock(false);
    }
  }, [
    accountKey,
    examCompleted,
    examUnlocked,
    setUnlockAcknowledged,
    unlockAcknowledged,
  ]);

  function acknowledgeUnlock(nextRoute?: string) {
    setUnlockAcknowledged((current) => ({
      ...current,
      [accountKey]: true,
    }));
    setShowExamUnlock(false);

    if (nextRoute) {
      navigate(nextRoute);
    }
  }

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--theme">
        <div>
          <span className="hero-banner__eyebrow">主题详情页</span>
          <h1>道路安全教育</h1>
          <p>
            本主题固定采用“三关闯关学习 - 主题考试 - 结果反馈”的闭环结构。先完成关卡学习，再进入考试和结果页完成本轮学习收口。
          </p>
        </div>

        <div className="hero-banner__actions">
          <button
            type="button"
            className="primary-button"
            onClick={() => navigate(homeRoute)}
          >
            继续当前学习
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={() => navigate("/student/records")}
          >
            查看学习记录
          </button>
        </div>
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card theme-overview-card">
          <span className="section-block__eyebrow">头图区</span>
          <h2>主题目标与当前状态</h2>
          <ul className="plain-list">
            <li>当前主题：道路安全教育</li>
            <li>已完成关卡：{completedLevels} / 3</li>
            <li>
              主题考试：
              {examCompleted ? "已完成" : examUnlocked ? "已解锁" : "未解锁"}
            </li>
            <li>最近学习位置：{state.progress.lastVisitedRoute}</li>
          </ul>
        </article>

        <article className="surface-card theme-overview-card">
          <span className="section-block__eyebrow">主题简介</span>
          <h2>进入主题前先知道学什么</h2>
          <ul className="plain-list">
            <li>第一关：观察并识别斑马线、信号灯、危险行为。</li>
            <li>第二关：沿着放学回家路线，在关键节点做出更安全的判断。</li>
            <li>第三关：完成公交、私家车、电动车场景下的出行防护准备。</li>
            <li>三关全部完成后，主题考试入口会自动点亮。</li>
          </ul>
        </article>
      </section>

      <section className="surface-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">流程区</span>
            <h2>主题流程总览</h2>
          </div>
        </div>

        <div className="flow-strip">
          <div
            className={
              completedLevels === 3 ? "flow-step flow-step--done" : "flow-step flow-step--active"
            }
          >
            三关学习
          </div>
          <div
            className={
              examCompleted
                ? "flow-step flow-step--done"
                : examUnlocked
                  ? "flow-step flow-step--active"
                  : "flow-step"
            }
          >
            主题考试
          </div>
          <div className={examCompleted ? "flow-step flow-step--done" : "flow-step"}>
            结果反馈
          </div>
        </div>
      </section>

      <section className="card-grid card-grid--three">
        <article className="surface-card ai-insight-card">
          <span className="section-block__eyebrow">AI 学习提醒</span>
          <div className="row-between">
            <h2>进入主题前先看一眼</h2>
            <span className="surface-tag">
              {isHintLoading
                ? "生成中"
                : state.authSource === "api"
                  ? "AI 已联调"
                  : "本地提示"}
            </span>
          </div>
          <p className="ai-insight-card__message">
            {isHintLoading ? "AI 正在整理本轮学习提醒..." : hintMessage}
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
              {isHintLoading ? "生成中..." : "刷新提醒"}
            </button>
            <Link className="ghost-button link-button" to="/student/ai">
              打开 AI 问答页
            </Link>
          </div>
        </article>

        <article className="surface-card theme-overview-card">
          <span className="section-block__eyebrow">成长展示区</span>
          <h2>当前人物成长状态</h2>
          <ul className="plain-list">
            <li>成长阶段：{growth.currentTier.title}</li>
            <li>当前外观：{growth.currentTier.appearance}</li>
            <li>能力标签：{growth.currentTier.ability}</li>
            <li>专属场景：{growth.currentTier.scene}</li>
            <li>
              下一阶段：
              {growth.nextTier
                ? `再获得 ${growth.pointsToNext} 分可进入 ${growth.nextTier.title}`
                : "当前阶段内容已全部点亮"}
            </li>
          </ul>
        </article>

        <article className="surface-card theme-overview-card">
          <span className="section-block__eyebrow">辅助按钮区</span>
          <h2>当前优先动作</h2>
          <ul className="plain-list">
            <li>
              {nextLevel
                ? `优先完成：${nextLevel.title}`
                : examCompleted
                  ? "优先查看考试结果和 AI 结果卡"
                  : "优先进入主题考试"}
            </li>
            <li>考试只会在三关全部完成后自动解锁。</li>
            <li>考试完成后会进入独立结果页、错题页和 AI 结果卡页。</li>
          </ul>
          <div className="button-row">
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate(homeRoute)}
            >
              前往当前重点
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => navigate("/student/growth")}
            >
              查看成长档案
            </button>
          </div>
        </article>
      </section>

      <section className="section-block">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">关卡入口区</span>
            <h2>三关学习入口</h2>
          </div>
        </div>

        <div className="card-grid card-grid--three">
          {state.progress.levels.map((level) => {
            const hasResult = Boolean(state.progress.levelResults[level.id]);
            const target =
              level.status === "completed" && hasResult
                ? `/student/theme/road-safety/level/${level.id}/result`
                : `/student/theme/road-safety/level/${level.id}`;

            return (
              <article key={level.id} className="surface-card level-card">
                <div className="level-card__header">
                  <div>
                    <span className="surface-tag">{level.focus}</span>
                    <h3>{level.title}</h3>
                  </div>
                  <StatusBadge status={level.status} />
                </div>
                <p>{level.description}</p>
                <ul className="plain-list">
                  <li>预计时长：{level.duration}</li>
                  <li>
                    {level.status === "locked"
                      ? "当前未解锁，需要先完成前一关。"
                      : level.status === "completed"
                        ? "本关已完成，可查看独立结算页或重新进入复习。"
                        : "当前可进入学习，完成后会自动跳转到独立结算页。"}
                  </li>
                </ul>
                <button
                  type="button"
                  className={level.status === "locked" ? "ghost-button" : "primary-button"}
                  disabled={level.status === "locked"}
                  onClick={() => navigate(target)}
                >
                  {level.status === "completed"
                    ? hasResult
                      ? "查看本关结算"
                      : "重新进入关卡"
                    : "进入本关"}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="card-grid card-grid--two">
        <article
          className={`surface-card exam-card ${
            examUnlocked ? "exam-card--unlocked" : "exam-card--locked"
          }`}
        >
          <div className="level-card__header">
            <div>
              <span className="surface-tag">考试入口区</span>
              <h3>主题考试</h3>
            </div>
            <StatusBadge status={state.progress.exam.status} />
          </div>
          <p>
            {examCompleted
              ? "考试已经完成，现在可以前往独立结果页、错题页和 AI 结果卡页继续收口。"
              : examUnlocked
                ? "三关学习已经完成，考试入口已解锁。"
                : "完成三关学习后，这个区域会自动点亮。"}
          </p>
          <div className="button-row">
            <button
              type="button"
              className={examUnlocked ? "primary-button" : "ghost-button"}
              disabled={!examUnlocked}
              onClick={() =>
                navigate(
                  examCompleted
                    ? "/student/theme/road-safety/exam/result"
                    : "/student/theme/road-safety/exam",
                )
              }
            >
              {examCompleted ? "查看考试结果" : "进入考试"}
            </button>
            {examCompleted ? (
              <Link
                className="ghost-button link-button"
                to="/student/theme/road-safety/wrong-questions"
              >
                错题回看
              </Link>
            ) : null}
          </div>
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">结果反馈去向</span>
          <h3>主题学习收口入口</h3>
          <div className="button-row">
            <Link className="ghost-button link-button" to="/student/ai-report">
              AI 结果卡页
            </Link>
            <Link className="ghost-button link-button" to="/student/records">
              学习记录页
            </Link>
            <Link className="ghost-button link-button" to="/student/home">
              返回首页
            </Link>
          </div>
        </article>
      </section>

      {showExamUnlock ? (
        <section className="overlay-modal-backdrop">
          <article className="surface-card overlay-modal">
            <span className="section-block__eyebrow">已解锁主题考试</span>
            <h2>三关学习已经全部完成</h2>
            <p>
              你已经完成道路安全主题的三关学习，现在可以进入主题考试，完成本轮学习闭环。
            </p>
            <div className="button-row">
              <button
                type="button"
                className="ghost-button"
                onClick={() => acknowledgeUnlock()}
              >
                稍后去完成
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => acknowledgeUnlock("/student/theme/road-safety/exam")}
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
