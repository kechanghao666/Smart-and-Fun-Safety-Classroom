import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StudentAdventureHero } from "../../components/student/StudentAdventureHero";
import { StudentMascotBubble } from "../../components/student/StudentMascotBubble";
import { StatusBadge } from "../../components/StatusBadge";
import { fetchStudentGrowth } from "../../services/student";
import { useAppState } from "../../state/AppState";
import type { LevelId, StudentGrowthResponse } from "../../types";
import { useApiResource } from "../../utils/useApiResource";
import { useStudentAiScene } from "../../utils/useStudentAiScene";
import {
  buildGrowthSnapshot,
  getGrowthSceneVisualClass,
} from "../../utils/studentGrowth";
import { usePersistedState } from "../../utils/usePersistedState";

export function StudentThemePage() {
  const navigate = useNavigate();
  const { state } = useAppState();
  const fallbackGrowth = buildGrowthSnapshot(state);
  const apiEnabled = state.authSource === "api" && Boolean(state.authToken);
  const completedLevels = state.progress.levels.filter(
    (level) => level.status === "completed",
  ).length;
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

  const fallbackGrowthData: StudentGrowthResponse = {
    characterName: state.studentProfile?.nickname ?? "安全学员",
    linkedAiRole: "安全小助手",
    totalGrowthPoints: fallbackGrowth.points,
    nextLevelTarget: fallbackGrowth.nextTier?.minPoints ?? null,
    nextLevelRemaining: fallbackGrowth.nextTier ? fallbackGrowth.pointsToNext : null,
    nextLevelLabel: fallbackGrowth.nextTier?.title ?? null,
    streakDays: fallbackGrowth.currentStreakDays,
    stageLabel: fallbackGrowth.currentTier.title,
    growthSummary: fallbackGrowth.currentTier.description,
    currentAppearance: fallbackGrowth.selectedAppearance,
    currentScene: fallbackGrowth.selectedScene,
    currentAbilityTag: fallbackGrowth.currentTier.ability,
    dimensions: fallbackGrowth.dimensions.map((item) => ({
      id:
        item.id === "observe"
          ? "appearance"
          : item.id === "judge"
            ? "safety"
            : "scene",
      label: item.label,
      points: item.score,
      level: 0,
      progressPercent: item.score,
      currentUnlockLabel: item.label,
      nextUnlockLabel: null,
    })),
    unlockedAppearances: fallbackGrowth.appearanceOptions
      .filter((item) => item.unlocked)
      .map((item) => item.label),
    unlockedAbilityTags: [fallbackGrowth.currentTier.ability],
    unlockedScenes: fallbackGrowth.sceneOptions
      .filter((item) => item.unlocked)
      .map((item) => item.label),
    history: [],
  };

  const { data: growthData } = useApiResource({
    enabled: apiEnabled,
    fallbackData: fallbackGrowthData,
    fetcher: () => fetchStudentGrowth(state.authToken!),
    dependencies: [
      state.authToken,
      state.progress.points,
      state.progress.rewardProgress.reviewedWrongQuestionIds.join("|"),
    ],
    fallbackMessage: "主题页成长信息暂时无法同步，当前展示学习中的成长概览。",
  });

  const sceneVisualClass = getGrowthSceneVisualClass(growthData.currentScene);
  const homeRoute = nextLevel
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
      "先确认当前最该完成的关卡，再按照观察、判断、选择的顺序进入学习。",
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
  }, [accountKey, examCompleted, examUnlocked, setUnlockAcknowledged, unlockAcknowledged]);

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
    <div className="page-stack student-page student-page--theme">
      <StudentAdventureHero
        eyebrow="主题地图"
        title="道路安全冒险地图"
        description="跟着地图走完三关，再去打开考试宝箱。"
        bubbleTitle="出发提示"
        bubbleText={
          nextLevel ? `先挑战 ${nextLevel.title}` : examCompleted ? "去看结果卡" : "考试已经解锁"
        }
        mascotLabel={state.studentProfile?.avatarLabel.slice(0, 1) ?? "安"}
        mascotHint={`${growthData.stageLabel} · ${growthData.currentAbilityTag}`}
        variant="theme"
        accent="mint"
        stats={[
          { label: "已完成", value: `${completedLevels}/3`, accent: "sky" },
          {
            label: "考试宝箱",
            value: examCompleted ? "已完成" : examUnlocked ? "已解锁" : "未解锁",
            accent: "orange",
          },
          { label: "成长外观", value: growthData.currentAppearance, accent: "mint" },
        ]}
        actions={
          <>
            <button
              type="button"
              className="primary-button primary-button--playful"
              onClick={() => navigate(homeRoute)}
            >
              前往当前重点
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => navigate("/student/records")}
            >
              看学习记录
            </button>
          </>
        }
        aside={
          <div className={`student-theme-hero-card ${sceneVisualClass}`}>
            <span>当前角色</span>
            <strong>{growthData.currentAppearance}</strong>
            <p>{growthData.currentScene}</p>
          </div>
        }
      />

      <section className="surface-card student-theme-map-panel">
        <div className="student-section-heading">
          <span className="section-block__eyebrow">冒险路线</span>
          <h2>跟着这条路往前走</h2>
        </div>

        <div className="student-theme-map">
          <div className="student-theme-map__step student-theme-map__step--active">
            <strong>第一站</strong>
            <span>观察路口</span>
          </div>
          <div
            className={
              completedLevels >= 1
                ? "student-theme-map__step student-theme-map__step--active"
                : "student-theme-map__step"
            }
          >
            <strong>第二站</strong>
            <span>路线挑战</span>
          </div>
          <div
            className={
              completedLevels >= 2
                ? "student-theme-map__step student-theme-map__step--active"
                : "student-theme-map__step"
            }
          >
            <strong>第三站</strong>
            <span>出行守护</span>
          </div>
          <div
            className={
              examUnlocked
                ? "student-theme-map__step student-theme-map__step--treasure"
                : "student-theme-map__step student-theme-map__step--locked"
            }
          >
            <strong>宝箱</strong>
            <span>{examCompleted ? "挑战完成" : examUnlocked ? "考试已开" : "等待解锁"}</span>
          </div>
        </div>
      </section>

      <section className="student-card-grid student-card-grid--two">
        <StudentMascotBubble
          eyebrow="AI 学习提醒"
          title="出发前先听一句"
          message={isHintLoading ? "AI 正在整理本轮学习提醒..." : hintMessage}
          accent="mint"
          notice={hintNotice}
          actions={
            <>
              <button
                type="button"
                className="ghost-button"
                onClick={() => void refreshHint()}
                disabled={isHintLoading}
              >
                {isHintLoading ? "生成中..." : "换一句提醒"}
              </button>
              <Link className="ghost-button link-button" to="/student/ai">
                打开 AI 助手
              </Link>
            </>
          }
        />

        <article className="surface-card student-growth-card">
          <span className="section-block__eyebrow">成长展示</span>
          <h2>你现在的冒险形态</h2>
          <div className={`growth-showcase-card__preview ${sceneVisualClass}`}>
            <strong>{growthData.currentAppearance}</strong>
            <p>{growthData.currentScene}</p>
          </div>
          <div className="student-checklist">
            <div className="student-checklist__item">
              <span className="student-checklist__dot" />
              <span>成长阶段：{growthData.stageLabel}</span>
            </div>
            <div className="student-checklist__item">
              <span className="student-checklist__dot" />
              <span>能力标签：{growthData.currentAbilityTag}</span>
            </div>
            <div className="student-checklist__item">
              <span className="student-checklist__dot" />
              <span>
                {growthData.nextLevelRemaining !== null
                  ? `再得 ${growthData.nextLevelRemaining} 分就能继续升级`
                  : "当前阶段已经全部点亮"}
              </span>
            </div>
          </div>
        </article>
      </section>

      <section className="student-card-grid student-card-grid--three">
        {state.progress.levels.map((level, index) => {
          const hasResult = Boolean(state.progress.levelResults[level.id]);
          const target =
            level.status === "completed" && hasResult
              ? `/student/theme/road-safety/level/${level.id}/result`
              : `/student/theme/road-safety/level/${level.id}`;
          const shortGoal =
            index === 0
              ? "找出路口里的安全线索"
              : index === 1
                ? "一路做出更安全的判断"
                : "把装备放回正确场景";

          return (
            <article key={level.id} className="surface-card student-level-entry-card">
              <div className="student-level-entry-card__visual">
                <span>{index + 1}</span>
              </div>
              <div className="student-level-entry-card__content">
                <div className="student-level-entry-card__top">
                  <span className="surface-tag">{level.focus}</span>
                  <StatusBadge status={level.status} />
                </div>
                <h3>{level.title}</h3>
                <p>{shortGoal}</p>
                <div className="student-level-entry-card__meta">
                  <span>{level.duration}</span>
                  <span>
                    {level.status === "completed"
                      ? "已通关"
                      : level.status === "locked"
                        ? "未解锁"
                        : "可进入"}
                  </span>
                </div>
                <button
                  type="button"
                  className={
                    level.status === "locked"
                      ? "ghost-button"
                      : "primary-button primary-button--playful"
                  }
                  disabled={level.status === "locked"}
                  onClick={() => navigate(target)}
                >
                  {level.status === "completed"
                    ? hasResult
                      ? "查看庆祝页"
                      : "重新进入"
                    : "开始挑战"}
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <section className="student-card-grid student-card-grid--two">
        <article
          className={`surface-card student-treasure-card ${
            examUnlocked ? "student-treasure-card--open" : "student-treasure-card--locked"
          }`}
        >
          <div className="student-section-heading">
            <span className="section-block__eyebrow">考试宝箱</span>
            <h2>三关结束后在这里挑战</h2>
          </div>
          <p>
            {examCompleted
              ? "考试已经完成，现在可以去看错题回看和结果卡。"
              : examUnlocked
                ? "宝箱已经点亮，快去完成主题考试。"
                : "先通过三关，考试宝箱才会打开。"}
          </p>
          <div className="button-row">
            <button
              type="button"
              className={
                examUnlocked ? "primary-button primary-button--playful" : "ghost-button"
              }
              disabled={!examUnlocked}
              onClick={() =>
                navigate(
                  examCompleted
                    ? "/student/theme/road-safety/exam/result"
                    : "/student/theme/road-safety/exam",
                )
              }
            >
              {examCompleted ? "查看考试结果" : "打开宝箱"}
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

        <article className="surface-card student-link-board">
          <div className="student-section-heading">
            <span className="section-block__eyebrow">收尾入口</span>
            <h2>完成主题后去哪里</h2>
          </div>
          <div className="student-mini-links">
            <Link className="student-mini-link student-mini-link--link" to="/student/ai-report">
              <strong>AI 结果卡</strong>
              <span>看亮点和下一步</span>
            </Link>
            <Link className="student-mini-link student-mini-link--link" to="/student/records">
              <strong>学习记录</strong>
              <span>回顾整个主题旅程</span>
            </Link>
            <Link className="student-mini-link student-mini-link--link" to="/student/home">
              <strong>返回首页</strong>
              <span>从首页重新出发</span>
            </Link>
          </div>
        </article>
      </section>

      {showExamUnlock ? (
        <section className="overlay-modal-backdrop">
          <article className="surface-card student-treasure-modal">
            <span className="section-block__eyebrow">宝箱已解锁</span>
            <h2>三关学习全部完成啦</h2>
            <p>现在可以打开考试宝箱，完成这轮道路安全冒险。</p>
            <div className="student-treasure-modal__badge">奖章宝箱</div>
            <div className="button-row">
              <button
                type="button"
                className="ghost-button"
                onClick={() => acknowledgeUnlock()}
              >
                稍后去
              </button>
              <button
                type="button"
                className="primary-button primary-button--playful"
                onClick={() => acknowledgeUnlock("/student/theme/road-safety/exam")}
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
